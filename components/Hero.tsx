import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
    return (
        <section className="relative bg-zen-bg overflow-x-hidden pt-12 pb-16 md:pt-16 md:pb-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

                    {/* Text Content */}
                    <div className="flex-1 space-y-8 z-10 text-center md:text-left">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-zen-light/50 border border-zen-light text-zen-primary text-sm font-semibold tracking-wide uppercase">
                            Bien-être & Performance
                        </div>

                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-zen-primary leading-tight">
                            Un équilibre entre <br />
                            <span className="italic text-zen-accent font-light">le corps</span> et l'esprit
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto md:mx-0 leading-relaxed">
                            Retrouvez votre vitalité grâce à une approche holistique du massage sportif et de la relaxation.
                            Prenez soin de vous avec Pierre.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link
                                href="/reservation"
                                className="px-8 py-4 bg-zen-primary text-white rounded-full font-semibold hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Réserver une séance →
                            </Link>
                            <Link
                                href="#services"
                                className="px-8 py-4 bg-white text-zen-primary border border-zen-light rounded-full font-semibold hover:bg-zen-light/30 transition-colors"
                            >
                                Découvrir les soins
                            </Link>
                        </div>

                        {/* Social Proof / Trust Indicators */}
                        <div className="pt-6 flex items-center justify-center md:justify-start gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative">
                                        <Image
                                            src={`https://randomuser.me/api/portraits/men/${i + 20}.jpg`}
                                            alt="Client"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-gray-500">
                                <span className="font-bold text-zen-primary">Excellent</span> • Recommandé par +500 clients satisfaits
                            </div>
                        </div>
                    </div>

                    {/* Image Content */}
                    <div className="flex-1 relative w-full aspect-square md:aspect-[4/5] max-w-lg">
                        {/* Decorative Element */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-zen-secondary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-zen-primary/10 rounded-full blur-3xl"></div>

                        <div className="relative h-full w-full rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                            <Image
                                src="/Lieu_1.JPG"
                                alt="Massage Therapy"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-zen-primary/20 to-transparent"></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
