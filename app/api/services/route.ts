import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    console.log("Fetching services...")
    try {
        const services = await prisma.service.findMany()
        console.log(`Found ${services.length} services in database.`)
        if (services.length > 0) {
            return NextResponse.json(services)
        }
        console.log("Database is empty, using fallback.")
    } catch (error) {
        console.error("Database connection failed, using mock data:", error)
    }

    // Fallback mock data if DB is empty or fails
    const mockServices = [
        { id: 'mock-1', category: 'Massage Anti-Migraine', name: 'Massage Anti-Migraine (30 min)', duration: 30, price: 40, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },
        { id: 'mock-2', category: 'Massage Anti-Migraine', name: 'Massage Anti-Migraine (1h)', duration: 60, price: 70, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },

        { id: 'mock-3', category: 'Massage Relaxant Dos', name: 'Massage Relaxant Dos (30 min)', duration: 30, price: 40, description: 'Détente profonde, respiration, posture' },
        { id: 'mock-4', category: 'Massage Relaxant Dos', name: 'Massage Relaxant Dos (1h)', duration: 60, price: 70, description: 'Détente profonde, respiration, posture' },

        { id: 'mock-5', category: 'Massage Dos – Nuque – Épaules', name: 'Massage Dos – Nuque – Épaules (30 min)', duration: 30, price: 40, description: 'Tensions posturales, stress, prévention des migraines' },
        { id: 'mock-6', category: 'Massage Dos – Nuque – Épaules', name: 'Massage Dos – Nuque – Épaules (1h)', duration: 60, price: 70, description: 'Tensions posturales, stress, prévention des migraines' },

        { id: 'mock-7', category: 'Massage Jambes Légères', name: 'Massage Jambes Légères (30 min)', duration: 30, price: 40, description: 'Drainage, circulation, soulagement immédiat' },
        { id: 'mock-8', category: 'Massage Jambes Légères', name: 'Massage Jambes Légères (1h)', duration: 60, price: 70, description: 'Drainage, circulation, soulagement immédiat' },

        { id: 'mock-9', category: 'Massage Corps Complet', name: 'Massage Corps Complet Personnalisé (1h)', duration: 60, price: 70, description: 'Relaxation globale, équilibre corps-esprit' },
        { id: 'mock-10', category: 'Massage Corps Complet', name: 'Massage Corps Complet Personnalisé (1h30)', duration: 90, price: 100, description: 'Relaxation globale, équilibre corps-esprit' },

        { id: 'mock-11', category: 'Massage Récupération Sportive', name: 'Massage Récupération Sportive (30 min)', duration: 30, price: 40, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-12', category: 'Massage Récupération Sportive', name: 'Massage Récupération Sportive (1h)', duration: 60, price: 70, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-13', category: 'Massage Récupération Sportive', name: 'Massage Récupération Sportive (1h30)', duration: 90, price: 100, description: 'Performance, régénération, prévention des blessures' },
    ]

    return NextResponse.json(mockServices)
}
