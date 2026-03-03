'use client'

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useState } from 'react'

export default function CheckoutForm({ amount, billingDetails, onSuccess }: {
    amount: number,
    billingDetails: { name: string, email: string, phone: string },
    onSuccess: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()

    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsProcessing(true)
        setErrorMessage(null)

        try {
            // Add a timeout of 30 seconds to prevent permanent hang
            const confirmPaymentPromise = stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                    payment_method_data: {
                        billing_details: billingDetails
                    }
                },
                redirect: 'if_required',
            })

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            )

            const { error, paymentIntent } = await Promise.race([confirmPaymentPromise, timeoutPromise])

            if (error) {
                setErrorMessage(error.message ?? 'Une erreur est survenue.')
                setIsProcessing(false)
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess()
            } else {
                setErrorMessage('Le paiement n\'a pas pu être confirmé.')
                setIsProcessing(false)
            }
        } catch (err: any) {
            if (err?.message === 'timeout') {
                setErrorMessage('Le paiement prend trop de temps. Veuillez vérifier vos informations de carte et réessayer.')
            } else {
                setErrorMessage('Une erreur inattendue est survenue.')
            }
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <p className="text-sm text-gray-600 mb-1">Montant à régler maintenant (Acompte 50%)</p>
                <p className="text-2xl font-bold text-zen-primary">{amount.toFixed(2)} €</p>
            </div>

            <PaymentElement options={{ wallets: { link: 'never' } }} />

            {errorMessage && <div className="text-red-500 text-sm mt-2 bg-red-50 p-3 rounded-lg">{errorMessage}</div>}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-zen-primary text-white py-3 rounded-full font-bold hover:bg-zen-primary/90 transition-colors disabled:opacity-50 mt-4"
            >
                {isProcessing ? 'Traitement en cours...' : `Payer ${amount.toFixed(2)} €`}
            </button>

        </form>
    )
}
