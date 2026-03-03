'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zen-bg flex flex-col items-center justify-center p-6 text-center">
            {/* Décoration zen */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-zen-primary blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] rounded-full bg-zen-secondary blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h1 className="text-9xl font-serif font-bold text-zen-primary/20 select-none">404</h1>
                    <h2 className="text-4xl font-serif font-bold text-zen-primary">Oups ! Vous vous êtes égaré...</h2>
                    <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                        Comme lors d'une séance de méditation, il arrive parfois de perdre le fil.
                        Cette page n'existe pas, mais le chemin vers la détente est juste à côté.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 bg-zen-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <Home size={20} />
                        Retour à l'accueil
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 bg-white text-zen-primary border-2 border-zen-primary/10 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all hover:border-zen-primary/30"
                    >
                        <ArrowLeft size={20} />
                        Page précédente
                    </button>
                </div>
            </div>
        </div>
    )
}
