import Hero from '@/components/Hero'
import Bio from '@/components/Bio'
import Partners from '@/components/Partners'
import Services from '@/components/Services'
import Info from '@/components/Info'

export default function Home() {
    return (
        <main className="min-h-screen bg-zen-bg">
            <Hero />
            <Services />
            <Bio />
            <Partners />
            <Info />
        </main>
    )
}
