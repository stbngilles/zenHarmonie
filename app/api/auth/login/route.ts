import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { LRUCache } from 'lru-cache'
import crypto from 'crypto'

// =====================================================================
// 🔐 BRUTE FORCE PROTECTION
// Max 5 failed attempts per IP per 15 minutes → lockout
// =====================================================================
const loginAttempts = new LRUCache<string, number>({
    max: 500,
    ttl: 1000 * 60 * 15, // 15 minute window
})

const MAX_ATTEMPTS = 5

// =====================================================================
// 🔐 TIMING-SAFE COMPARISON
// Prevents timing side-channel attacks (even if password is wrong,
// the function always takes the same amount of time to respond)
// =====================================================================
function timingSafeCompare(a: string, b: string): boolean {
    try {
        const bufA = Buffer.from(a)
        const bufB = Buffer.from(b)
        if (bufA.length !== bufB.length) {
            // Different lengths = different passwords.
            // Still run the comparison on a dummy buffer to avoid
            // leaking information via response time.
            crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length))
            return false
        }
        return crypto.timingSafeEqual(bufA, bufB)
    } catch {
        return false
    }
}

export async function POST(request: Request) {
    try {
        // =====================================================================
        // 🔐 ARTIFICIAL DELAY: slows down automated brute-force scripts
        // Even a legitimate login takes at least 300ms to respond
        // =====================================================================
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown-ip'

        // Check lockout
        const attempts = loginAttempts.get(ip) ?? 0
        if (attempts >= MAX_ATTEMPTS) {
            console.warn(`[Admin Login] IP ${ip} is locked out (${attempts} failed attempts)`)
            return NextResponse.json(
                { error: 'Trop de tentatives. Ressayez dans 15 minutes.' },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { password } = body

        if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            console.error('ADMIN_PASSWORD or JWT_SECRET environment variable is not set')
            return NextResponse.json({ error: 'Erreur de configuration serveur' }, { status: 500 })
        }

        const correctPassword = process.env.ADMIN_PASSWORD

        if (timingSafeCompare(password ?? '', correctPassword)) {
            // ✅ Correct password — reset attempt counter
            loginAttempts.delete(ip)

            // Create JWT token using `jose`
            const secret = new TextEncoder().encode(process.env.JWT_SECRET)

            const alg = 'HS256'
            const jwks = await new SignJWT({ role: 'admin' })
                .setProtectedHeader({ alg })
                .setIssuedAt()
                .setExpirationTime('2h')
                .sign(secret)

            // Set cookie securely
            const response = NextResponse.json({ success: true })
            response.cookies.set('admin_token', jwks, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 2, // 2 hours
                path: '/'
            })

            console.log(`[Admin Login] Successful login from IP: ${ip}`)
            return response
        }

        // ❌ Wrong password — increment counter
        loginAttempts.set(ip, attempts + 1)
        const remaining = MAX_ATTEMPTS - (attempts + 1)
        console.warn(`[Admin Login] Failed attempt from IP: ${ip} (${attempts + 1}/${MAX_ATTEMPTS})`)

        return NextResponse.json(
            { error: `Mot de passe incorrect. ${remaining > 0 ? `${remaining} tentative(s) restante(s).` : 'Compte verrouillé.'}` },
            { status: 401 }
        )
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
