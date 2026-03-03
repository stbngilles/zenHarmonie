'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Trash, Lock, Calendar, XCircle, CheckCircle, RefreshCw } from 'lucide-react'

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    // Data
    const [bookings, setBookings] = useState<any[]>([])
    const [blockedSlots, setBlockedSlots] = useState<any[]>([])

    // Forms
    const [blockStart, setBlockStart] = useState('')
    const [blockEnd, setBlockEnd] = useState('')
    const [blockReason, setBlockReason] = useState('')
    const [isBlocking, setIsBlocking] = useState(false)

    // Booking Tabs
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')

    useEffect(() => {
        // Au chargement initial, on tente de récupérer les données en se basant sur la présence du cookie.
        // Si l'API renvoie 401, on restera non authentifié.
        checkAuthAndFetch()
    }, [])

    const checkAuthAndFetch = async () => {
        try {
            const bookingsRes = await fetch('/api/admin/bookings')
            if (bookingsRes.ok) {
                setIsAuthenticated(true)
                const slotsRes = await fetch('/api/admin/blocked-slots')
                setBookings(await bookingsRes.json())
                if (slotsRes.ok) setBlockedSlots(await slotsRes.json())
            } else {
                setIsAuthenticated(false)
            }
        } catch (error) {
            console.error("Failed to authenticate or fetch data", error)
            setIsAuthenticated(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            if (res.ok) {
                setIsAuthenticated(true)
                checkAuthAndFetch()
            } else {
                const data = await res.json()
                setLoginError(data.error || 'Mot de passe incorrect')
            }
        } catch (error) {
            setLoginError('Erreur de connexion serveur')
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        setIsAuthenticated(false)
        setBookings([])
        setBlockedSlots([])
    }

    const fetchData = async () => {
        try {
            const [bookingsRes, slotsRes] = await Promise.all([
                fetch('/api/admin/bookings'),
                fetch('/api/admin/blocked-slots')
            ])

            if (bookingsRes.ok) setBookings(await bookingsRes.json())
            if (slotsRes.ok) setBlockedSlots(await slotsRes.json())
        } catch (error) {
            console.error("Failed to load admin data", error)
        }
    }

    const handleBlockSlot = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsBlocking(true)
        try {
            // Convert local datetime string (YYYY-MM-DDThh:mm) to true JS Date, then to ISO string
            const startIso = new Date(blockStart).toISOString()
            const endIso = new Date(blockEnd).toISOString()

            const res = await fetch('/api/admin/blocked-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start: startIso, end: endIso, reason: blockReason })
            })
            if (res.ok) {
                setBlockStart('')
                setBlockEnd('')
                setBlockReason('')
                fetchData() // Refresh
            } else {
                const data = await res.json()
                alert('Erreur: ' + (data.error || 'Impossible de bloquer le créneau'))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsBlocking(false)
        }
    }

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('Supprimer ce blocage ?')) return
        try {
            await fetch('/api/admin/blocked-slots', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Annuler cette réservation ?')) return
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-6 text-center text-zen-primary">Administration</h1>
                    {loginError && <p className="text-red-500 text-sm mb-4 text-center">{loginError}</p>}
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        className="w-full p-3 border rounded-lg mb-4"
                        required
                    />
                    <button type="submit" className="w-full bg-zen-primary text-white py-3 rounded-lg font-bold">Connexion</button>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-zen-primary">Tableau de Bord</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={handleLogout} className="text-red-500 font-semibold hover:text-red-700 transition-colors">Déconnexion</button>
                    </div>
                </div>

                {/* Section Blocage */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock size={20} /> Bloquer des créneaux</h2>

                    <form onSubmit={handleBlockSlot} className="flex flex-wrap gap-4 items-end mb-8 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Début</label>
                            <input
                                type="datetime-local"
                                value={blockStart}
                                onChange={e => setBlockStart(e.target.value)}
                                className="p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Fin</label>
                            <input
                                type="datetime-local"
                                value={blockEnd}
                                onChange={e => setBlockEnd(e.target.value)}
                                className="p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold mb-1">Raison (optionnel)</label>
                            <input
                                type="text"
                                value={blockReason}
                                onChange={e => setBlockReason(e.target.value)}
                                placeholder="Congés, Formation..."
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isBlocking}
                            className="bg-zen-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-zen-primary/90 disabled:opacity-50 flex items-center justify-center min-w-[120px] transition-all"
                        >
                            {isBlocking ? <RefreshCw size={20} className="animate-spin" /> : 'Bloquer'}
                        </button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="p-3">Début</th>
                                    <th className="p-3">Fin</th>
                                    <th className="p-3">Raison</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {blockedSlots.map(slot => (
                                    <tr key={slot.id} className="hover:bg-gray-50">
                                        <td className="p-3">{format(new Date(slot.start), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                                        <td className="p-3">{format(new Date(slot.end), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                                        <td className="p-3">{slot.reason || '-'}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-500 hover:text-red-700">
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {blockedSlots.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-400">Aucun créneau bloqué à venir.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section Réservations */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} /> Réservations</h2>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-white text-zen-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                À venir
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'past' ? 'bg-white text-zen-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Passées
                            </button>
                            <button
                                onClick={() => setActiveTab('cancelled')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'cancelled' ? 'bg-white text-zen-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Annulées
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Soin</th>
                                    <th className="p-3">Statut</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(() => {
                                    const now = new Date();
                                    let displayedBookings = bookings;

                                    if (activeTab === 'upcoming') {
                                        displayedBookings = bookings.filter(b => b.status !== 'CANCELLED' && new Date(b.startDateTime) >= new Date(new Date().setHours(0, 0, 0, 0)));
                                    } else if (activeTab === 'past') {
                                        displayedBookings = bookings.filter(b => b.status !== 'CANCELLED' && new Date(b.startDateTime) < new Date(new Date().setHours(0, 0, 0, 0)));
                                    } else if (activeTab === 'cancelled') {
                                        displayedBookings = bookings.filter(b => b.status === 'CANCELLED');
                                    }

                                    if (displayedBookings.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                                    Aucune réservation {activeTab === 'upcoming' ? 'à venir' : activeTab === 'past' ? 'passée' : 'annulée'}.
                                                </td>
                                            </tr>
                                        )
                                    }

                                    return displayedBookings.map(booking => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <div className="font-semibold">{format(new Date(booking.startDateTime), 'dd MMM yyyy', { locale: fr })}</div>
                                                <div className="text-gray-500">{format(new Date(booking.startDateTime), 'HH:mm', { locale: fr })}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold">{booking.customerName}</div>
                                                <div className="text-xs text-gray-500">{booking.customerEmail}</div>
                                                <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                                            </td>
                                            <td className="p-3">{booking.service?.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {booking.status === 'CONFIRMED' ? 'Confirmé' :
                                                        booking.status === 'CANCELLED' ? 'Annulé' : booking.status}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {booking.status !== 'CANCELLED' && activeTab === 'upcoming' && (
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="inline-flex items-center gap-1 text-red-600 border border-red-200 bg-red-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                                                    >
                                                        <XCircle size={14} /> Annuler
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
