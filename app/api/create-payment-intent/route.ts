import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LRUCache } from 'lru-cache'

// Rate limiter: max 10 payment intent creations per IP per hour
const rateLimit = new LRUCache<string, number>({
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
})

const PaymentIntentSchema = z.object({
    serviceId: z.string().min(1, 'serviceId est requis'),
})

export async function POST(request: Request) {
    // Initialize Stripe inside the handler to avoid build-time errors when env vars are missing
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia' as any,
    })

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

        let service = null
        if (serviceId.startsWith('mock-')) {
            // Mock fallback to allow testing even if DB is empty
            const mockServices: Record<string, { name: string, price: number }> = {
                'mock-1': { name: 'Massage Anti-Migraine (30 min)', price: 40 },
                'mock-2': { name: 'Massage Anti-Migraine (1h)', price: 70 },
                'mock-3': { name: 'Massage Relaxant Dos (30 min)', price: 40 },
                'mock-4': { name: 'Massage Relaxant Dos (1h)', price: 70 },
                'mock-5': { name: 'Massage Dos – Nuque – Épaules (30 min)', price: 40 },
                'mock-6': { name: 'Massage Dos – Nuque – Épaules (1h)', price: 70 },
                'mock-7': { name: 'Massage Jambes Légères (30 min)', price: 40 },
                'mock-8': { name: 'Massage Jambes Légères (1h)', price: 70 },
                'mock-9': { name: 'Massage Corps Complet Personnalisé (1h)', price: 70 },
                'mock-10': { name: 'Massage Corps Complet Personnalisé (1h30)', price: 100 },
                'mock-11': { name: 'Massage Récupération Sportive (30 min)', price: 40 },
                'mock-12': { name: 'Massage Récupération Sportive (1h)', price: 70 },
                'mock-13': { name: 'Massage Récupération Sportive (1h30)', price: 100 },
            }
            const mock = mockServices[serviceId as keyof typeof mockServices]
            if (mock) {
                service = { id: serviceId, name: mock.name, price: mock.price }
            }
        }

        if (!service) {
            service = await prisma.service.findUnique({
                where: { id: serviceId },
            })
        }

        if (!service) {
            return NextResponse.json({ error: 'Service introuvable' }, { status: 404 })
        }

        // Calculate 50% deposit
        const depositAmount = Math.round((service.price * 0.50) * 100) // Amount in cents

        const paymentIntent = await stripe.paymentIntents.create({
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

    } catch (error: any) {
        console.error('Payment Intent API Error:', error)
        return NextResponse.json({
            error: 'Erreur Serveur Interne',
            message: error.message
        }, { status: 500 })
    }
}
