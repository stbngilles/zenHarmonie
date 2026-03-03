const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Clearing existing services...')
    await prisma.service.deleteMany({})

    const services = [
        // Massage Anti-Migraine
        { category: 'Massage Anti-Migraine', name: 'Séance 30 min', duration: 30, price: 40, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },
        { category: 'Massage Anti-Migraine', name: 'Séance 1h', duration: 60, price: 70, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },

        // Massage Relaxant Dos
        { category: 'Massage Relaxant Dos', name: 'Séance 30 min', duration: 30, price: 40, description: 'Détente profonde, respiration, posture' },
        { category: 'Massage Relaxant Dos', name: 'Séance 1h', duration: 60, price: 70, description: 'Détente profonde, respiration, posture' },

        // Massage Dos – Nuque – Épaules
        { category: 'Massage Dos – Nuque – Épaules', name: 'Séance 30 min', duration: 30, price: 40, description: 'Tensions posturales, stress, prévention des migraines' },
        { category: 'Massage Dos – Nuque – Épaules', name: 'Séance 1h', duration: 60, price: 70, description: 'Tensions posturales, stress, prévention des migraines' },

        // Massage Jambes Légères
        { category: 'Massage Jambes Légères', name: 'Séance 30 min', duration: 30, price: 40, description: 'Drainage, circulation, soulagement immédiat' },
        { category: 'Massage Jambes Légères', name: 'Séance 1h', duration: 60, price: 70, description: 'Drainage, circulation, soulagement immédiat' },

        // Massage Corps Complet Personnalisé
        { category: 'Massage Corps Complet', name: 'Séance 1h', duration: 60, price: 70, description: 'Relaxation globale, équilibre corps-esprit' },
        { category: 'Massage Corps Complet', name: 'Séance 1h30', duration: 90, price: 100, description: 'Relaxation globale, équilibre corps-esprit' },

        // Massage Récupération Sportive
        { category: 'Massage Sportif', name: 'Séance 30 min', duration: 30, price: 40, description: 'Performance, régénération, prévention des blessures' },
        { category: 'Massage Sportif', name: 'Séance 1h', duration: 60, price: 70, description: 'Performance, régénération, prévention des blessures' },
        { category: 'Massage Sportif', name: 'Séance 1h30', duration: 90, price: 100, description: 'Performance, régénération, prévention des blessures' },
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
