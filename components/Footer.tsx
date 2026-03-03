import Link from 'next/link'
import { Facebook, Instagram } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-zen-primary text-white py-8">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm font-light opacity-80">
                    &copy; {new Date().getFullYear()} ZenHarmonie. Tous droits réservés.
                </div>

                <div className="flex items-center gap-6">
                    <Link href="https://www.facebook.com/profile.php?id=61580285813736&locale=fr_FR" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-zen-accent transition-colors">
                        <Facebook size={24} />
                    </Link>
                    <Link href="https://www.instagram.com/zenharmonie.massotherapeute/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-zen-accent transition-colors">
                        <Instagram size={24} />
                    </Link>
                </div>
            </div>
        </footer>
    )
}
