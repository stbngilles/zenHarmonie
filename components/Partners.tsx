import Image from 'next/image'
import Link from 'next/link'
import { Leaf, Sprout, HeartHandshake, ArrowRight } from 'lucide-react'

export default function Partners() {
    return (
        <section id="partners" className="py-20 md:py-32 bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 md:px-6">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-zen-primary mb-4">
                        Florescence
                    </h2>
                    <p className="text-sm font-bold tracking-widest text-zen-accent uppercase">
                        Un partenaire aligné avec nos valeurs
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">

                    {/* Image Side */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative aspect-[4/5] md:aspect-square w-full rounded-[2rem] overflow-hidden shadow-2xl">
                            <Image
                                src="/produits.jpg"
                                alt="Produits Florescence"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div> {/* Added missing closing tag for Image Side */}

                    {/* Content Side */}
                    <div className="w-full lg:w-1/2 space-y-10">
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                            Lorsque l’on travaille avec le corps, la qualité des produits est essentielle. C’est pourquoi nous avons choisi de collaborer avec Florescence, une maison dirigée par un couple passionné et aromathérapeute.
                        </p>

                        <div>
                            <h3 className="font-serif text-2xl font-bold text-zen-primary mb-6">Ce qui nous a convaincus ? Trois piliers fondamentaux :</h3>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-5">
                                    <div className="bg-zen-bg p-3 rounded-xl shrink-0 border border-zen-accent/10">
                                        <Leaf className="w-6 h-6 text-zen-accent" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-zen-primary">Respect du produit</h4>
                                        <p className="text-gray-500 mt-1">Pureté et intégrité préservées dans chaque flacon.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-5">
                                    <div className="bg-zen-bg p-3 rounded-xl shrink-0 border border-zen-accent/10">
                                        <Sprout className="w-6 h-6 text-zen-accent" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-zen-primary">Respect de la nature</h4>
                                        <p className="text-gray-500 mt-1">Des pratiques durables et responsables, de la graine à l'huile.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-5">
                                    <div className="bg-zen-bg p-3 rounded-xl shrink-0 border border-zen-accent/10">
                                        <HeartHandshake className="w-6 h-6 text-zen-accent" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-zen-primary">Respect de l’humain</h4>
                                        <p className="text-gray-500 mt-1">Une collaboration éthique avec des producteurs locaux et engagés.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Conclusion Box */}
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
                            <p className="text-gray-700 leading-relaxed text-center sm:text-left">
                                Une grande partie de leur gamme est certifiée bio, avec une sélection rigoureuse garantissant des produits de haute qualité. Notre choix est simple : <strong className="font-semibold text-zen-primary">travailler avec des produits authentiques, efficaces et respectueux</strong> pour vous offrir le meilleur dans chaque soin.
                            </p>
                        </div>

                    </div>
                </div> {/* Added missing closing tag for flex container */}

                {/* CTA Section (Full Width) - Moved from Bio */}
                <div className="mt-20 md:mt-32 max-w-2xl mx-auto text-center bg-gray-50 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-serif font-bold text-zen-primary mb-4">Besoin de conseils ?</h3>
                    <p className="text-gray-600 mb-8">
                        Si vous hésitez sur le soin le plus adapté à votre situation, n'hésitez pas à me contacter ou à réserver une consultation bilan.
                    </p>
                    <Link
                        href="#contact"
                        className="inline-flex items-center gap-2 text-zen-primary font-bold hover:text-zen-accent transition-colors border-b-2 border-zen-primary hover:border-zen-accent pb-1"
                    >
                        Me contacter
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

            </div>
        </section>
    )
}
