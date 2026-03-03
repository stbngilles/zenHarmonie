import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function Info() {
    return (
        <section id="contact" className="py-20 px-6 bg-zen-primary text-white">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-3xl font-bold mb-8 text-zen-light">Contact & Accès</h2>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <MapPin className="text-zen-light shrink-0" />
                            <div>
                                <p className="font-semibold">Adresse</p>
                                <p>Rue des Juifs, 11</p>
                                <p>1357 Hélécine</p>
                                <a
                                    href="https://www.google.com/maps/place/ZenHarmonie/@50.7516484,4.98678,18.04z/data=!4m6!3m5!1s0x47c16dfa984b0ced:0x30316ee30d3bf2aa!8m2!3d50.7529684!4d4.9865274!16s%2Fg%2F11y04bjjpj?entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-sm font-bold text-zen-bg border border-zen-bg px-3 py-1 rounded-full hover:bg-zen-bg hover:text-zen-primary transition-colors"
                                >
                                    Itinéraire
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Phone className="text-zen-light shrink-0" />
                            <div>
                                <p className="font-semibold">Téléphone</p>
                                <p>0471 / 74 47 09</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Mail className="text-zen-light shrink-0" />
                            <div>
                                <p className="font-semibold">Email</p>
                                <a href="mailto:zenharmonie.massotherapeute@gmail.com" className="break-all hover:text-zen-light transition-colors">
                                    zenharmonie.massotherapeute@gmail.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold mb-8 text-zen-light">Horaires d'ouverture</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-zen-light/20 pb-2">
                            <span>Lundi</span>
                            <span>18h00 – 20h30</span>
                        </div>
                        <div className="flex justify-between border-b border-zen-light/20 pb-2">
                            <span>Mardi - Jeudi</span>
                            <span>18h00 – 20h30</span>
                        </div>
                        <div className="flex justify-between border-b border-zen-light/20 pb-2">
                            <span>Vendredi</span>
                            <span>14h30 – 19h00</span>
                        </div>
                        <div className="flex justify-between border-b border-zen-light/20 pb-2">
                            <span>Samedi</span>
                            <span>08h30 – 15h00</span>
                        </div>
                        <div className="flex justify-between border-b border-zen-light/20 pb-2 opacity-50">
                            <span>Dimanche</span>
                            <span>Fermé</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
