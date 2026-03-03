import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LRUCache } from 'lru-cache'

// =====================================================================
// ⚡ SERVER-SIDE CACHE - 2 minutes TTL
// If the same date is requested multiple times within 2 minutes,
// the result is served from memory — no DB or Google Calendar call.
// =====================================================================
type BusySlot = { start: string; end: string }

const availabilityCache = new LRUCache<string, BusySlot[]>({
    max: 100, // cache up to 100 different date queries
    ttl: 1000 * 60 * 2, // 2 minutes TTL
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    if (!startParam || !endParam) {
        return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 })
    }

    // Use the start date as the cache key (one key per day)
    const cacheKey = startParam

    // Return cached result immediately if available
    const cached = availabilityCache.get(cacheKey)
    if (cached) {
        console.log(`[Availability] Cache HIT for ${cacheKey}`)
        return NextResponse.json(cached)
    }

    console.log(`[Availability] Cache MISS for ${cacheKey} — fetching...`)

    const start = new Date(startParam)
    const end = new Date(endParam)

    try {
        // ⚡ Run both DB queries in PARALLEL (not sequentially)
        const [bookings, blockedSlots] = await Promise.all([
            prisma.booking.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'PENDING'] },
                    startDateTime: { lt: end },
                    endDateTime: { gt: start }
                },
                select: { startDateTime: true, endDateTime: true } // Only fetch what we need
            }),
            prisma.blockedSlot.findMany({
                where: {
                    start: { lt: end },
                    end: { gt: start }
                },
                select: { start: true, end: true }
            })
        ])

        const busySlots: BusySlot[] = [
            ...bookings.map(booking => ({
                start: booking.startDateTime.toISOString(),
                // Add 15 min buffer to the end time
                end: new Date(booking.endDateTime.getTime() + 15 * 60 * 1000).toISOString()
            })),
            ...blockedSlots.map(slot => ({
                start: slot.start.toISOString(),
                end: slot.end.toISOString()
            }))
        ]

        // Fetch Google Calendar busy slots if configured
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
            try {
                const { getBusySlots } = await import('@/lib/googleCalendar')
                const googleBusy = await getBusySlots(start, end)
                busySlots.push(...googleBusy.map(slot => ({
                    start: slot.start as string,
                    end: slot.end as string
                })).filter(s => s.start && s.end))
            } catch (calError) {
                console.error("Google Calendar Sync Error:", calError)
            }
        }

        // Store in cache before returning
        availabilityCache.set(cacheKey, busySlots)
        console.log(`[Availability] Cached result for ${cacheKey} (${busySlots.length} busy slots)`)

        return NextResponse.json(busySlots)
    } catch (error) {
        console.error("Calendar API Error:", error)
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }
}
