import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const services = await prisma.service.findMany()
        if (services.length > 0) {
            return NextResponse.json(services)
        }
    } catch (error) {
        console.error("Database connection failed or empty, using mock data:", error)
    }

    // Fallback mock data if DB is empty or fails
    const mockServices = [
        { id: 'mock-1', name: 'Massage Anti-Migraine (30 min)', duration: 30, price: 40, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },
        { id: 'mock-2', name: 'Massage Anti-Migraine (1h)', duration: 60, price: 70, description: 'Approche ciblée des céphalées et de l’hyperactivité nerveuse' },

        { id: 'mock-3', name: 'Massage Relaxant Dos (30 min)', duration: 30, price: 40, description: 'Détente profonde, respiration, posture' },
        { id: 'mock-4', name: 'Massage Relaxant Dos (1h)', duration: 60, price: 70, description: 'Détente profonde, respiration, posture' },

        { id: 'mock-5', name: 'Massage Dos – Nuque – Épaules (30 min)', duration: 30, price: 40, description: 'Tensions posturales, stress, prévention des migraines' },
        { id: 'mock-6', name: 'Massage Dos – Nuque – Épaules (1h)', duration: 60, price: 70, description: 'Tensions posturales, stress, prévention des migraines' },

        { id: 'mock-7', name: 'Massage Jambes Légères (30 min)', duration: 30, price: 40, description: 'Drainage, circulation, soulagement immédiat' },
        { id: 'mock-8', name: 'Massage Jambes Légères (1h)', duration: 60, price: 70, description: 'Drainage, circulation, soulagement immédiat' },

        { id: 'mock-9', name: 'Massage Corps Complet Personnalisé (1h)', duration: 60, price: 70, description: 'Relaxation globale, équilibre corps-esprit' },
        { id: 'mock-10', name: 'Massage Corps Complet Personnalisé (1h30)', duration: 90, price: 100, description: 'Relaxation globale, équilibre corps-esprit' },

        { id: 'mock-11', name: 'Massage Récupération Sportive (30 min)', duration: 30, price: 40, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-12', name: 'Massage Récupération Sportive (1h)', duration: 60, price: 70, description: 'Performance, régénération, prévention des blessures' },
        { id: 'mock-13', name: 'Massage Récupération Sportive (1h30)', duration: 90, price: 100, description: 'Performance, régénération, prévention des blessures' },
    ]

    return NextResponse.json(mockServices)
}
