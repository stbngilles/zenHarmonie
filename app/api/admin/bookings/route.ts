import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { startDateTime: 'desc' },
            include: { service: true }
        })
        return NextResponse.json(bookings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }
}
