
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCalendarEvent, findCalendarEvent } from '@/lib/googleCalendar';

// Cron job to verify that all future confirmed bookings are in Google Calendar
export async function GET(request: Request) {
    // Protect cron endpoint with a secret token
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        if (!process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Google Calendar not configured' }, { status: 500 });
        }

        // 1. Get all future confirmed bookings
        const bookings = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                startDateTime: {
                    gte: new Date(), // Future bookings only
                },
            },
            include: {
                service: true,
            },
        });

        const results = {
            total: bookings.length,
            synced: 0,
            recovered: 0,
            errors: 0,
            details: [] as string[]
        };

        for (const booking of bookings) {
            try {
                // If we already have an event ID, verify it exists (optional, maybe too expensive to check every single one every time)
                // For now, let's focus on those MISSING an ID
                if (!booking.googleEventId) {
                    // Check if an event already exists in GCal to avoid duplicates
                    // (e.g. maybe we created it but failed to save the ID to DB)
                    const summary = `${booking.customerName} - ${booking.service.name}`;
                    const existingEvent = await findCalendarEvent(booking.startDateTime, booking.endDateTime, summary);

                    let googleEventId;

                    if (existingEvent) {
                        googleEventId = existingEvent.id;
                        results.details.push(`Found existing event for ${booking.id}, linking it.`);
                    } else {
                        // Create it
                        const newEvent = await createCalendarEvent({
                            summary: summary,
                            description: `Client: ${booking.customerName}\nEmail: ${booking.customerEmail}\nTel: ${booking.customerPhone}\nSoin: ${booking.service.name}`,
                            start: booking.startDateTime,
                            end: booking.endDateTime,
                            attendeeEmail: booking.customerEmail
                        });
                        googleEventId = newEvent.id;
                        results.details.push(`Created new event for ${booking.id}.`);
                    }

                    if (googleEventId) {
                        await prisma.booking.update({
                            where: { id: booking.id },
                            data: { googleEventId: googleEventId }
                        });
                        results.recovered++;
                    }
                } else {
                    results.synced++;
                }
            } catch (err: any) {
                console.error(`Error syncing booking ${booking.id}:`, err);
                results.errors++;
                results.details.push(`Error for ${booking.id}: ${err.message || JSON.stringify(err)}`);
            }
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Sync Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
