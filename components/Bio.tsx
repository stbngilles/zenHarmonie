import Image from 'next/image'
import Link from 'next/link'

export default function Bio() {
    return (
        <section id="bio" className="py-20 md:py-32 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">

                    {/* Image / Experience Badge */}
                    <div className="flex-1 relative w-full max-w-lg">
                        {/* Badge - Redesigned */}
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl shadow-xl border border-white/50 animate-fade-in-up">
                            <div className="flex flex-col items-center text-center">
                                <span className="text-3xl md:text-4xl font-serif font-bold text-zen-primary leading-none">24</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-zen-accent uppercase tracking-widest mt-1.5 border-t border-zen-secondary/30 pt-1.5 w-full">Années d'expérience</span>
                            </div>
                        </div>

                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/Profile.JPG"
                                alt="Pierre - Massothérapeute"
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Quote Overlay */}
                        <div className="absolute bottom-8 left-8 right-8 bg-black/60 backdrop-blur-sm p-6 rounded-xl text-white">
                            <p className="italic font-light text-lg">"Le mouvement est la clé de la guérison."</p>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="h-px w-8 bg-zen-accent"></span>
                                <span className="text-sm font-bold text-zen-accent uppercase tracking-widest">Pierre - Massothérapeute</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-zen-primary">
                                De l'athlète au <br /> thérapeute
                            </h2>
                        </div>

                        <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                            <p>
                                Ancien basketteur professionnel avec <strong className="text-zen-primary">24 ans de carrière</strong> sur les parquets, j'ai appris l'importance cruciale de la récupération et de l'écoute du corps.
                            </p>
                            <p>
                                Aujourd'hui, je mets cette expertise au service de votre bien-être. Que vous soyez sportif de haut niveau ou simplement en quête d'équilibre au quotidien, mon approche holistique combine techniques de récupération sportive et relaxation profonde.
                            </p>
                            <p>
                                Mon objectif ? Vous aider à retrouver une harmonie durable entre votre corps et votre esprit, dans un cadre zen et naturel.
                            </p>
                        </div>


                    </div>

                </div>
            </div>
        </section>
    )
}
