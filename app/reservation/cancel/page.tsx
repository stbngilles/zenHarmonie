'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Check, XCircle, AlertTriangle } from 'lucide-react'

function CancelContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    if (!id || !token) {
        return (
            <div className="text-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
                <XCircle size={64} className="mx-auto text-red-500 mb-6" />
                <h1 className="text-2xl font-bold font-serif text-zen-primary mb-4">Lien invalide</h1>
                <p className="text-gray-600">Ce lien d'annulation est incomplet ou invalide.</p>
            </div>
        )
    }

    const handleCancel = async () => {
        setStatus('loading')
        try {
            const res = await fetch('/api/bookings/client-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, token })
            })
            const data = await res.json()
            if (res.ok) {
                setStatus('success')
                setMessage(data.message || 'Votre réservation a bien été annulée.')
            } else {
                setStatus('error')
                setMessage(data.error || 'Une erreur est survenue.')
            }
        } catch (e) {
            setStatus('error')
            setMessage('Impossible de contacter le serveur.')
        }
    }

    if (status === 'success') {
        return (
            <div className="text-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
                <Check size={64} className="mx-auto text-green-500 mb-6" />
                <h1 className="text-2xl font-bold font-serif text-zen-primary mb-4">Annulation confirmée</h1>
                <p className="text-gray-600">{message}</p>
                <a href="/" className="inline-block mt-8 bg-zen-primary text-white px-6 py-3 rounded-full hover:bg-zen-primary/90 transition-colors">
                    Retour à l'accueil
                </a>
            </div>
        )
    }

    return (
        <div className="p-8 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
            <h1 className="text-3xl font-bold font-serif text-zen-primary mb-6 text-center">Annuler mon rendez-vous</h1>

            <div className="bg-red-50 border border-red-100 p-5 rounded-xl flex gap-4 mb-8">
                <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
                <p className="text-sm text-red-800 leading-relaxed">
                    <strong>Attention :</strong> L'acompte de 50% que vous avez versé lors de la réservation <strong>ne vous sera pas remboursé</strong>, conformément à nos conditions générales de vente. L'annulation est définitive.
                </p>
            </div>

            {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 text-center">
                    {message}
                </div>
            )}

            <div className="flex flex-col gap-4">
                <button
                    onClick={handleCancel}
                    disabled={status === 'loading'}
                    className="w-full bg-red-600 text-white py-4 rounded-full font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Annulation en cours...' : 'Oui, je confirme l\'annulation'}
                </button>
                <a
                    href="/"
                    className="w-full text-center py-4 text-gray-500 hover:text-zen-primary transition-colors font-medium border border-gray-200 rounded-full"
                >
                    Non, je garde mon rendez-vous
                </a>
            </div>
        </div>
    )
}

export default function CancelPage() {
    return (
        <main className="min-h-screen bg-zen-bg py-20 px-4 flex items-center justify-center">
            <Suspense fallback={<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zen-primary"></div>}>
                <CancelContent />
            </Suspense>
        </main>
    )
}
