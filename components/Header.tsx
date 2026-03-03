import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                {/* Brand & Partner Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-2xl font-serif font-bold text-zen-primary tracking-tight">
                        ZenHarmonie
                    </Link>
                    <span className="text-gray-300">|</span>
                    <div className="relative w-12 h-12">
                        <Image
                            src="/florescence-logo.png"
                            alt="Florescence"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/#services" className="text-sm font-semibold text-gray-600 hover:text-zen-primary transition-colors">
                        Soins
                    </Link>
                    <Link href="/#bio" className="text-sm font-semibold text-gray-600 hover:text-zen-primary transition-colors">
                        À propos
                    </Link>
                    <Link href="/#contact" className="text-sm font-semibold text-gray-600 hover:text-zen-primary transition-colors">
                        Contact & Accès
                    </Link>
                </nav>

                {/* CTA Button */}
                <Link
                    href="/reservation"
                    className="bg-zen-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-zen-primary/90 transition-colors shadow-sm"
                >
                    Réserver
                </Link>
            </div>
        </header>
    )
}
