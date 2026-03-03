import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Build the secret key from env — no fallback: if JWT_SECRET is missing, all verifications will fail
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')

// Security headers added to every admin response
function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'DENY') // Prevent clickjacking via iframes
    response.headers.set('X-Content-Type-Options', 'nosniff') // Prevent MIME sniffing
    response.headers.set('X-XSS-Protection', '1; mode=block') // Enable XSS filter in older browsers
    response.headers.set('Referrer-Policy', 'no-referrer') // Don't leak URL in Referer header
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()') // Deny sensitive permissions
    return response
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect all /admin routes (except login api) and /api/admin routes
    const isAdminPage = pathname.startsWith('/admin')
    const isAdminApi = pathname.startsWith('/api/admin')

    if (isAdminPage || isAdminApi) {
        const token = request.cookies.get('admin_token')?.value

        if (!token) {
            return handleUnauthorized(request, isAdminApi)
        }

        try {
            // Verify token
            await jwtVerify(token, secret)
            // ✅ Authorized — pass request but add security headers
            const response = NextResponse.next()
            return addSecurityHeaders(response)
        } catch (error) {
            // Token is invalid or expired
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
            console.warn(`[Admin Middleware] Invalid/expired token from IP: ${ip} path: ${pathname}`)
            return handleUnauthorized(request, isAdminApi)
        }
    }

    return NextResponse.next()
}

function handleUnauthorized(request: NextRequest, isApi: boolean) {
    if (isApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Redirect unauthenticated page requests to home
    // The admin login form is part of /admin itself, so we only redirect
    // if the user is not exactly on /admin (the login page).
    const { pathname } = request.nextUrl
    if (pathname === '/admin' || pathname === '/admin/') {
        // Allow the /admin login page to render so the user can log in
        return NextResponse.next()
    }
    // Any other /admin/* sub-page — redirect to the login page
    return NextResponse.redirect(new URL('/admin', request.url))
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
}
