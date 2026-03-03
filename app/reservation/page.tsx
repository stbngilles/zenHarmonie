import BookingForm from '@/components/BookingForm'
import { Suspense } from 'react'

export default function ReservationPage() {
    return (
        <main className="min-h-screen bg-zen-bg py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px]">
                <div className="bg-zen-primary p-6 text-white text-center">
                    <h1 className="text-3xl font-bold">Réserver un soin</h1>
                    <p className="text-zen-light mt-2">Choisissez votre moment de détente</p>
                </div>

                <div className="p-6 md:p-10">
                    <Suspense fallback={<div className="text-center py-10">Chargement du formulaire...</div>}>
                        <BookingForm />
                    </Suspense>
                </div>
            </div>
        </main>
    )
}
