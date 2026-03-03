const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Clearing existing services...')
    await prisma.service.deleteMany({})

    const services = [
        // Massage Anti-Migraine
        { id: 'mock-1', category: 'Massage Anti-Migraine', name: 'Séance 30 min', duration: 30, price: 40, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },
        { id: 'mock-2', category: 'Massage Anti-Migraine', name: 'Séance 1h', duration: 60, price: 70, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },

        // Massage Relaxant Dos
        { id: 'mock-3', category: 'Massage Relaxant Dos', name: 'Séance 30 min', duration: 30, price: 40, description: 'Détente profonde, respiration, posture' },
        { id: 'mock-4', category: 'Massage Relaxant Dos', name: 'Séance 1h', duration: 60, price: 70, description: 'Détente profonde, respiration, posture' },

        // Massage Dos – Nuque – Épaules
        { id: 'mock-5', category: 'Massage Dos – Nuque – Épaules', name: 'Séance 30 min', duration: 30, price: 40, description: 'Tensions posturales, stress, prévention des migraines' },
        { id: 'mock-6', category: 'Massage Dos – Nuque – Épaules', name: 'Séance 1h', duration: 60, price: 70, description: 'Tensions posturales, stress, prévention des migraines' },

        // Massage Jambes Légères
        { id: 'mock-7', category: 'Massage Jambes Légères', name: 'Séance 30 min', duration: 30, price: 40, description: 'Drainage, circulation, soulagement immédiat' },
        { id: 'mock-8', category: 'Massage Jambes Légères', name: 'Séance 1h', duration: 60, price: 70, description: 'Drainage, circulation, soulagement immédiat' },

        // Massage Corps Complet Personnalisé
        { id: 'mock-9', category: 'Massage Corps Complet', name: 'Séance 1h', duration: 60, price: 70, description: 'Relaxation globale, équilibre corps-esprit' },
        { id: 'mock-10', category: 'Massage Corps Complet', name: 'Séance 1h30', duration: 90, price: 100, description: 'Relaxation globale, équilibre corps-esprit' },

        // Massage Récupération Sportive
        { id: 'mock-11', category: 'Massage Sportif', name: 'Séance 30 min', duration: 30, price: 40, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-12', category: 'Massage Sportif', name: 'Séance 1h', duration: 60, price: 70, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-13', category: 'Massage Sportif', name: 'Séance 1h30', duration: 90, price: 100, description: 'Performance, régénération, prévention des blessures' },
    ]

    console.log('Start seeding...')
    for (const s of services) {
        const service = await prisma.service.create({
            data: s,
        })
        console.log(`Created service with id: ${service.id}`)
    }
    console.log('Seeding finished.')
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
