require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { service: true }
        })
        console.log('Recent bookings:', JSON.stringify(bookings, null, 2))
    } catch (e) {
        console.error('Check failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

check()
