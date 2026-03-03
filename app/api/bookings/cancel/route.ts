import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CancelBookingSchema = z.object({
    bookingId: z.string().min(1, 'L\'identifiant de réservation est requis')
})

// Update this to your verified domain email once Resend validation is complete
const SENDER_EMAIL = 'ZenHarmonie <onboarding@resend.dev>'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = CancelBookingSchema.safeParse(body)

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Identifiant invalide', details: validatedData.error.format() }, { status: 400 })
        }

        const { bookingId } = validatedData.data

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' },
            include: { service: true }
        })

        // Delete from Google Calendar if linked
        if (booking.googleEventId && process.env.GOOGLE_PRIVATE_KEY) {
            try {
                const { deleteCalendarEvent } = await import('@/lib/googleCalendar')
                await deleteCalendarEvent(booking.googleEventId)
            } catch (error) {
                console.error("Failed to sync cancellation with Google Calendar:", error)
            }
        }

        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)

                const dateStr = booking.startDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                const timeStr = booking.startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                await resend.emails.send({
                    from: SENDER_EMAIL,
                    to: booking.customerEmail,
                    subject: 'Annulation de votre rendez-vous chez ZenHarmonie',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                            <h2 style="color: #1E3F35; text-align: center; margin-bottom: 20px;">Rendez-vous annulé</h2>
                            <p>Bonjour ${booking.customerName},</p>
                            <p>À notre plus grand regret, votre rendez-vous pour le soin <strong>${booking.service.name}</strong> prévu le <strong>${dateStr} à ${timeStr}</strong> a dû être annulé.</p>
                            
                            <div style="background-color: #f6fdf9; border-left: 4px solid #1E3F35; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px;">
                                    Si vous n'êtes pas à l'origine de cette annulation ou si vous souhaitez reprogrammer votre séance, n'hésitez pas à nous contacter ou à réserver à nouveau via notre site.
                                </p>
                            </div>
                            
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
                            <p style="margin: 0;">Cordialement,</p>
                            <p style="margin: 5px 0 0 0;"><strong>Pierre — ZenHarmonie</strong></p>
                        </div>
                    `
                })
            } catch (emailError) {
                console.error("Failed to send cancellation email:", emailError)
            }
        }

        return NextResponse.json(booking)
    } catch (error) {
        console.error('Cancellation Error:', error)
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }
}
