import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import { todayInPakistan, addDays, dateParts, slotLabel } from '../lib/time'
import { chefPhoto } from '../constants/images'
import { cuisineDishes } from '../constants/cuisines'
import { useAuth } from '../context/AuthContext'
import { hasPendingSlotRequest } from '../lib/bookings'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const DAYS_AHEAD = 7   // backend: book at most 7 days ahead

// Slot names shown under the time
const slotMood = {
    '08-10': 'Breakfast', '10-12': 'Brunch', '12-14': 'Lunch', '14-16': 'Afternoon',
    '16-18': 'Evening', '18-20': 'Dinner', '20-22': 'Late dinner'
}

const visitSteps = [
    { icon: 'pot', title: 'Your note, your menu', text: 'Write what to cook and for how many people (up to 500 characters). The chef cooks it in your kitchen.' },
    { icon: 'basket', title: 'Your stove & groceries', text: 'Use what is already at home, or add items from our city store on the booking form. They reach the chef before the slot.' },
    { icon: 'wallet', title: 'Pay after the meal', text: 'A fixed 2-hour price agreed upfront. Pay the chef in cash once the food is ready, including any groceries.' }
]

const rules = [
    { icon: 'clock', text: 'Book at least 2 hours before the slot, up to 7 days ahead' },
    { icon: 'bell', text: 'The chef accepts or declines within 15 minutes' },
    { icon: 'undo', text: 'Free cancellation until 1.5 hours before the slot' },
    { icon: 'wallet', text: 'Cash on service, after the meal' }
]

const firstName = (name) => name.split(' ')[0]

// "08-10" -> "8 – 10 AM", "10-12" -> "10 AM – 12 PM", "18-20" -> "6 – 8 PM"
const shortSlot = (slot) => {
    const [a, b] = slot.split('-').map(Number)
    const h = (n) => n % 12 || 12
    const ap = (n) => (n >= 12 ? 'PM' : 'AM')
    return ap(a) === ap(b) ? `${h(a)} – ${h(b)} ${ap(b)}` : `${h(a)} ${ap(a)} – ${h(b)} ${ap(b)}`
}

// ---------------- Booking card ----------------
const BookingCard = ({ chef }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const today = todayInPakistan()
    const dates = useMemo(() => Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i)), [today])
    const [date, setDate] = useState(today)
    const [slot, setSlot] = useState('')

    const { data: slots, isLoading, isError, refetch } = useQuery({
        queryKey: ['availability', chef.id, date],
        queryFn: async () => (await api.get(`/chefs/${chef.id}/availability`, { params: { date } })).data.slots,
        refetchInterval: 60 * 1000
    })

    const pendingRequests = useQuery({
        queryKey: ['customer-pending-bookings', user?.id],
        queryFn: async () => (await api.get('/bookings/mine', { params: { status: 'pending', page: 1, limit: 50 } })).data.bookings,
        enabled: user?.role === 'user',
        refetchInterval: 30 * 1000
    })

    const pickDate = (d) => { setDate(d); setSlot('') }
    const checkingPending = user?.role === 'user' && (pendingRequests.isFetching || pendingRequests.isError)
    const hasPending = (slotValue) => hasPendingSlotRequest(pendingRequests.data, chef.id, date, slotValue)
    const chosen = !checkingPending && slots?.find((s) => s.slot === slot && s.status === 'available' && !hasPending(s.slot)) ? slot : ''
    const freeCount = slots?.filter((s) => s.status === 'available' && !hasPending(s.slot)).length ?? 0
    const pendingForDate = slots?.find((s) => hasPending(s.slot))
    const month = dateParts(date)

    const target = `/book/${chef.id}?date=${date}&slot=${chosen}`
    const continueBooking = () => {
        if (!chosen) return
        if (!user) navigate(`/login?next=${encodeURIComponent(target)}`)
        else navigate(target)
    }
    const wrongRole = user && user.role !== 'user'

    return (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            {/* Price */}
            <div className="flex items-start justify-between gap-3 bg-sand/70 p-5">
                <div>
                    <p className="leading-none"><span className="font-serif text-[30px] font-semibold text-rust">Rs {chef.ratePerSlot.toLocaleString()}</span> <span className="text-[13px] text-muted">/ 2-hour slot</span></p>
                    <p className="mt-2 text-[12px] text-muted">One fixed price for the visit. Groceries, if you add any, are extra.</p>
                </div>
                {!isLoading && !checkingPending && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${freeCount ? 'bg-sage-soft text-sage-dark' : 'bg-line/70 text-ink/60'}`}>
                        {freeCount ? `${freeCount} ${freeCount === 1 ? 'slot' : 'slots'} free` : 'Fully booked'}
                    </span>
                )}
            </div>

            <div className="p-5">
                {/* Dates */}
                <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-bold">Select date</p>
                    <p className="text-[12px] font-semibold text-muted">{month.month} {date.slice(0, 4)}</p>
                </div>
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                    {dates.map((d, i) => {
                        const p = dateParts(d)
                        const active = d === date
                        return (
                            <button key={d} type="button" onClick={() => pickDate(d)} aria-pressed={active}
                                className={`flex w-[54px] shrink-0 flex-col items-center rounded-lg border py-2 transition ${active ? 'border-sage-dark bg-sage-dark text-white shadow-sm' : 'border-line bg-white hover:border-sage/50'}`}>
                                <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-white/75' : 'text-muted'}`}>{i === 0 ? 'Today' : p.day}</span>
                                <span className="font-serif text-[19px] font-semibold leading-tight">{p.date}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Slots */}
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-[13px] font-bold">Select 2-hour slot</p>
                    <p className="flex items-center gap-3 text-[10px] text-muted">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sage-dark" /> Selected</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-line" /> Booked</span>
                    </p>
                </div>

                {isError ? (
                    <div className="mt-3 rounded-lg border border-line p-4 text-center text-[13px] text-muted">
                        Couldn’t load the slots. <button type="button" onClick={() => refetch()} className="font-semibold text-sage underline">Try again</button>
                    </div>
                ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {(slots || Array.from({ length: 7 }, (_, i) => ({ slot: i }))).map((s, i) => {
                            if (isLoading) return <div key={i} className={`h-[58px] animate-pulse rounded-lg bg-sand ${i === 6 ? 'col-span-2' : ''}`} />
                            const pending = hasPending(s.slot)
                            const free = s.status === 'available' && !pending && !checkingPending
                            const active = chosen === s.slot
                            const note = { booked: 'Booked', too_late: 'Too soon', too_far: 'Too far' }[s.status]
                            return (
                                <button key={s.slot} type="button" disabled={!free} onClick={() => setSlot(s.slot)} aria-pressed={active}
                                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition ${i === 6 ? 'col-span-2' : ''} ${active ? 'border-sage-dark bg-sage-dark text-white shadow-sm' : free ? 'border-line bg-white hover:border-sage/60' : pending ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900' : 'cursor-not-allowed border-transparent bg-sand/70 text-ink/35'}`}>
                                    <span>
                                        <span className={`block whitespace-nowrap text-[14px] font-bold ${!free && !pending ? 'line-through' : ''}`}>{shortSlot(s.slot)}</span>
                                        <span className={`block text-[11px] ${active ? 'text-white/75' : pending ? 'text-amber-800' : 'text-muted'} ${free || pending ? '' : 'opacity-60'}`}>{pending ? 'Request sent · awaiting reply' : slotMood[s.slot]}</span>
                                    </span>
                                    {active ? <Icon name="checkCircle" size={17} /> : pending ? <Icon name="clock" size={15} /> : note && <span className="text-[9px] font-bold uppercase tracking-wide">{note}</span>}
                                </button>
                            )
                        })}
                    </div>
                )}

                {pendingForDate && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
                        <Icon name="clock" size={15} className="mt-0.5 shrink-0" />
                        You already sent a request for this chef on {month.day}, {month.date} {month.month} at {shortSlot(pendingForDate.slot)}. That slot stays unavailable until the chef responds.
                        <Link to="/my-bookings" className="shrink-0 font-bold underline">View request</Link>
                    </div>
                )}
                {user?.role === 'user' && pendingRequests.isError && (
                    <div className="mt-3 rounded-lg border border-rust/20 bg-rust-soft/50 p-3 text-[12px] text-rust-dark">
                        We couldn’t check your pending requests, so booking is paused. <button type="button" onClick={() => pendingRequests.refetch()} className="font-bold underline">Try again</button>
                    </div>
                )}

                {/* Summary */}
                <AnimatePresence>
                    {chosen && (
                        <motion.dl initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-5 space-y-2.5 rounded-lg bg-sand/70 p-4 text-[13px]">
                                <div className="flex justify-between gap-3"><dt className="text-muted">Slot</dt><dd className="text-right font-semibold">{month.day} {month.date} {month.month} · {slotLabel(chosen)}</dd></div>
                                <div className="flex justify-between gap-3"><dt className="text-muted">Chef</dt><dd className="text-right font-semibold">{chef.name} (home visit)</dd></div>
                                <div className="flex justify-between gap-3 border-t border-line pt-2.5"><dt className="font-bold">Chef fee</dt><dd className="text-right"><span className="font-bold text-rust">Rs {chef.ratePerSlot.toLocaleString()}</span> <span className="text-muted">(pay after meal)</span></dd></div>
                            </div>
                        </motion.dl>
                    )}
                </AnimatePresence>

                {wrongRole ? (
                    <p className="mt-5 rounded-lg bg-rust-soft p-3 text-center text-[13px] text-rust-dark">Only customer accounts can book a chef. Log in with a customer account to continue.</p>
                ) : (
                    <button type="button" onClick={continueBooking} disabled={!chosen}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-3.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-45">
                        {chosen ? (user ? 'Continue to booking' : 'Log in to book') : 'Pick a slot to continue'}
                        <Icon name="arrowRight" size={16} />
                    </button>
                )}

                <ul className="mt-5 space-y-2">
                    {rules.map((r) => (
                        <li key={r.text} className="flex items-start gap-2 text-[11.5px] text-muted">
                            <Icon name={r.icon} size={14} className="mt-px shrink-0 text-rust" /> {r.text}
                        </li>
                    ))}
                </ul>
            </div>
            <p className="flex items-center gap-2 border-t border-line px-5 py-3 text-[11px] text-muted">
                <Icon name="shield" size={14} className="text-sage" /> Every booking and payment is on record with Chef Haazir
            </p>
        </div>
    )
}

// ---------------- Page ----------------
const ChefProfile = () => {
    const { id } = useParams()
    const { data: chef, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['chef', id],
        queryFn: async () => (await api.get(`/chefs/${id}`)).data.chef,
        retry: (count, err) => ![400, 404].includes(err?.response?.status) && count < 2
    })

    if (isLoading) {
        return (
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6"><div className="h-[360px] animate-pulse rounded-2xl bg-sand" /><div className="h-48 animate-pulse rounded-xl bg-sand" /></div>
                <div className="h-[620px] animate-pulse rounded-2xl bg-sand" />
            </div>
        )
    }

    if (isError) {
        const notFound = [400, 404].includes(error?.response?.status)
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft text-rust"><Icon name="chef" size={26} /></span>
                <h1 className="mt-5 font-serif text-4xl">{notFound ? 'Chef not available' : 'Couldn’t load this chef'}</h1>
                <p className="mt-3 text-muted">{notFound ? 'This chef is not taking bookings right now, or the link is wrong.' : errorMessage(error)}</p>
                <div className="mt-7 flex justify-center gap-3">
                    {!notFound && <button type="button" onClick={() => refetch()} className="rounded-lg border border-line bg-white px-5 py-2.5 font-semibold">Try again</button>}
                    <Link to="/chefs" className="rounded-lg bg-sage px-5 py-2.5 font-semibold text-white hover:bg-sage-dark">Browse chefs</Link>
                </div>
            </div>
        )
    }

    const name = firstName(chef.name)
    const cityLink = `/chefs?city=${encodeURIComponent(chef.city)}`

    return (
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-8">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                    <Link to="/" className="hover:text-rust">Home</Link> /
                    <Link to={cityLink} className="hover:text-rust">{chef.city} chefs</Link> /
                    <span className="font-semibold text-ink">{chef.name}</span>
                </nav>
                <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/75">
                    <Icon name="shield" size={13} className="text-sage" /> Phone verified · Admin approved
                </span>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
                <div className="min-w-0 space-y-8">
                    {/* Hero photo */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl shadow-lift">
                        <SafeImage src={chefPhoto(chef)} alt={`${chef.cuisines[0]} food`} eager className="h-72 sm:h-[360px]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
                            <span className="flex items-center gap-1.5 rounded-full bg-ink/65 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
                                <Icon name="pot" size={14} /> {chef.cuisines.length} {chef.cuisines.length === 1 ? 'cuisine' : 'cuisines'} · cooks in your kitchen
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full bg-sage-dark/90 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
                                <Icon name="pin" size={14} /> Home visits across {chef.city}
                            </span>
                        </div>
                    </motion.div>

                    {/* Identity */}
                    <section className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rust">Home chef · Private home cooking</p>
                                <h1 className="mt-2 font-serif text-[36px] leading-tight tracking-tight">{chef.name}</h1>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:max-w-[55%] sm:justify-end">
                                <span className="flex items-center gap-1.5 rounded-full bg-sage-dark px-3 py-1.5 text-[12px] font-semibold text-white"><Icon name="shield" size={13} /> Verified chef</span>
                                <span className="flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1.5 text-[12px] font-semibold text-sage-dark"><Icon name="pin" size={13} /> {chef.city}</span>
                                <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink/80"><Icon name="pot" size={13} /> {chef.cuisines[0]} specialist</span>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {chef.cuisines.map((c, i) => (
                                <Link key={c} to={`${cityLink}&cuisine=${encodeURIComponent(c)}`} className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition hover:ring-2 hover:ring-sage/30 ${i === 0 ? 'bg-rust-soft text-rust' : 'bg-sand text-ink/80'}`}>{c}</Link>
                            ))}
                        </div>
                        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-[12.5px] text-muted">
                            <Icon name="phone" size={14} className="text-sage" /> Phone number verified
                            <span className="text-line">•</span> Chef Haazir contract signed
                            <span className="text-line">•</span> Approved by our team
                        </p>
                    </section>

                    {/* Mobile: booking card right after the intro */}
                    <div className="lg:hidden"><BookingCard chef={chef} /></div>

                    {/* Bio */}
                    {chef.bio && (
                        <Reveal>
                            <section className="relative overflow-hidden rounded-xl border border-line bg-sand/70 p-6 sm:p-8">
                                <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-2 font-serif text-[220px] leading-none text-rust/[0.07]">”</span>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rust">In the chef’s own words</p>
                                <blockquote className="relative mt-3 max-w-2xl font-serif text-[21px] italic leading-snug text-ink/90 sm:text-[23px]">“{chef.bio}”</blockquote>
                                <p className="relative mt-4 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink/70">
                                    <span className="h-px w-8 bg-rust" /> {chef.name} · Home chef in {chef.city}
                                </p>
                            </section>
                        </Reveal>
                    )}

                    {/* Cuisines */}
                    <section>
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 className="font-serif text-[26px] tracking-tight">What {name} cooks</h2>
                                <p className="text-[13px] text-muted">Tell the chef your menu in the booking note.</p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sage-dark">Live cooking at your place</p>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {chef.cuisines.map((c, i) => (
                                <Reveal key={c} delay={i * 0.06}>
                                    <article className="h-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
                                        <div className="relative">
                                            <SafeImage src={chefPhoto({ cuisines: [c] })} alt={`${c} food`} className="h-36" />
                                            {i === 0 && <span className="absolute right-2.5 top-2.5 rounded-full bg-rust px-2.5 py-1 text-[10px] font-bold text-white">Speciality</span>}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-serif text-[18px]">{c}</h3>
                                            <p className="mt-1 text-[13px] leading-relaxed text-muted">{cuisineDishes[c] || `Specialties selected by ${name}`}</p>
                                        </div>
                                    </article>
                                </Reveal>
                            ))}
                        </div>
                    </section>

                    {/* How a visit works */}
                    <section className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-7">
                        <h2 className="flex items-center gap-2 font-serif text-[22px]"><Icon name="shield" size={20} className="text-sage" /> How a Chef Haazir home visit works</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            {visitSteps.map((s) => (
                                <div key={s.title} className="rounded-lg bg-sand/70 p-5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-soft text-sage-dark"><Icon name={s.icon} size={17} /></span>
                                    <h3 className="mt-3 font-serif text-[17px]">{s.title}</h3>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Desktop: sticky booking card */}
                <aside className="hidden lg:sticky lg:top-24 lg:block">
                    <BookingCard chef={chef} />
                </aside>
            </div>
        </div>
    )
}

export default ChefProfile
