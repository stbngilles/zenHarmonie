'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Check, ShieldAlert } from 'lucide-react'

const detailedServices = [
    {
        id: "sportif",
        category: "Massage Sportif",
        title: "Massage Sportif & Récupération",
        description: "Un soin profond conçu pour les athlètes et les personnes actives. Il vise à préparer les muscles à l'effort ou à accélérer la récupération après une performance.",
        benefits: [
            "Élimination des toxines (acide lactique)",
            "Réduction des courbatures et tensions",
            "Amélioration de la souplesse musculaire",
            "Prévention des blessures"
        ],
        idealFor: "Sportifs de tous niveaux, avant ou après une compétition, ou en entretien régulier.",
        duration: "60 min",
        price: "70€",
        image: "/Lieu_2.jpg"
    },
    {
        id: "relaxant",
        category: "Massage Relaxant",
        title: "Massage Relaxant & Anti-Stress",
        description: "Une parenthèse de douceur pour déconnecter du quotidien. Ce massage utilise des mouvements fluides et enveloppants pour apaiser le système nerveux.",
        benefits: [
            "Réduction significative du stress (cortisol)",
            "Amélioration de la qualité du sommeil",
            "Relâchement des tensions nerveuses",
            "Sensation de légèreté immédiate"
        ],
        idealFor: "Personnes stressées, fatiguées, ou simplement pour se faire plaisir.",
        duration: "60 min",
        price: "70€",
        image: "/Lieu_3.JPG"
    },
    {
        id: "therapie",
        category: "Thérapie Manuelle",
        title: "Thérapie Manuelle & Douleurs",
        description: "Une approche ciblée pour traiter les dysfonctionnements musculo-squelettiques. Techniques précises pour restaurer la mobilité.",
        benefits: [
            "Soulagement des douleurs chroniques (dos, nuque)",
            "Gain d'amplitude articulaire",
            "Correction des déséquilibres posturaux",
            "Traitement des maux de tête tensionnels"
        ],
        idealFor: "Personnes souffrant de raideurs, douleurs de dos, ou suite à une blessure (après avis médical).",
        duration: "60 min",
        price: "70€",
        image: "/pexels-stephanie-allen-2464226-4085450.jpg"
    }
]

export default function Services() {
    return (
        <section id="services" className="py-20 md:py-32 bg-zen-bg relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <p className="text-sm font-bold text-zen-accent uppercase tracking-widest mb-3">Nos Soins & Tarifs</p>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-zen-primary mb-6">
                        Une approche holistique pour chaque besoin
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Performance, guérison ou pure détente.
                    </p>
                </div>

                {/* Services List */}
                <div className="space-y-20">
                    {detailedServices.map((service, index) => (
                        <div key={service.id} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 md:gap-20 items-center`}>

                            {/* Image Side */}
                            <div className="w-full md:w-1/2">
                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Mobile Overlay Price/Duration */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent md:hidden text-white flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-xl">{service.price}</p>
                                            <p className="text-sm opacity-90">{service.duration}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full md:w-1/2 space-y-6">
                                <div className="space-y-2">
                                    <span className="text-zen-accent font-bold tracking-widest uppercase text-sm">{service.category}</span>
                                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-zen-primary">{service.title}</h3>
                                </div>

                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {service.description}
                                </p>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h4 className="font-semibold text-zen-primary mb-4 flex items-center gap-2">
                                        <Check className="text-zen-secondary" size={20} /> Bienfaits clés
                                    </h4>
                                    <ul className="space-y-2">
                                        {service.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600">
                                                <span className="w-1.5 h-1.5 bg-zen-secondary rounded-full mt-2 shrink-0"></span>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-4 bg-orange-50 border-l-4 border-orange-200 rounded-r-xl">
                                    <p className="text-sm text-orange-800 font-medium flex items-start gap-2">
                                        <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                                        Idéal pour : {service.idealFor}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="hidden md:block">
                                        <span className="block text-3xl font-bold text-zen-primary">{service.price}</span>
                                        <span className="text-gray-500 flex items-center gap-1"><Clock size={16} /> {service.duration}</span>
                                    </div>
                                    <Link
                                        href={`/reservation?category=${encodeURIComponent(service.category)}`}
                                        className="w-full md:w-auto text-center bg-zen-primary text-white px-8 py-4 rounded-full font-bold hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-zen-primary/30"
                                    >
                                        Réserver ce soin
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gift Cards Section */}
                <div className="mt-32 max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-zen-accent/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-zen-accent/10 rounded-bl-full -z-10"></div>
                    <div className="text-center space-y-6">
                        <h3 className="text-3xl font-serif font-bold text-zen-primary">Offrir un moment de détente ✨</h3>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Des bons cadeaux personnalisés sont disponibles pour faire plaisir à vos proches. <br />
                            Afin d'obtenir votre bon cadeau, veuillez me contacter directement.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="#contact"
                                className="inline-flex items-center gap-2 bg-zen-primary text-white px-8 py-4 rounded-full font-bold hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-zen-primary/30"
                            >
                                Me contacter
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
