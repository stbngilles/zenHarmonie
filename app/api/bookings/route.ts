import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LRUCache } from 'lru-cache'
import Stripe from 'stripe'

// Rate limiters should be global to persist across requests
const rateLimit = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 60,
})

const BookingSchema = z.object({
    serviceId: z.string().min(1, 'L\'ID du service est requis'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, 'Format de date invalide'),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format d\'heure invalide (HH:mm)'),
    customerName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Le nom est trop long'),
    customerEmail: z.string().email('Format d\'email invalide').max(150),
    customerPhone: z.string().min(8, 'Le numéro de téléphone est trop court').max(20),
    paymentIntentId: z.string().min(1, 'Le paiement est requis pour finaliser une réservation')
})

// Update this to your verified domain email once Resend validation is complete
const SENDER_EMAIL = 'ZenHarmonie <onboarding@resend.dev>'

export async function POST(request: Request) {
    // Initialize Stripe inside the handler to avoid build-time errors when env vars are missing
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia' as any,
    })

    try {
        // Enforce Rate Limit based on IP
        const ip = request.headers.get('x-forwarded-for') ?? 'unknown-ip'
        const currentUsage = (rateLimit.get(ip) as number) || 0

        if (currentUsage >= 5) {
            return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
        }
        rateLimit.set(ip, currentUsage + 1)

        const body = await request.json()
        const validatedData = BookingSchema.safeParse(body)

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Données de réservation invalides', details: validatedData.error.format() }, { status: 400 })
        }

        const {
            serviceId,
            date,
            time,
            customerName,
            customerEmail,
            customerPhone,
            paymentIntentId
        } = validatedData.data

        // =====================================================================
        // 🔐 SECURITY LAYER 1: Verify payment with Stripe server-to-server
        // Never trust the browser — always verify payment status via Stripe API
        // =====================================================================
        let stripePaymentIntent: Stripe.PaymentIntent | null = null
        let retries = 3
        while (retries > 0) {
            try {
                stripePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
                if (stripePaymentIntent.status === 'succeeded') {
                    break // SUCCESS
                } else if (stripePaymentIntent.status === 'processing') {
                    console.log(`PaymentIntent ${paymentIntentId} is still processing. Retrying in 1s... (${retries} retries left)`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    retries--
                } else {
                    break // failed or requires action, no point in retrying
                }
            } catch (stripeError) {
                console.error('Stripe PaymentIntent lookup failed:', stripeError)
                return NextResponse.json({ error: 'Paiement invalide ou inexistant.' }, { status: 400 })
            }
        }

        if (!stripePaymentIntent || stripePaymentIntent.status !== 'succeeded') {
            const actualStatus = stripePaymentIntent?.status || 'unknown'
            console.warn(`PaymentIntent ${paymentIntentId} has status: ${actualStatus}`)
            return NextResponse.json({ error: `Le paiement n'a pas encore été validé par Stripe (Statut: ${actualStatus}).` }, { status: 402 })
        }

        // =====================================================================
        // 🔐 SECURITY LAYER 2: Verify this PaymentIntent has not been used before
        // Prevents replay attacks (reusing a previous payment for a new booking)
        // =====================================================================
        const existingPayment = await prisma.booking.findFirst({
            where: { stripePaymentId: paymentIntentId }
        })
        if (existingPayment) {
            console.warn(`PaymentIntent ${paymentIntentId} was already used for booking ${existingPayment.id}`)
            return NextResponse.json({ error: 'Ce paiement a déjà été utilisé.' }, { status: 409 })
        }

        // 1. Calculate Start/End
        const [hours, minutes] = time.split(':').map(Number)
        const startDateTime = new Date(date)
        startDateTime.setHours(hours, minutes, 0, 0)

        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        const endDateTime = new Date(startDateTime)
        endDateTime.setMinutes(startDateTime.getMinutes() + service.duration)

        // =====================================================================
        // 🔐 SECURITY LAYER 3: Verify the amount paid matches the service price
        // The PaymentIntent metadata contains serviceId set by our own backend
        // =====================================================================
        const expectedAmountCents = Math.round((service.price * 0.50) * 100)
        const paidAmountCents = stripePaymentIntent.amount_received
        const metaServiceId = stripePaymentIntent.metadata?.serviceId

        if (paidAmountCents < expectedAmountCents) {
            console.error(`Amount mismatch: paid ${paidAmountCents}¢, expected ${expectedAmountCents}¢`)
            return NextResponse.json({ error: 'Le montant payé ne correspond pas au service.' }, { status: 402 })
        }

        if (metaServiceId && metaServiceId !== serviceId) {
            console.error(`Service ID mismatch: PI metadata has ${metaServiceId}, request has ${serviceId}`)
            return NextResponse.json({ error: 'Incohérence entre le service payé et le service demandé.' }, { status: 400 })
        }

        // 2. DOUBLE CHECK AVAILABILITY (Crucial for race conditions)
        // Check if any existing CONFIRMED or PENDING booking overlaps
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        const existingBooking = await prisma.booking.findFirst({
            where: {
                status: { in: ['CONFIRMED', 'PENDING'] },
                AND: [
                    { startDateTime: { lt: endDateTime } },
                    { endDateTime: { gt: startDateTime } }
                ]
            }
        })

        if (existingBooking) {
            return NextResponse.json({ error: 'Slot already taken' }, { status: 409 })
        }

        // Check blocked slots too
        const blockedSlot = await prisma.blockedSlot.findFirst({
            where: {
                start: { lt: endDateTime },
                end: { gt: startDateTime }
            }
        })

        if (blockedSlot) {
            return NextResponse.json({ error: 'Slot is blocked' }, { status: 409 })
        }

        // 3. Create Booking
        console.log("Creating booking in DB...")
        const booking = await prisma.booking.create({
            data: {
                startDateTime,
                endDateTime,
                customerName,
                customerEmail,
                customerPhone,
                serviceId,
                stripePaymentId: paymentIntentId,
                status: 'CONFIRMED'
            }
        })
        console.log("Booking created:", booking.id)

        // 4. Async operations (Google Calendar & Email)
        // We'll wrap these in a way that they don't block the main response if they take too long
        const runAsyncTasks = async () => {
            // 4.1 Sync to Google Calendar
            if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
                try {
                    console.log("Syncing to Google Calendar...")
                    const { createCalendarEvent } = await import('@/lib/googleCalendar')

                    // Add a 8 second timeout to Google Calendar sync
                    const googleEvent = await Promise.race([
                        createCalendarEvent({
                            summary: `${customerName} - ${service.name}`,
                            description: `Client: ${customerName}\nEmail: ${customerEmail}\nTel: ${customerPhone}\nSoin: ${service.name}`,
                            start: startDateTime,
                            end: endDateTime,
                            attendeeEmail: customerEmail
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Google Calendar Timeout')), 8000))
                    ]) as any

                    console.log("Google Calendar synced:", googleEvent.id)
                    if (googleEvent.id) {
                        await prisma.booking.update({
                            where: { id: booking.id },
                            data: { googleEventId: googleEvent.id }
                        })
                    }
                } catch (calError) {
                    console.error("Google Calendar Sync Error (Non-blocking):", calError)
                }
            }

            // 4.2 Send Emails
            if (process.env.RESEND_API_KEY) {
                try {
                    console.log("Sending emails...")
                    const { Resend } = await import('resend')
                    const resend = new Resend(process.env.RESEND_API_KEY)

                    const dateStr = startDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    const timeStr = startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                    // In sandbox mode (onboarding@resend.dev), you can only send to the Resend account owner email.
                    // Set TEST_EMAIL_RECIPIENT in .env to override. Remove it once domain is verified.
                    const testOverride = process.env.TEST_EMAIL_RECIPIENT
                    const merchantEmail = process.env.MERCHANT_EMAIL || 'zenharmonie.massotherapeute@gmail.com'

                    const clientEmailRecipient = testOverride || customerEmail
                    const merchantEmailRecipient = testOverride || merchantEmail

                    // Generate secure cancellation token
                    const crypto = await import('crypto')
                    const secret = process.env.JWT_SECRET || 'fallback_secret'
                    const cancelToken = crypto.createHmac('sha256', secret).update(booking.id).digest('hex')

                    // Build App URL dynamically
                    const protocol = request.headers.get('x-forwarded-proto') || 'http'
                    const host = request.headers.get('host') || 'localhost:3000'
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

                    const cancelUrl = `${appUrl}/reservation/cancel?id=${booking.id}&token=${cancelToken}`

                    // Email to client
                    await Promise.race([
                        resend.emails.send({
                            from: SENDER_EMAIL,
                            to: clientEmailRecipient,
                            subject: testOverride
                                ? `[TEST - pour ${customerEmail}] Confirmation de réservation`
                                : 'Confirmation de votre réservation chez ZenHarmonie',
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                                    <h2 style="color: #1E3F35; text-align: center; margin-bottom: 20px;">Réservation Confirmée</h2>
                                    ${testOverride ? `<p style="color:orange; text-align: center;"><strong>[MODE TEST — destinataire réel : ${customerEmail}]</strong></p>` : ''}
                                    <p>Bonjour ${customerName},</p>
                                    <p>Votre réservation pour le soin <strong>${service.name}</strong> a bien été confirmée.</p>
                                    
                                    <div style="background-color: #f6fdf9; border-left: 4px solid #1E3F35; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0 0 5px 0;"><strong>Date :</strong> ${dateStr} à ${timeStr}</p>
                                        <p style="margin: 0;"><strong>Adresse :</strong> Rue des Juifs 11, 1357 Hélécine</p>
                                    </div>
                                    
                                    <p>Un acompte de 50% a été réglé. Le solde sera à payer sur place.</p>
                                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
                                    
                                    <p style="font-size: 14px; color: #666;">
                                        <strong>En cas d'imprévu :</strong> Vous pouvez annuler votre rendez-vous en cliquant sur le lien ci-dessous. 
                                        Veuillez noter que l'acompte de 50% n'est pas remboursable, conformément à nos conditions.
                                    </p>
                                    <p style="text-align: center; margin: 30px 0;">
                                        <a href="${cancelUrl}" style="background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; display: inline-block;">
                                            Annuler mon rendez-vous
                                        </a>
                                    </p>
                                    
                                    <p>Merci et à bientôt,</p>
                                    <p><strong>Pierre — ZenHarmonie</strong></p>
                                </div>
                            `
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Email Timeout')), 8000))
                    ])
                    console.log("Client email sent to:", clientEmailRecipient)

                    // Notification to merchant (Pierre)
                    await Promise.race([
                        resend.emails.send({
                            from: SENDER_EMAIL,
                            to: merchantEmailRecipient,
                            subject: `[ZenHarmonie] Nouvelle réservation — ${customerName}`,
                            html: `
                                <h2>Nouvelle réservation reçue</h2>
                                <table>
                                    <tr><td><strong>Client</strong></td><td>${customerName}</td></tr>
                                    <tr><td><strong>Email</strong></td><td>${customerEmail}</td></tr>
                                    <tr><td><strong>Téléphone</strong></td><td>${customerPhone}</td></tr>
                                    <tr><td><strong>Soin</strong></td><td>${service.name}</td></tr>
                                    <tr><td><strong>Date</strong></td><td>${dateStr} à ${timeStr}</td></tr>
                                    <tr><td><strong>Acompte payé</strong></td><td>Oui (50%)</td></tr>
                                </table>
                            `
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Merchant Email Timeout')), 8000))
                    ])
                    console.log("Merchant email sent to:", merchantEmailRecipient)
                } catch (emailError) {
                    console.error("Failed to send email (Non-blocking):", emailError)
                }
            }
        }

        // Trigger async tasks but don't await them to speed up response
        // Note: In some serverless environments like Vercel, background tasks might be killed 
        // after response is sent if not using waitUntil (Next.js 15+).
        // For now, we await them but with a timeout to prevent absolute hanging.
        await runAsyncTasks().catch(e => console.error("Async tasks failed:", e))

        return NextResponse.json(booking)

    } catch (error) {
        console.error('Booking Creation Error:', error)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }
}
