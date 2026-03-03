'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Check, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, CreditCard, Loader2 } from 'lucide-react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useSearchParams } from 'next/navigation'
import CheckoutForm from './CheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Types
interface Service {
    id: string
    name: string
    category: string
    duration: number
    price: number
    description?: string
}

interface TimeSlot {
    time: string
    available: boolean
}

export default function BookingForm() {
    const searchParams = useSearchParams()
    const preSelectedCategory = searchParams.get('category')

    const [step, setStep] = useState(1) // 1: Service, 2: Date/Time, 3: Details, 4: Confirm
    const [services, setServices] = useState<Service[]>([])
    const [loadingServices, setLoadingServices] = useState(true)

    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: ''
    })

    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
    const [depositAmount, setDepositAmount] = useState(0)
    const [bookingRef, setBookingRef] = useState<string | null>(null)
    const [loadingPayment, setLoadingPayment] = useState(false)

    // Availability Logic
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Group services by category
    const categories = Array.from(new Set(services.map(s => s.category)))
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

    useEffect(() => {
        if (preSelectedCategory) {
            setExpandedCategory(preSelectedCategory)
        }
    }, [preSelectedCategory])

    useEffect(() => {
        if (!selectedDate || !selectedService) return

        async function fetchAvailability() {
            setLoadingSlots(true)
            try {
                const start = startOfDay(selectedDate!).toISOString()
                const end = addDays(startOfDay(selectedDate!), 1).toISOString()

                const res = await fetch(`/api/availability?start=${start}&end=${end}`)
                if (!res.ok) {
                    console.error('Availability API error:', res.status, await res.text())
                    setAvailableSlots([])
                    setLoadingSlots(false)
                    return
                }
                const data = await res.json()
                if (data.error) {
                    console.error('Availability API error details:', data.error)
                    setAvailableSlots([])
                    setLoadingSlots(false)
                    return
                }

                const busySlots: { start: string, end: string }[] = Array.isArray(data) ? data : []

                const allSlots = []
                const dayOfWeek = selectedDate!.getDay() // 0 = Sun, 1 = Mon, ...

                let openTime = 0
                let closeTime = 0

                // Define hours based on day
                if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4) { // Mon, Tue, Thu: 18:00 - 20:30
                    openTime = 18 * 60 // 1080 min
                    closeTime = 20 * 60 + 30 // 1230 min
                } else if (dayOfWeek === 5) { // Friday: 14:30 - 19:00
                    openTime = 14 * 60 + 30 // 870 min
                    closeTime = 19 * 60 // 1140 min
                } else if (dayOfWeek === 6) { // Saturday: 08:30 - 15:00
                    openTime = 8 * 60 + 30 // 510 min
                    closeTime = 15 * 60 // 900 min
                } else {
                    // Closed other days
                    setAvailableSlots([])
                    setLoadingSlots(false)
                    return
                }

                // Generate slots every 15 mins
                for (let timeInMinutes = openTime; timeInMinutes < closeTime; timeInMinutes += 15) {
                    const slotEndInMinutes = timeInMinutes + selectedService!.duration

                    // 1. Check if service finishes before closing time
                    if (slotEndInMinutes > closeTime) {
                        continue
                    }

                    const hour = Math.floor(timeInMinutes / 60)
                    const min = timeInMinutes % 60
                    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`

                    const slotStart = new Date(selectedDate!)
                    slotStart.setHours(hour, min, 0, 0)

                    const slotEnd = new Date(slotStart)
                    slotEnd.setMinutes(slotStart.getMinutes() + selectedService!.duration)

                    // 1.5 Check if slot is in the past (e.g. if booking for today)
                    if (slotStart < new Date()) {
                        continue
                    }

                    // 2. Check overlap with busy slots
                    const isBusy = busySlots.some(busy => {
                        const busyStart = new Date(busy.start)
                        const busyEnd = new Date(busy.end)
                        // Verify overlap logic: (StartA < EndB) and (EndA > StartB)
                        return (slotStart < busyEnd && slotEnd > busyStart)
                    })

                    if (!isBusy) {
                        allSlots.push(timeString)
                    }
                }
                setAvailableSlots(allSlots)
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingSlots(false)
            }
        }

        fetchAvailability()
    }, [selectedDate, selectedService])

    // Fetch services on mount
    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch('/api/services')
                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(`API Error: ${res.status} ${res.statusText}`)
                }
                const data = await res.json()
                setServices(data)
            } catch (error) {
                console.error("Failed to load services", error)
            } finally {
                setLoadingServices(false)
            }
        }
        fetchServices()
    }, [])

    const handleNext = async () => {
        if (step === 3) {
            setLoadingPayment(true)
            try {
                const res = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serviceId: selectedService?.id }),
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement')
                }

                const data = await res.json()
                setClientSecret(data.clientSecret)
                setPaymentIntentId(data.id)
                setDepositAmount(data.amount)
                setStep(4)
            } catch (error: any) {
                console.error("Payment intent error", error)
                alert(error.message || "Impossible d'initialiser le paiement. Veuillez réessayer.")
            } finally {
                setLoadingPayment(false)
            }
        } else if (step === 4) {
            // Handled by CheckoutForm
        } else {
            setStep(s => s + 1)
        }
    }
    const handleBack = () => setStep(s => s - 1)

    const handlePaymentSuccess = async () => {
        // Create Booking in DB
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    serviceId: selectedService?.id,
                    date: selectedDate, // Date object
                    time: selectedTime, // "HH:MM"
                    customerName: `${formData.firstName} ${formData.lastName}`,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    paymentIntentId: paymentIntentId
                })
            })

            clearTimeout(timeoutId)

            if (!res.ok) {
                const err = await res.json()
                alert("Erreur lors de la création de la réservation : " + err.error)
                window.location.reload() // Reload to clear the stuck "Processing" state
                return
            }

            setStep(5)
        } catch (error: any) {
            console.error("Booking creation failed", error)
            if (error.name === 'AbortError') {
                alert("La confirmation prend trop de temps, mais votre paiement a été reçu. Nous allons vérifier manuellement.")
            } else {
                alert("Une erreur est survenue lors de la confirmation. Veuillez nous contacter.")
            }
            window.location.reload()
        }
    }

    // Step 1: Select Service
    if (step === 1) {
        return (
            <div className="space-y-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif font-bold text-zen-primary mb-2">Choisissez votre soin</h2>
                    <p className="text-gray-500">Sélectionnez la prestation qui vous fera du bien</p>
                </div>

                {loadingServices ? (
                    <div key="loader-container" className="flex justify-center py-12">
                        <div key="loader-spinner" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zen-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {categories.map(category => (
                            <div key={category} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                    className={`w-full flex justify-between items-center p-6 font-semibold text-xl transition-all ${expandedCategory === category ? 'bg-zen-primary text-white' : 'bg-white text-zen-primary hover:bg-zen-bg'
                                        }`}
                                >
                                    {category}
                                    {expandedCategory === category ? <ChevronRight className="rotate-90 transition-transform" /> : <ChevronRight className="transition-transform" />}
                                </button>

                                {expandedCategory === category && (
                                    <div className="p-6 grid gap-4 bg-gray-50">
                                        {services.filter(s => s.category === category).map(service => (
                                            <div
                                                key={service.id}
                                                onClick={() => setSelectedService(service)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all bg-white relative overflow-hidden group ${selectedService?.id === service.id
                                                    ? 'border-zen-primary ring-2 ring-zen-primary/20 shadow-lg scale-[1.01]'
                                                    : 'border-transparent hover:border-zen-light shadow-sm hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <h3 className="font-bold text-zen-primary text-lg">{service.name}</h3>
                                                    <span className="font-bold text-zen-primary bg-zen-light/30 px-3 py-1 rounded-full">{service.price}€</span>
                                                </div>
                                                {service.description && (
                                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed max-w-xl">{service.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <Clock size={14} />
                                                    {service.duration} min
                                                </div>
                                                {selectedService?.id === service.id && (
                                                    <div className="absolute top-0 right-0 p-2 bg-zen-primary text-white rounded-bl-xl shadow-sm">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-8">
                    <button
                        disabled={!selectedService}
                        onClick={handleNext}
                        className="flex items-center gap-2 bg-zen-primary text-white px-8 py-4 rounded-full font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Suivant <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )
    }

    // Step 2: Date & Time
    if (step === 2) {
        return (
            <div className="space-y-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-serif font-bold text-zen-primary mb-2">Vos disponibilités</h2>
                    <p className="text-gray-500">Choisissez le moment idéal pour votre séance</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="w-full lg:w-auto p-6 bg-white rounded-3xl shadow-lg border border-gray-100 flex justify-center">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={fr}
                            disabled={[
                                { before: new Date() },
                                { dayOfWeek: [0, 3] } // 0=Sun, 3=Wed
                            ]}
                            modifiersClassNames={{
                                selected: 'bg-zen-primary text-white hover:bg-zen-primary rounded-full',
                                today: 'text-zen-accent font-bold'
                            }}
                            className="p-2"
                        />
                    </div>

                    <div className="flex-1 w-full">
                        {!selectedDate ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                                <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-gray-500 italic">Veuillez sélectionner une date sur le calendrier.</p>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 h-full">
                                <h3 className="font-serif font-bold text-zen-primary text-xl mb-6 border-b pb-4">
                                    Horaires pour le {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
                                </h3>
                                {loadingSlots ? (
                                    <div key="slots-loader" className="flex justify-center py-8">
                                        <div key="slots-spinner" className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zen-primary"></div>
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-center text-red-500 py-8">Aucun créneau disponible ce jour-là.</p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {availableSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${selectedTime === time
                                                    ? 'bg-zen-primary text-white border-zen-primary shadow-md scale-105'
                                                    : 'border-gray-100 bg-gray-50 hover:border-zen-primary hover:bg-white text-gray-700'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-500 font-semibold px-6 py-3 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} /> Retour
                    </button>
                    <button
                        disabled={!selectedDate || !selectedTime}
                        onClick={handleNext}
                        className="flex items-center gap-2 bg-zen-primary text-white px-8 py-4 rounded-full font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Suivant <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )
    }

    // Step 3: Details form
    if (step === 3) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif font-bold text-zen-primary mb-2">Dites-nous en plus</h2>
                    <p className="text-gray-500">Vos coordonnées pour confirmer le rendez-vous</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zen-primary ml-1">Prénom</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-zen-secondary/50 focus:border-zen-secondary outline-none transition-all"
                                required
                                placeholder="Jean"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zen-primary ml-1">Nom</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-zen-secondary/50 focus:border-zen-secondary outline-none transition-all"
                                required
                                placeholder="Dupont"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zen-primary ml-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-zen-secondary/50 focus:border-zen-secondary outline-none transition-all"
                                required
                                placeholder="jean.dupont@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zen-primary ml-1">Téléphone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-zen-secondary/50 focus:border-zen-secondary outline-none transition-all"
                                required
                                placeholder="06 12 34 56 78"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zen-primary ml-1">Notes ou demandes particulières</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-zen-secondary/50 focus:border-zen-secondary outline-none min-h-[120px] transition-all"
                            placeholder="Allergies, blessures récentes, préférence de pression..."
                        />
                    </div>
                </div>

                <div className="flex justify-between pt-8 mt-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-500 font-semibold px-6 py-3 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} /> Retour
                    </button>
                    <button
                        disabled={!formData.firstName || !formData.email || !formData.phone}
                        onClick={handleNext}
                        className="flex items-center gap-2 bg-zen-primary text-white px-8 py-4 rounded-full font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zen-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Paiement (50%) <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )
    }

    // Step 4: Payment
    if (step === 4) {
        return (
            <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-zen-primary mb-2">Règlement de l'acompte</h2>
                    <p className="text-gray-500">Un acompte de 50% est requis pour garantir votre réservation.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total à régler</p>
                            <p className="text-3xl font-bold text-zen-primary">{depositAmount}€</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Reste à payer sur place</p>
                            <p className="font-semibold text-gray-700">{(selectedService?.price || 0) - depositAmount}€</p>
                        </div>
                    </div>

                    {clientSecret ? (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: { theme: 'stripe', variables: { colorPrimary: '#1E3F35' } },
                            }}
                        >
                            <CheckoutForm
                                amount={depositAmount}
                                billingDetails={{
                                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                                    email: formData.email,
                                    phone: formData.phone
                                }}
                                onSuccess={handlePaymentSuccess}
                            />
                        </Elements>
                    ) : (
                        <div key="payment-loader" className="flex justify-center py-12">
                            <div key="payment-spinner" className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zen-primary"></div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-4">
                    <button onClick={handleBack} className="text-gray-500 font-semibold flex items-center gap-2 hover:text-zen-primary transition-colors"><ChevronLeft size={18} /> Revenir aux détails</button>
                </div>
            </div>
        )
    }

    // Step 5: Confirmation
    if (step === 5) {
        return (
            <div className="text-center py-20">
                <div className="w-24 h-24 bg-green-100 text-zen-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce-slow">
                    <Check size={48} />
                </div>
                <h2 className="text-4xl font-serif font-bold text-zen-primary mb-6">Réservation confirmée !</h2>
                <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-10">
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        Merci <strong>{formData.firstName}</strong>.<br />
                        Votre séance est validée.
                    </p>
                    <div className="bg-zen-bg p-6 rounded-2xl space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Soin</span>
                            <span className="font-bold text-zen-primary">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date</span>
                            <span className="font-bold text-zen-primary">{selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: fr })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Heure</span>
                            <span className="font-bold text-zen-primary">{selectedTime}</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-500">
                    Un email de confirmation vous a été envoyé.
                </p>
            </div>
        )
    }

    return null
}
