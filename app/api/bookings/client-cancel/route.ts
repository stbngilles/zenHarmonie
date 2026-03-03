import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// Update this to your verified domain email once Resend validation is complete
const SENDER_EMAIL = 'ZenHarmonie <onboarding@resend.dev>'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, token } = body

        if (!id || !token) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
        }

        // =====================================================================
        // 🔐 SECURITY: Verify the HMAC token to ensure the request is legit
        // =====================================================================
        const secret = process.env.JWT_SECRET || 'fallback_secret'
        const expectedToken = crypto.createHmac('sha256', secret).update(id).digest('hex')

        try {
            const bufToken = Buffer.from(token)
            const bufExpected = Buffer.from(expectedToken)
            if (bufToken.length !== bufExpected.length || !crypto.timingSafeEqual(bufToken, bufExpected)) {
                return NextResponse.json({ error: 'Lien d\'annulation invalide ou corrompu' }, { status: 403 })
            }
        } catch (e) {
            return NextResponse.json({ error: 'Format de token invalide' }, { status: 403 })
        }

        // Fetch the booking
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { service: true }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
        }

        if (booking.status === 'CANCELLED') {
            return NextResponse.json({ message: 'Cette réservation est déjà annulée.' }, { status: 200 })
        }

        // Proceed to cancel
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })

        // 1. Delete from Google Calendar if linked
        if (booking.googleEventId && process.env.GOOGLE_PRIVATE_KEY) {
            try {
                const { deleteCalendarEvent } = await import('@/lib/googleCalendar')
                await deleteCalendarEvent(booking.googleEventId)
            } catch (error) {
                console.error("Failed to sync cancellation with Google Calendar:", error)
            }
        }

        // 2. Send Emails via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)

                const dateStr = booking.startDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                const timeStr = booking.startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                const testOverride = process.env.TEST_EMAIL_RECIPIENT
                const merchantEmail = process.env.MERCHANT_EMAIL || 'zenharmonie.massotherapeute@gmail.com'

                const clientEmailRecipient = testOverride || booking.customerEmail
                const merchantEmailRecipient = testOverride || merchantEmail

                // Email to Client
                await resend.emails.send({
                    from: SENDER_EMAIL,
                    to: clientEmailRecipient,
                    subject: testOverride
                        ? `[TEST - pour ${booking.customerEmail}] Confirmation de votre annulation`
                        : 'Confirmation de votre annulation',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                            <h2 style="color: #1E3F35; text-align: center; margin-bottom: 20px;">Annulation Confirmée</h2>
                            <p>Bonjour ${booking.customerName},</p>
                            <p>Nous vous confirmons l'annulation de votre rendez-vous pour le soin <strong>${booking.service.name}</strong> du <strong>${dateStr} à ${timeStr}</strong>.</p>
                            
                            <div style="background-color: #fca5a5; background-opacity: 0.1; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                                    <strong>Rappel :</strong> Conformément à nos conditions, l'acompte de 50% versé lors de la réservation n'est pas remboursé.
                                </p>
                            </div>
                            
                            <p>Si vous souhaitez reprendre rendez-vous ultérieurement pour un moment de détente, vous pourrez le faire via notre site web.</p>
                            
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
                            <p style="margin: 0;">Cordialement,</p>
                            <p style="margin: 5px 0 0 0;"><strong>Pierre — ZenHarmonie</strong></p>
                        </div>
                    `
                })

                // Notice to Merchant
                await resend.emails.send({
                    from: SENDER_EMAIL,
                    to: merchantEmailRecipient,
                    subject: `[ZenHarmonie] Annulation par le client — ${booking.customerName}`,
                    html: `
                        <h2>Une réservation a été annulée par le client</h2>
                        <p>Le client a utilisé le lien d'annulation présent dans son email.</p>
                        <table>
                            <tr><td><strong>Client</strong></td><td>${booking.customerName}</td></tr>
                            <tr><td><strong>Email</strong></td><td>${booking.customerEmail}</td></tr>
                            <tr><td><strong>Téléphone</strong></td><td>${booking.customerPhone}</td></tr>
                            <tr><td><strong>Soin</strong></td><td>${booking.service.name}</td></tr>
                            <tr><td><strong>Date</strong></td><td>${dateStr} à ${timeStr}</td></tr>
                            <tr><td><strong>Acompte</strong></td><td>Conservé (non remboursé)</td></tr>
                        </table>
                    `
                })

            } catch (emailError) {
                console.error("Failed to send client cancellation emails:", emailError)
            }
        }

        return NextResponse.json({ success: true, message: 'Réservation annulée avec succès' })
    } catch (error) {
        console.error('Client Cancellation Error:', error)
        return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 })
    }
}
