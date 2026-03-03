import type { Metadata } from 'next'
import './globals.css'

import Header from '@/components/Header'
import Footer from '@/components/Footer'



export const metadata: Metadata = {
    title: 'ZenHarmonie - Massothérapie Bien-être & Sportive',
    description: 'Massothérapie professionnelle orientée bien-être, prévention et récupération à Hélécine.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" className="scroll-smooth">
            <body className="font-sans antialiased text-gray-900 leading-relaxed tracking-normal">
                <Header />
                <main className="pt-20">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    )
}
