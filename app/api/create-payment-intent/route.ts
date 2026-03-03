import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LRUCache } from 'lru-cache'

// Lazy Stripe init — évite le crash lors du build Next.js (env vars absentes)
function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY manquante dans les variables d\'environnement')
    return new Stripe(key, { apiVersion: '2025-01-27.acacia' as any })
}

// Rate limiter: max 10 payment intent creations per IP per hour
const rateLimit = new LRUCache<string, number>({
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
})

const PaymentIntentSchema = z.object({
    serviceId: z.string().min(1, 'serviceId est requis'),
})

export async function POST(request: Request) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') ?? 'unknown-ip'
        const currentUsage = rateLimit.get(ip) ?? 0
        if (currentUsage >= 10) {
            return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
        }
        rateLimit.set(ip, currentUsage + 1)

        // Validate input
        const body = await request.json()
        const parsed = PaymentIntentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Données invalides', details: parsed.error.format() }, { status: 400 })
        }

        const { serviceId } = parsed.data

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Calculate 50% deposit
        const depositAmount = Math.round((service.price * 0.50) * 100) // Amount in cents

        const paymentIntent = await getStripe().paymentIntents.create({
            amount: depositAmount,
            currency: 'eur',
            payment_method_types: ['card'], // Only accept card payments
            metadata: {
                serviceId: service.id,
                serviceName: service.name,
            }
        })

        return NextResponse.json({
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: depositAmount / 100 // Return amount in EUR for display
        })

    } catch (error) {
        console.error('Stripe Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
