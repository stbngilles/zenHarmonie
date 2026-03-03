import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateSlotSchema = z.object({
    start: z.string().min(1, "Date de début requise"),
    end: z.string().min(1, "Date de fin requise"),
    reason: z.string().optional()
}).refine(data => {
    const dStart = new Date(data.start)
    const dEnd = new Date(data.end)
    return dStart < dEnd
}, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["end"]
})

const DeleteSlotSchema = z.object({
    id: z.string().min(1, "L'ID du créneau est requis")
})

export async function GET(request: Request) {
    try {
        const slots = await prisma.blockedSlot.findMany({
            where: {
                end: { gt: new Date() } // Only future or current slots
            },
            orderBy: { start: 'asc' }
        })
        return NextResponse.json(slots)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = CreateSlotSchema.safeParse(body)

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Données invalides', details: validatedData.error.format() }, { status: 400 })
        }

        const { start, end, reason } = validatedData.data
        const startDate = new Date(start)
        const endDate = new Date(end)

        let googleEventId = null

        // Sync with Google Calendar
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
            try {
                const { createCalendarEvent } = await import('@/lib/googleCalendar')
                const event = await createCalendarEvent({
                    summary: `Indisponible${reason ? ` : ${reason}` : ''}`,
                    description: 'Créneau bloqué depuis le tableau de bord.',
                    start: startDate,
                    end: endDate,
                    attendeeEmail: '', // No attendee for blocked slots
                })
                googleEventId = event.id || null
                console.log("Blocked slot synced to Google Calendar:", googleEventId)
            } catch (calError) {
                console.error("Failed to sync blocked slot to Google Calendar (Non-blocking):", calError)
            }
        }

        const slot = await prisma.blockedSlot.create({
            data: {
                start: startDate,
                end: endDate,
                reason,
                googleEventId
            }
        })
        return NextResponse.json(slot)
    } catch (error) {
        console.error("Error creating blocked slot:", error)
        return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json()
        const validatedData = DeleteSlotSchema.safeParse(body)

        if (!validatedData.success) {
            return NextResponse.json({ error: 'ID invalide', details: validatedData.error.format() }, { status: 400 })
        }

        const { id } = validatedData.data

        // Find the slot to get the googleEventId
        const slot = await prisma.blockedSlot.findUnique({ where: { id } })

        if (!slot) {
            return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
        }

        // Delete from Google Calendar if an event ID exists
        if (slot.googleEventId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
            try {
                const { deleteCalendarEvent } = await import('@/lib/googleCalendar')
                await deleteCalendarEvent(slot.googleEventId)
                console.log("Deleted blocked slot from Google Calendar:", slot.googleEventId)
            } catch (calError) {
                console.error("Failed to delete blocked slot from Google Calendar (Non-blocking):", calError)
            }
        }

        await prisma.blockedSlot.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting blocked slot:", error)
        return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    }
}
