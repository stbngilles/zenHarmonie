
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Boltonne1%2B%25*@localhost:5432/zenharmonie?schema=public"
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Deleting all bookings...')
    const deletedBookings = await prisma.booking.deleteMany({})
    console.log(`Deleted ${deletedBookings.count} bookings.`)

    console.log('Deleting all blocked slots...')
    const deletedSlots = await prisma.blockedSlot.deleteMany({})
    console.log(`Deleted ${deletedSlots.count} blocked slots.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
