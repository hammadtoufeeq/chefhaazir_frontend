import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { todayInPakistan, addDays, slotLabel, dateParts } from '../lib/time'
import { Underline } from '../components/Doodles'

const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

const statusText = {
    available: 'Available',
    booked: 'Booked',
    too_late: 'Too late',
    too_far: 'Not open yet'
}

const ChefProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const today = todayInPakistan()
    const days = Array.from({ length: 8 }, (_, i) => addDays(today, i))  // today + 7 days ahead
    const [date, setDate] = useState(today)
    const [slot, setSlot] = useState('')

    const chefQuery = useQuery({
        queryKey: ['chef', id],
        queryFn: async () => (await api.get(`/chefs/${id}`)).data.chef,
        retry: false
    })

    const slotsQuery = useQuery({
        queryKey: ['availability', id, date],
        queryFn: async () => (await api.get(`/chefs/${id}/availability`, { params: { date } })).data.slots,
        enabled: chefQuery.isSuccess
    })

    const pickDate = (d) => {
        setDate(d)
        setSlot('')
    }

    const requestBooking = () => {
        navigate(`/book/${id}?date=${date}&slot=${slot}`)
    }

    if (chefQuery.isPending) {
        return (
            <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
                <div className="h-64 animate-pulse rounded-3xl bg-surface" />
                <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface" />
            </div>
        )
    }

    if (chefQuery.isError) {
        const notFound = [400, 404].includes(chefQuery.error.response?.status)
        return (
            <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
                <span className="text-5xl" aria-hidden="true">🍽️</span>
                <h1 className="mt-4 font-serif text-3xl font-semibold">{notFound ? 'Chef not found' : "Couldn't load this chef"}</h1>
                <p className="mt-2 text-muted">{notFound ? 'This chef may no longer be taking bookings.' : 'The server did not respond. Try again in a moment.'}</p>
                <Link to="/chefs" className="mt-8 rounded-xl bg-dhania px-6 py-3 font-semibold text-cream hover:bg-dhania-dark">Browse other chefs</Link>
            </section>
        )
    }

    const chef = chefQuery.data
    const slots = slotsQuery.data || []
    const freeCount = slots.filter((s) => s.status === 'available').length

    return (
        <div className="mx-auto max-w-6xl px-5 pb-28 pt-8 md:px-8 lg:pb-20">
            <Link to="/chefs" className="text-sm font-semibold text-muted hover:text-dhania">← All chefs</Link>

            {/* Chef header */}
            <section className="relative mt-5 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-haldi-soft via-cream to-dhania-soft p-6 md:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                        className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-dhania font-serif text-4xl text-cream shadow-lg md:h-32 md:w-32 md:text-5xl"
                    >
                        {initials(chef.name)}
                    </motion.span>
                    <div className="flex-1">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-dhania">✓ Verified by Chef Haazir</span>
                        <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">{chef.name}</h1>
                        <p className="mt-1 text-muted">{chef.city}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {chef.cuisines.map((c) => (
                                <span key={c} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium">{c}</span>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-5 text-center shadow-sm md:min-w-44">
                        <p className="font-serif text-3xl font-semibold">Rs {chef.ratePerSlot.toLocaleString()}</p>
                        <p className="text-sm text-muted">per 2-hour slot</p>
                    </div>
                </div>
                {chef.bio && <p className="mt-6 max-w-3xl leading-relaxed text-ink/80">{chef.bio}</p>}
            </section>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
                {/* Date + slot picker */}
                <section className="min-w-0">
                    <h2 className="font-serif text-3xl font-semibold">
                        Pick a{' '}
                        <span className="relative inline-block">
                            slot
                            <Underline className="absolute -bottom-2 left-0 h-3 w-full" />
                        </span>
                    </h2>
                    <p className="mt-3 text-sm text-muted">Request at least 2 hours before the slot. You can book up to 7 days ahead.</p>

                    <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                        {days.map((d, i) => {
                            const p = dateParts(d)
                            const active = d === date
                            return (
                                <button
                                    key={d}
                                    onClick={() => pickDate(d)}
                                    className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition ${active ? 'border-dhania bg-dhania text-cream shadow-md' : 'border-line bg-white hover:border-dhania'}`}
                                >
                                    <span className={`text-xs font-semibold uppercase ${active ? 'text-cream/80' : 'text-muted'}`}>{i === 0 ? 'Today' : p.day}</span>
                                    <span className="font-serif text-2xl font-semibold">{p.date}</span>
                                    <span className={`text-xs ${active ? 'text-cream/80' : 'text-muted'}`}>{p.month}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6">
                        {slotsQuery.isPending ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />)}
                            </div>
                        ) : slotsQuery.isError ? (
                            <p className="rounded-xl bg-mirch/10 p-4 text-sm text-mirch">Couldn't load slots for this day. Try another date.</p>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {slots.map((s) => {
                                        const free = s.status === 'available'
                                        const active = s.slot === slot
                                        return (
                                            <button
                                                key={s.slot}
                                                disabled={!free}
                                                onClick={() => setSlot(s.slot)}
                                                className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition ${
                                                    active
                                                        ? 'border-dhania bg-dhania-soft ring-2 ring-dhania'
                                                        : free
                                                            ? 'border-line bg-white hover:-translate-y-0.5 hover:border-dhania hover:shadow-md'
                                                            : 'cursor-not-allowed border-line bg-surface/60 text-muted'
                                                }`}
                                            >
                                                <span className={`font-semibold ${!free ? 'line-through decoration-muted/50' : ''}`}>{slotLabel(s.slot)}</span>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${free ? 'bg-dhania-soft text-dhania' : s.status === 'booked' ? 'bg-mirch/10 text-mirch' : 'bg-line/60 text-muted'}`}>
                                                    {active ? 'Selected' : statusText[s.status]}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                                {freeCount === 0 && (
                                    <p className="mt-4 text-sm text-muted">No free slots on this day. Try another date.</p>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Summary (sticky on desktop) */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 rounded-2xl border border-line bg-white p-6 shadow-[0_10px_30px_rgba(60,45,20,0.08)]">
                        <h3 className="font-serif text-xl font-semibold">Your booking</h3>
                        <dl className="mt-4 space-y-3 text-sm">
                            <Row label="Chef" value={chef.name} />
                            <Row label="Date" value={(() => { const p = dateParts(date); return `${p.day}, ${p.date} ${p.month}` })()} />
                            <Row label="Slot" value={slot ? slotLabel(slot) : '—'} />
                            <div className="border-t border-dashed border-line pt-3">
                                <Row label="Chef fee" value={`Rs ${chef.ratePerSlot.toLocaleString()}`} strong />
                            </div>
                        </dl>
                        <p className="mt-3 text-xs text-muted">Groceries are optional. You can add them on the next step.</p>
                        <button
                            disabled={!slot}
                            onClick={requestBooking}
                            className="mt-5 w-full rounded-xl bg-dhania py-3 font-semibold text-cream transition hover:bg-dhania-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {slot ? 'Continue to request' : 'Select a slot'}
                        </button>
                        <p className="mt-3 text-center text-xs text-muted">The chef has 15 minutes to accept.</p>
                    </div>
                </aside>
            </div>

            {/* Bottom bar on mobile once a slot is chosen */}
            <AnimatePresence>
                {slot && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-5 py-4 backdrop-blur lg:hidden"
                    >
                        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                            <div className="text-sm">
                                <p className="font-semibold">{slotLabel(slot)}</p>
                                <p className="text-muted">Rs {chef.ratePerSlot.toLocaleString()} · {(() => { const p = dateParts(date); return `${p.day} ${p.date} ${p.month}` })()}</p>
                            </div>
                            <button onClick={requestBooking} className="rounded-xl bg-dhania px-5 py-3 font-semibold text-cream hover:bg-dhania-dark">Continue</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const Row = ({ label, value, strong }) => (
    <div className="flex justify-between gap-4">
        <dt className="text-muted">{label}</dt>
        <dd className={strong ? 'font-serif text-lg font-semibold' : 'font-medium'}>{value}</dd>
    </div>
)

export default ChefProfile
