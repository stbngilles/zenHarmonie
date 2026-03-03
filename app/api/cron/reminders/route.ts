import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

// Update this to your verified domain email once Resend validation is complete
const SENDER_EMAIL = 'ZenHarmonie <onboarding@resend.dev>'

export async function GET(request: Request) {
    // Protect cron endpoint with a secret token
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // In sandbox mode, we can only send to verified emails. Use this to override for testing.
    const testOverride = process.env.TEST_EMAIL_RECIPIENT

    try {
        const now = new Date()
        const tomorrowStart = new Date(now)
        tomorrowStart.setDate(now.getDate() + 1)
        tomorrowStart.setHours(0, 0, 0, 0)

        const tomorrowEnd = new Date(tomorrowStart)
        tomorrowEnd.setHours(23, 59, 59, 999)

        const bookings = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                startDateTime: {
                    gte: tomorrowStart,
                    lte: tomorrowEnd
                }
            },
            include: { service: true }
        })

        if (bookings.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: "Aucun rappel pour demain." })
        }

        const results = await Promise.allSettled(bookings.map(async (booking) => {
            const timeStr = booking.startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const toEmail = testOverride || booking.customerEmail

            const emailSubject = testOverride
                ? `[TEST - pour ${booking.customerEmail}] Rappel de votre rendez-vous`
                : 'Rappel : Votre rendez-vous chez ZenHarmonie est demain'

            return resend.emails.send({
                from: SENDER_EMAIL,
                to: toEmail,
                subject: emailSubject,
                html: `
                    <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #1E3F35;">Petit rappel pour demain !</h2>
                        <p>Bonjour ${booking.customerName},</p>
                        <p>Ceci est un rappel automatique pour votre séance <strong>${booking.service.name}</strong> prévue <strong>demain à ${timeStr}</strong>.</p>
                        
                        <div style="background-color: #f6fdf9; border-left: 4px solid #1E3F35; padding: 15px; margin: 20px 0;">
                            <strong>Adresse du cabinet :</strong><br>
                            Rue des Juifs 11, 1357 Hélécine
                        </div>
                        
                        <p>Le solde de la séance (50%) sera à régler sur place, comme convenu lors de la réservation.</p>
                        <p>Si vous avez un empêchement de dernière minute, merci de nous prévenir au plus vite.</p>
                        <p>À demain pour votre moment de détente,</p>
                        <p><strong>Pierre — ZenHarmonie</strong></p>
                    </div>
                `
            })
        }))

        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        console.log(`[Cron] Reminders complete. Sent: ${succeeded}, Failed: ${failed}`)

        return NextResponse.json({ success: true, processed: bookings.length, succeeded, failed })

    } catch (error) {
        console.error('Reminder Cron Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
