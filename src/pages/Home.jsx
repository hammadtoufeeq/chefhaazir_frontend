import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import api from '../lib/api'
import cuisines from '../constants/cuisines'
import { images, chefPhoto } from '../constants/images'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

// ---------------------------------------------------------------------------
// Home page. Colors used here: forest green #17392C, lime #C2E35A, peach #F8D9B6,
// mint #D3F0DE, cream #FAF6EE, beige #F5F0E4.
// ---------------------------------------------------------------------------

const heading = { fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }

const Pill = ({ children, className = '' }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${className}`}>{children}</span>
)

// ---------------- Hero Section (Unchanged) ----------------
const Rings = () => (
    <svg aria-hidden="true" className="pointer-events-none absolute -right-48 top-1/2 h-[900px] w-[900px] -translate-y-1/2 text-[#17392C]" viewBox="0 0 900 900" fill="none">
        {[130, 210, 290, 370, 450].map((r) => <circle key={r} cx="450" cy="450" r={r} stroke="currentColor" strokeOpacity="0.07" strokeWidth="1.5" />)}
    </svg>
)

const ScreenHeader = ({ title, sub }) => (
    <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F0E4] text-[#17392C]"><Icon name="arrowLeft" size={16} /></span>
        <div className="leading-tight">
            <h3 style={heading} className="text-[19px] text-[#17392C]">{title}</h3>
            <p className="text-[11px] text-[#8A9189]">{sub}</p>
        </div>
    </div>
)

const DiscoverScreen = () => {
    const { city } = useCity()
    const navigate = useNavigate()
    const [q, setQ] = useState('')

    const search = (e) => {
        e.preventDefault()
        const params = new URLSearchParams({ city })
        if (q.trim()) params.set('search', q.trim())
        navigate(`/chefs?${params}`)
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C2E35A] text-[#17392C]"><Icon name="user" size={17} /></span>
                    <div className="leading-tight">
                        <p className="text-[10px] text-[#8A9189]">Cooking in</p>
                        <p className="flex items-center gap-1 text-[12.5px] font-bold text-[#17392C]"><Icon name="pin" size={12} /> {city}</p>
                    </div>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F0E4] text-[#17392C]"><Icon name="bell" size={16} /></span>
            </div>

            <h3 style={heading} className="mt-5 text-[22px] text-[#17392C]">What’s cooking today?</h3>

            <form onSubmit={search} className="mt-3 flex items-center gap-2 rounded-full border border-[#E9E3D3] bg-[#FBF9F3] py-1.5 pl-4 pr-1.5">
                <Icon name="search" size={15} className="shrink-0 text-[#8A9189]" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search karahi, biryani, daal…"
                    aria-label="Search chefs"
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#17392C] outline-none placeholder:text-[#9AA19B]"
                />
                <button className="rounded-full bg-[#17392C] px-3.5 py-1.5 text-[11px] font-semibold text-white">Go</button>
            </form>

            <div className="mt-4 grid grid-cols-4 gap-2">
                {[...cuisines.slice(0, 3).map((c) => ({ label: c, to: `/chefs?city=${encodeURIComponent(city)}&cuisine=${encodeURIComponent(c)}`, icon: 'pot' })), { label: 'More', to: '/chefs', icon: 'menu' }].map((t) => (
                    <Link key={t.label} to={t.to} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#EFE9DA] bg-white px-1 py-2.5 text-center transition hover:border-[#17392C]/30">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F0E4] text-[#17392C]"><Icon name={t.icon} size={16} /></span>
                        <span className="w-full truncate text-[10.5px] font-semibold text-[#17392C]">{t.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#17392C]">Popular dishes</p>
                <Link to="/chefs" className="text-[11px] font-semibold text-[#5E8A2E]">See all</Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                    { name: 'Chicken Karahi', cuisine: 'Karahi', img: images.heroKarahi },
                    { name: 'Chicken Biryani', cuisine: 'Biryani & Rice', img: images.biryaniBowl }
                ].map((d) => (
                    <Link key={d.name} to={`/chefs?city=${encodeURIComponent(city)}&cuisine=${encodeURIComponent(d.cuisine)}`} className="group block">
                        <SafeImage src={d.img} alt={d.name} eager className="h-24 rounded-xl sm:h-28" imgClassName="transition duration-500 group-hover:scale-105" />
                        <p className="mt-2 text-[12.5px] font-bold text-[#17392C]">{d.name}</p>
                        <p className="text-[10.5px] text-[#8A9189]">Find {d.cuisine.split(' ')[0]} chefs</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

const slotLabels = ['8–10 AM', '10 AM–12 PM', '12–2 PM', '2–4 PM', '4–6 PM', '6–8 PM', '8–10 PM']

const BookScreen = () => {
    const days = Array.from({ length: 7 }, (_, n) => {
        const d = new Date()
        d.setDate(d.getDate() + n)
        return { label: n === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' }), date: d.getDate() }
    })

    return (
        <div>
            <ScreenHeader title="Book your chef" sub="Pick a day and a 2-hour slot" />
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F8F4EB] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D3F0DE] text-[#17392C]"><Icon name="chef" size={20} /></span>
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[12.5px] font-bold text-[#17392C]">Verified home chef</p>
                    <p className="text-[10.5px] text-[#8A9189]">Fixed price for every slot</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#D3F0DE] px-2 py-0.5 text-[10px] font-bold text-[#17392C]"><Icon name="shield" size={11} /> Verified</span>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Choose a day</p>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
                {days.map((d, n) => (
                    <div key={n} className={`flex flex-col items-center rounded-xl border py-2 ${n === 0 ? 'border-[#C2E35A] bg-[#C2E35A]' : 'border-[#EFE9DA] bg-white'}`}>
                        <span className="text-[9px] font-semibold text-[#17392C]/70">{d.label}</span>
                        <span className="text-[13px] font-bold text-[#17392C]">{d.date}</span>
                    </div>
                ))}
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Choose a slot</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {slotLabels.map((l, n) => (
                    <span key={l} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${n === 5 ? 'border-[#17392C] bg-[#17392C] text-white' : n === 3 ? 'border-[#EFE9DA] bg-[#F5F0E4] text-[#9AA19B] line-through' : 'border-[#E9E3D3] bg-white text-[#17392C]'}`}>{l}</span>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#EFE9DA] p-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8D9B6] text-[#17392C]"><Icon name="basket" size={16} /></span>
                    <div className="leading-tight"><p className="text-[12px] font-bold text-[#17392C]">Add groceries</p><p className="text-[10px] text-[#8A9189]">When your slot is 2+ hours away</p></div>
                </div>
                <span className="flex h-5 w-9 items-center rounded-full bg-[#17392C] p-0.5"><span className="ml-auto h-4 w-4 rounded-full bg-[#C2E35A]" /></span>
            </div>

            <span className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#17392C] py-3 text-[12.5px] font-semibold text-white">Request booking <Icon name="arrowRight" size={14} /></span>
        </div>
    )
}

const basket = [
    { name: 'Chicken', qty: '1 kg', icon: 'pot' },
    { name: 'Tomatoes', qty: '500 g', icon: 'sparkle' },
    { name: 'Onions', qty: '1 kg', icon: 'sparkle' },
    { name: 'Atta', qty: '2 kg', icon: 'basket' },
    { name: 'Desi ghee', qty: '250 g', icon: 'basket' }
]

const GroceryScreen = () => {
    const { city } = useCity()
    return (
        <div>
            <ScreenHeader title="Add groceries" sub={`From our ${city} store`} />
            <div className="mt-4 flex flex-wrap gap-1.5">
                {['Atta & Rice', 'Meat', 'Vegetables', 'Spices'].map((c, n) => (
                    <span key={c} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${n === 0 ? 'bg-[#17392C] text-white' : 'bg-[#F5F0E4] text-[#17392C]'}`}>{c}</span>
                ))}
            </div>

            <ul className="mt-4 space-y-2">
                {basket.map((b) => (
                    <li key={b.name} className="flex items-center gap-3 rounded-2xl border border-[#EFE9DA] bg-white p-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F4EB] text-[#17392C]"><Icon name={b.icon} size={17} /></span>
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="text-[12.5px] font-bold text-[#17392C]">{b.name}</p>
                            <p className="text-[10.5px] text-[#8A9189]">{b.qty}</p>
                        </div>
                        <span className="flex items-center gap-2 rounded-full bg-[#F5F0E4] px-2 py-1 text-[#17392C]" aria-hidden="true">
                            <Icon name="minus" size={12} /><span className="text-[11px] font-bold">1</span><Icon name="plus" size={12} />
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#17392C] p-3 text-white">
                <div className="flex items-center gap-2.5">
                    <Icon name="truck" size={18} className="text-[#C2E35A]" />
                    <p className="text-[11.5px] leading-tight">Delivered to your chef<br /><span className="text-white/60">before your slot starts</span></p>
                </div>
                <span className="shrink-0 rounded-full bg-[#C2E35A] px-2.5 py-1 text-[10px] font-bold text-[#17392C]">Free over Rs 500</span>
            </div>
        </div>
    )
}

const timeline = [
    { title: 'Request sent', sub: 'Your chef has 15 minutes to accept', state: 'done' },
    { title: 'Chef accepted', sub: 'Your slot is confirmed', state: 'done' },
    { title: 'Groceries packed', sub: 'By your city grocery store', state: 'done' },
    { title: 'On the way to your chef', sub: 'Arrives before your slot', state: 'now' },
    { title: 'Chef arrives and cooks', sub: 'Fresh, in your own kitchen', state: 'next' },
    { title: 'Pay cash after the meal', sub: 'No advance payment', state: 'next' }
]

const StatusScreen = () => (
    <div>
        <ScreenHeader title="Your booking" sub="Dinner · 6–8 PM · today" />
        <ol className="mt-5">
            {timeline.map((t, n) => (
                <li key={t.title} className="relative flex gap-3 pb-4 last:pb-0">
                    {n < timeline.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-18px)] w-0.5 ${t.state === 'done' ? 'bg-[#C2E35A]' : 'bg-[#E9E3D3]'}`} />}
                    <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${t.state === 'done' ? 'bg-[#C2E35A] text-[#17392C]' : t.state === 'now' ? 'bg-[#17392C] text-white ring-4 ring-[#C2E35A]/50' : 'border-2 border-[#E9E3D3] bg-white'}`}>
                        {t.state === 'done' && <Icon name="check" size={14} strokeWidth={3} />}
                        {t.state === 'now' && <Icon name="truck" size={13} />}
                    </span>
                    <div className="leading-tight">
                        <p className={`text-[13px] font-bold ${t.state === 'next' ? 'text-[#8A9189]' : 'text-[#17392C]'}`}>{t.title}</p>
                        <p className="mt-0.5 text-[10.5px] text-[#8A9189]">{t.sub}</p>
                    </div>
                </li>
            ))}
        </ol>
    </div>
)

const screens = [
    { name: 'Find a chef', Screen: DiscoverScreen },
    { name: 'Book a slot', Screen: BookScreen },
    { name: 'Add groceries', Screen: GroceryScreen },
    { name: 'Follow your booking', Screen: StatusScreen }
]

const navIcons = ['pot', 'calendar', 'basket', 'user']
const SLIDE_MS = 4000

const PhoneMock = () => {
    const reduce = useReducedMotion()
    const [idx, setIdx] = useState(0)
    const swipe = useRef(null)

    const go = (n) => setIdx((n + screens.length) % screens.length)

    useEffect(() => {
        if (reduce) return undefined
        const t = setTimeout(() => setIdx((i) => (i + 1) % screens.length), SLIDE_MS)
        return () => clearTimeout(t)
    }, [idx, reduce])

    const bob = (duration, delay = 0) => (reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration, repeat: Infinity, ease: 'easeInOut', delay } })

    return (
        <div className="relative mx-auto w-full max-w-[470px] lg:justify-self-end">
            <div className="relative rounded-[34px] border border-[#E9E3D3] bg-white p-5 shadow-[0_30px_80px_-20px_rgba(23,57,44,0.28)] sm:p-6" role="group" aria-roledescription="carousel" aria-label="Chef Haazir app screens">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#17392C]">
                    <span>09:41</span>
                    <span className="flex items-end gap-0.5" aria-hidden="true">
                        {[6, 9, 12].map((h) => <span key={h} style={{ height: h }} className="w-[3px] rounded-sm bg-[#17392C]" />)}
                    </span>
                </div>

                <div className="mt-4 overflow-hidden" style={{ touchAction: 'pan-y' }} onPointerDown={(e) => { swipe.current = e.clientX }} onPointerUp={(e) => {
                    if (swipe.current === null) return
                    const dx = e.clientX - swipe.current
                    swipe.current = null
                    if (dx < -50) go(idx + 1)
                    else if (dx > 50) go(idx - 1)
                }} onPointerCancel={() => { swipe.current = null }} onDragStart={(e) => e.preventDefault()}>
                    <motion.div className="flex" animate={{ x: `${-idx * 100}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 190, damping: 28 }}>
                        {screens.map(({ name, Screen }, n) => (
                            <div key={name} className="w-full shrink-0 basis-full" inert={n !== idx} aria-hidden={n !== idx} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${screens.length}: ${name}`}>
                                <Screen />
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5">
                    {screens.map((sc, n) => (
                        <button key={sc.name} type="button" onClick={() => go(n)} aria-label={`Show screen: ${sc.name}`} aria-current={n === idx} className={`h-1.5 rounded-full transition-all duration-300 ${n === idx ? 'w-6 bg-[#17392C]' : 'w-1.5 bg-[#17392C]/25 hover:bg-[#17392C]/50'}`} />
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-full bg-[#17392C] px-4 py-2.5">
                    {navIcons.map((n, i) => (
                        <button key={n} type="button" onClick={() => go(i)} aria-label={`Go to ${screens[i].name}`} aria-current={i === idx} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500 ${i === idx ? 'bg-[#C2E35A] text-[#17392C]' : 'text-white/70 hover:text-white'}`}>
                            <Icon name={n} size={16} />
                        </button>
                    ))}
                </div>
            </div>

            <motion.div {...bob(5)} className="absolute -right-2 -top-6 rounded-2xl bg-[#F8D9B6] px-4 py-3 shadow-card sm:-right-8">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#17392C]/70"><Icon name="clock" size={12} /> Fixed slot</p>
                <p className="mt-0.5 text-[18px] font-bold leading-none text-[#17392C]">2 hours</p>
            </motion.div>

            <motion.div {...bob(5.5, 0.8)} className="absolute -bottom-6 -right-2 rounded-2xl bg-[#C2E35A] px-4 py-3 shadow-card sm:-right-8">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#17392C]/70"><Icon name="basket" size={12} /> Groceries</p>
                <p className="mt-0.5 text-[15px] font-bold leading-none text-[#17392C]">Free Delivery over Rs 500</p>
            </motion.div>
        </div>
    )
}

const trust = ['No advance payment', 'Fixed price per slot', 'Pay after the meal']

const Hero = () => {
    const { user } = useAuth()
    const canBecomeChef = !user || user.role === 'user'

    return (
        <section className="relative overflow-hidden bg-[#FAF6EE]">
            <Rings />
            <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-8 pt-6 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-12 lg:pt-10">
                <div>
                    <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-[#E5DFCF] bg-white px-3 py-1 text-[10.5px] font-semibold text-[#17392C]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7DBB3A]" /> Verified home chefs across Pakistan
                    </motion.span>
                    
                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={heading} className="mt-3 text-[36px] leading-[1.08] text-[#17392C] sm:text-[44px] lg:text-[50px]">
                        Ghar se door,<br />Ghar ka khana.
                    </motion.h1>
                    
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 max-w-md text-[14px] leading-relaxed text-[#4E5F55]">
                        Find verified home chefs, book authentic home cooking in your own kitchen, and add fresh groceries, all in one place.
                    </motion.p>
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-5 flex flex-wrap gap-3">
                        <Link to="/chefs" className="group inline-flex items-center gap-2 rounded-full bg-[#17392C] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0F2A20]">
                            Find a chef <Icon name="arrowRight" size={14} className="transition group-hover:translate-x-1" />
                        </Link>
                        {canBecomeChef && (
                            <Link to="/signup?role=chef" className="inline-flex items-center rounded-full border border-[#D9D2BF] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#17392C] transition hover:border-[#17392C]/40">
                                Become a chef
                            </Link>
                        )}
                    </motion.div>

                    <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-[#4E5F55]">
                        {trust.map((t) => (
                            <li key={t} className="flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D3F0DE] text-[#17392C]"><Icon name="check" size={10} strokeWidth={3} /></span> {t}
                            </li>
                        ))}
                    </ul>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E9E3D3] pt-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8D9B6] text-[#17392C]"><Icon name="chef" size={15} /></span>
                            <div className="leading-tight">
                                <p className="text-[11.5px] font-bold text-[#17392C]">100% Verified Chefs</p>
                                <p className="text-[10px] text-[#5E6B63]">Handpicked & trusted</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2E35A] text-[#17392C]"><Icon name="basket" size={15} /></span>
                            <div className="leading-tight">
                                <p className="text-[11.5px] font-bold text-[#17392C]">Fresh Groceries</p>
                                <p className="text-[10px] text-[#5E6B63]">Delivered to your chef</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <PhoneMock />
            </div>
        </section>
    )
}

// ---------------- How it works ----------------
const steps = [
    { badge: 'bg-[#F8D9B6] text-[#17392C]', title: 'Choose your chef', text: 'Browse verified home chefs in your city, filter by cuisine and price, and pick a free 2-hour slot up to a week ahead.', foot: 'Verified cooks' },
    { badge: 'bg-[#C2E35A] text-[#17392C]', title: 'Add pure groceries', text: 'Add fresh vegetables, meat, atta and spices from our city store, in the exact quantities your dish needs.', foot: 'Exact quantities' },
    { badge: 'bg-[#D3F0DE] text-[#17392C]', title: 'Chef arrives on time', text: 'Your chef accepts the request, the groceries reach them before your slot, and they arrive ready to cook.', foot: 'Chef confirms first' },
    { badge: 'bg-[#17392C] text-white', title: 'Fresh food, fixed price', text: 'Enjoy fresh, hot ghar ka khana, cooked right in your kitchen. You pay in cash only after the meal.', foot: 'No advance payment' }
]

const HowItWorks = () => (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="text-center">
                <Pill className="bg-[#D3F0DE] text-[#17392C]">Simple & seamless</Pill>
                <h2 style={heading} className="mt-4 text-4xl text-[#17392C] md:text-[44px]">How Chef Haazir works</h2>
                <p className="mx-auto mt-3 max-w-lg text-[15px] text-[#5E6B63]">Ghar ka maza, bila kisi jhanjhat. Authentic home-cooked meals right at your table.</p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                    <Reveal key={s.title} delay={i * 0.08}>
                        <motion.article whileHover={{ y: -6 }} className="flex h-full min-h-[260px] flex-col rounded-2xl bg-[#F8F4EB] p-6 transition-shadow hover:shadow-lg">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold ${s.badge}`}>0{i + 1}</span>
                            <h3 style={heading} className="mt-6 text-[19px] text-[#17392C]">{s.title}</h3>
                            <p className="mt-3 text-[13.5px] leading-relaxed text-[#5E6B63]">{s.text}</p>
                            <p className="mt-auto flex items-center justify-between pt-6 text-[11.5px] font-semibold text-[#17392C]">
                                {s.foot} <Icon name="check" size={14} strokeWidth={2.4} className="text-[#5E8A2E]" />
                            </p>
                        </motion.article>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

// ---------------- Master chefs ----------------
const MasterChefCard = ({ chef }) => (
    <motion.article whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="flex h-full flex-col rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-sm hover:shadow-xl">
        <div className="relative">
            <SafeImage src={chefPhoto(chef)} alt={`${chef.cuisines[0] || 'Home'} food`} className="h-44 rounded-xl" />
            <span className="absolute left-3 top-3 rounded-full bg-[#C2E35A] px-2.5 py-1 text-[11px] font-bold text-[#17392C]">{chef.cuisines[0] || 'Home cooking'}</span>
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#17392C] backdrop-blur-sm"><Icon name="pin" size={12} /> {chef.city}</span>
        </div>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
                <h3 style={heading} className="text-[20px] text-[#17392C]">{chef.name}</h3>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#D3F0DE] px-2 py-0.5 text-[10px] font-bold text-[#17392C]"><Icon name="shield" size={11} /> Verified</span>
            </div>
            {chef.bio && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5E6B63]">{chef.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {chef.cuisines.slice(0, 3).map((c) => <span key={c} className="rounded-full bg-[#F5F0E4] px-2.5 py-1 text-[11px] font-medium text-[#4E5F55]">{c}</span>)}
            </div>
            <div className="min-h-5 flex-1" />
            <div className="mt-5 flex items-end justify-between border-t border-[#EFE9DA] pt-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Cooking slot</p>
                    <p className="text-[18px] font-bold text-[#17392C]">Rs {chef.ratePerSlot.toLocaleString()} <span className="text-[11px] font-medium text-[#8A9189]">/ 2-hr slot</span></p>
                </div>
                <Link to={`/chefs/${chef.id}`} className="rounded-full bg-[#17392C] px-5 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[#0F2A20] hover:scale-105 active:scale-95">Book chef</Link>
            </div>
        </div>
    </motion.article>
)

const MasterChefSkeleton = () => (
    <div className="rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-card">
        <div className="h-44 animate-pulse rounded-xl bg-[#F5F0E4]" />
        <div className="space-y-3 p-3">
            <div className="h-5 w-2/3 animate-pulse rounded bg-[#F5F0E4]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#F5F0E4]" />
            <div className="h-10 animate-pulse rounded-full bg-[#F5F0E4]" />
        </div>
    </div>
)

const MasterChefs = () => {
    const { city } = useCity()
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['chefs', 'featured', city, 3],
        queryFn: async () => {
            const { data: local } = await api.get('/chefs', { params: { city, limit: 3 } })
            if (local.chefs.length) return { ...local, scope: city }
            const { data: all } = await api.get('/chefs', { params: { limit: 3 } })
            return { ...all, scope: null }
        }
    })

    const scope = data?.scope
    const total = data?.pagination?.total ?? 0

    return (
        <section className="bg-[#F8F4EB] py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <Pill className="border border-[#D9D2BF] text-[#17392C]">Verified chefs</Pill>
                        <h2 style={heading} className="mt-4 text-4xl text-[#17392C] md:text-[42px]">Meet neighborhood master chefs</h2>
                        <p className="mt-2 text-[15px] text-[#5E6B63]">{isLoading ? 'Finding chefs…' : scope ? `Home cooks taking 2-hour slots in ${scope} this week.` : `No chefs in ${city} yet, so here are chefs from other cities.`}</p>
                    </div>
                    {total > 0 && (
                        <Link to={scope ? `/chefs?city=${encodeURIComponent(scope)}` : '/chefs'} className="group flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#17392C]">
                            View all verified chefs <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
                        </Link>
                    )}
                </Reveal>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading && [0, 1, 2].map((i) => <MasterChefSkeleton key={i} />)}
                    {data?.chefs.map((chef, i) => (
                        <Reveal key={chef.id} delay={i * 0.08}><MasterChefCard chef={chef} /></Reveal>
                    ))}
                </div>

                {isError && (
                    <div className="rounded-2xl border border-[#E9E3D3] bg-white p-10 text-center shadow-card">
                        <p style={heading} className="text-2xl text-[#17392C]">Couldn’t load chefs right now</p>
                        <p className="mt-2 text-sm text-[#5E6B63]">Please check your connection and try again.</p>
                        <button type="button" onClick={() => refetch()} className="mt-5 rounded-full bg-[#17392C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0F2A20]">Try again</button>
                    </div>
                )}

                {data && data.chefs.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#D9D2BF] bg-white p-10 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#D3F0DE] text-[#17392C]"><Icon name="chef" size={24} /></span>
                        <p style={heading} className="mt-4 text-2xl text-[#17392C]">Our first chefs are joining soon</p>
                        <p className="mt-2 text-sm text-[#5E6B63]">Love to cook? Be one of the first home chefs on Chef Haazir.</p>
                        <Link to="/signup?role=chef" className="mt-5 inline-flex rounded-full bg-[#17392C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0F2A20]">Join as a chef</Link>
                    </div>
                )}
            </div>
        </section>
    )
}

// ---------------- Groceries ----------------
const groceryFacts = [
    { title: 'Free delivery', text: 'On grocery orders of Rs 500 and above' },
    { title: 'Exact quantities', text: 'Priced per kg, litre or pack' }
]

const Groceries = () => (
    <section className="bg-white px-4 py-20 md:px-8 lg:py-24">
        <Reveal className="mx-auto grid max-w-7xl items-center gap-10 rounded-[28px] bg-[#F5F0E4] p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
            <div>
                <Pill className="bg-[#C2E35A] text-[#17392C]">Zero grocery hassle</Pill>
                <h2 style={heading} className="mt-5 text-[34px] text-[#17392C] md:text-[42px]">Don’t have groceries? Your chef brings everything.</h2>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#5E6B63]">
                    Never worry about missing ginger, crushed coriander or stale meat. Add groceries when you book, and your city’s grocery store sends the ingredients to your chef before your slot, in the exact quantities you choose.
                </p>
                <div className="mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
                    {groceryFacts.map((f) => (
                        <div key={f.title} className="rounded-xl bg-white p-4 transition hover:shadow-sm">
                            <p className="text-[14px] font-bold text-[#17392C]">{f.title}</p>
                            <p className="mt-1 text-[12px] text-[#5E6B63]">{f.text}</p>
                        </div>
                    ))}
                </div>
                <Link to="/grocery" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[#17392C] px-6 py-3.5 text-[13.5px] font-semibold text-white transition hover:bg-[#0F2A20] hover:scale-105 active:scale-95">
                    Explore kiryana pantry <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-card">
                <SafeImage src={images.spiceBowls} alt="Pantry and fresh kiryana spices" className="h-64 rounded-xl sm:h-80" />
                <div className="mt-3 flex items-center justify-between gap-3 px-2 pb-1">
                    <div>
                        <p className="text-[13.5px] font-bold text-[#17392C]">Recipe portion baskets</p>
                        <p className="text-[11.5px] text-[#5E6B63]">Picked for your dish, sent to your chef</p>
                    </div>
                    <span className="rounded-full bg-[#C2E35A] px-3 py-1 text-[11px] font-bold text-[#17392C]">Fresh</span>
                </div>
            </div>
        </Reveal>
    </section>
)

// ---------------- Additional Detailed Sections ----------------

const chefDifferenceData = [
    {
        title: 'Commercial Restaurant Delivery',
        isBad: true,
        points: ['Reheated commercial oil & excess sodium that causes bloating.', 'Delayed transit resulting in lukewarm food.', 'Hefty 35%+ restaurant mark-up with delivery & platform surcharges.', 'Zero control over ingredient freshness or kitchen cleanliness.'],
        footer: 'High cost, inconsistent health impact'
    },
    {
        title: 'Unvetted Domestic Cooks',
        isBad: true,
        points: ['Frequent unannounced leaves leaving dinner plans stranded.', 'Unpredictable taste consistency and hygiene standards.', 'No formal hygiene certifications or safety background checks.', 'Monthly fixed salary commitment even when you travel or skip meals.'],
        footer: 'Unreliable scheduling & zero safety netting'
    },
    {
        title: 'Verified Master Home Chef',
        isBad: false,
        points: ['Piping hot straight from tawa to table, retaining full aroma & nutrients.', 'Tailored spice, oil & salt levels: you write the menu in your booking note.', 'Phone-verified, contract-signed chefs approved by our team.', 'Fixed price for a 2-hour slot, paid in cash after the meal.'],
        footer: 'Zero stress. Total control.'
    }
]

const ChefDifference = () => (
    <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="text-center max-w-3xl mx-auto">
                <Pill className="bg-[#D3F0DE] text-[#17392C]">Why cook fresh at home</Pill>
                <h2 style={heading} className="mt-4 text-4xl text-[#17392C] md:text-[44px]">The Chef Haazir Difference</h2>
                <p className="mt-3 text-[15px] text-[#5E6B63]">Cooked hot in your kitchen vs. soggy takeout delivery or unreliable domestic help.</p>
            </Reveal>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Reveal delay={0.1} className="flex-1 min-w-[200px] rounded-2xl bg-[#F5F0E4] p-5 text-center transition hover:-translate-y-1 hover:shadow-sm">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17392C]"><Icon name="users" size={18} /></span>
                    <p className="mt-3 text-2xl font-bold text-[#17392C]">15 min</p>
                    <p className="text-[12px] text-[#5E6B63]">Chefs accept or decline your request</p>
                </Reveal>
                <Reveal delay={0.2} className="flex-1 min-w-[200px] rounded-2xl bg-[#F5F0E4] p-5 text-center transition hover:-translate-y-1 hover:shadow-sm">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17392C]"><Icon name="clock" size={18} /></span>
                    <p className="mt-3 text-2xl font-bold text-[#17392C]">2 hours</p>
                    <p className="text-[12px] text-[#5E6B63]">One fixed-price cooking slot in your kitchen</p>
                </Reveal>
                <Reveal delay={0.3} className="flex-1 min-w-[200px] rounded-2xl bg-[#F5F0E4] p-5 text-center transition hover:-translate-y-1 hover:shadow-sm">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17392C]"><Icon name="shield" size={18} /></span>
                    <p className="mt-3 text-2xl font-bold text-[#17392C]">Rs 0</p>
                    <p className="text-[12px] text-[#5E6B63]">Advance payment: pay in cash after the meal</p>
                </Reveal>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {chefDifferenceData.map((col, i) => (
                    <Reveal key={col.title} delay={i * 0.1}>
                        <motion.div 
                            whileHover={{ y: -6 }} 
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            className="flex h-full flex-col rounded-2xl border border-[#17392C] bg-[#17392C] p-6 text-white shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#C2E35A]">{col.title}</h3>
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C2E35A] text-[#17392C]">
                                    <Icon name="check" size={14} strokeWidth={2.6} />
                                </span>
                            </div>
                            <ul className="mt-4 flex-1 space-y-2 text-[12.5px] leading-relaxed text-white/85">
                                {col.points.map((p, idx) => (
                                    <li key={idx} className="flex gap-2">
                                        <Icon name="check" size={13} strokeWidth={2.6} className="mt-0.5 shrink-0 text-[#C2E35A]" /> {p}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 border-t border-white/10 pt-3 text-[12px] font-semibold text-[#C2E35A]">
                                {col.footer}
                            </div>
                        </motion.div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

const mealPlans = [
    { icon: 'pot', tag: 'Daily routine', title: 'Ghar ka khana (daily)', desc: 'Fresh daal-chawal, roti, sabzi and a salan. Ideal for students and bachelors who want to eat clean.', cuisine: 'Desi', col: 'bg-[#F8D9B6]' },
    { icon: 'sparkle', tag: 'Celebrations', title: 'Weekend dawat & BBQ', desc: 'Biryani, karahi, seekh kebab and more for your guests. Tell the chef the menu and the number of people.', cuisine: 'BBQ', col: 'bg-[#C2E35A]' },
    { icon: 'basket', tag: 'Lighter meals', title: 'Healthy home food', desc: 'Less oil, less salt, grilled and steamed dishes. Write your diet needs in the booking note.', cuisine: 'Healthy', col: 'bg-[#D3F0DE]' },
    { icon: 'users', tag: 'Shared flats', title: 'Meal prep for flatmates', desc: 'Book one 2-hour slot, cook two or three days of meals, and split the cost with your flatmates.', cuisine: '', col: 'bg-[#F5F0E4]' }
]

const MealPlans = () => (
    <section className="bg-[#FAF6EE] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-10">
                <div>
                    <Pill className="bg-[#C2E35A] text-[#17392C]">Tailored Offerings</Pill>
                    <h2 style={heading} className="mt-4 text-4xl text-[#17392C] md:text-[42px]">Curated Meal Plans & Dawat Packages</h2>
                    <p className="mt-2 text-[15px] text-[#5E6B63]">Whether it's your daily rotis or an elaborate 20-guest weekend dawat, we have you covered.</p>
                </div>
                <Link to="/chefs" className="group flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#17392C]">
                    See all chefs <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
                </Link>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mealPlans.map((plan, i) => (
                    <Reveal key={plan.title} delay={i * 0.08}>
                        <motion.div 
                            whileHover={{ y: -6 }} 
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm border border-[#E9E3D3] transition-shadow hover:shadow-lg"
                        >
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.col} text-[#17392C]`}><Icon name={plan.icon} size={18} /></span>
                            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#8A9189]">{plan.tag}</p>
                            <h3 style={heading} className="mt-1 text-[17px] text-[#17392C]">{plan.title}</h3>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-[#5E6B63] flex-1">{plan.desc}</p>
                            <div className="mt-5 border-t border-[#EFE9DA] pt-4 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-[#5E6B63]">Fixed price per 2-hr slot</p>
                                <Link to={plan.cuisine ? `/chefs?cuisine=${encodeURIComponent(plan.cuisine)}` : '/chefs'} className="rounded-full bg-[#17392C] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0F2A20] hover:scale-105 active:scale-95">Find chefs</Link>
                            </div>
                        </motion.div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

const purityPillars = [
    { num: '01', title: 'Verified before the first booking', desc: 'Every chef verifies their phone number, signs our chef contract and legal declaration, and is approved by our team before customers can book them.' },
    { num: '02', title: 'Groceries from our city store', desc: 'Add atta, meat, sabzi and masalas when you book. Prices are locked into your booking and the store delivers them to your chef before the slot.' },
    { num: '03', title: 'Report any problem', desc: 'Something went wrong? Report it from the slot start until 24 hours after. Our team reviews every report and can suspend accounts.' },
    { num: '04', title: 'Pay after the meal', desc: 'No advance payment. Pay the chef in cash once the food is ready. Free cancellation until 1.5 hours before your slot.' }
]

const PurityPromise = () => (
    <section className="bg-white py-20 lg:py-24 border-t border-[#F5F0E4]">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="text-center max-w-3xl mx-auto">
                <Pill className="bg-[#D3F0DE] text-[#17392C]">Our promise</Pill>
                <h2 style={heading} className="mt-4 text-4xl text-[#17392C] md:text-[44px]">Four promises on every booking</h2>
                <p className="mt-3 text-[15px] text-[#5E6B63]">Your home, safety, and health are sacred. Here is how we protect every meal.</p>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {purityPillars.map((p, i) => (
                    <Reveal key={p.num} delay={i * 0.08}>
                        <motion.div 
                            whileHover={{ y: -4 }} 
                            className="rounded-2xl bg-[#FAF6EE] p-5 transition-shadow hover:shadow-sm"
                        >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#17392C]">{p.num}</span>
                            <h3 style={heading} className="mt-4 text-[16px] text-[#17392C]">{p.title}</h3>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-[#5E6B63]">{p.desc}</p>
                        </motion.div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

// ---------------- Closing call to action ----------------
const ClosingCta = () => {
    const { user } = useAuth()
    const canBecomeChef = !user || user.role === 'user'

    return (
        <section className="bg-white px-4 pb-20 pt-10 md:px-8 lg:pb-24">
            <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[radial-gradient(ellipse_at_85%_85%,#2E5A45_0%,#17392C_55%,#102B21_100%)] px-6 py-16 text-center text-white sm:px-12 lg:py-20">
                <h2 style={heading} className="mx-auto max-w-2xl text-[34px] text-white md:text-[46px]">Ready to taste real home cooking?</h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
                    Book your favourite neighborhood chef in a few taps. Pick a slot, add groceries if you like, and pay in cash after the meal.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link to="/chefs" className="group inline-flex items-center gap-2 rounded-full bg-[#C2E35A] px-7 py-3.5 text-[14px] font-semibold text-[#17392C] transition hover:bg-[#B3D94A] hover:scale-105 active:scale-95">
                        Find a chef <Icon name="arrowRight" size={16} className="transition group-hover:translate-x-1" />
                    </Link>
                    {canBecomeChef && (
                        <Link to="/signup?role=chef" className="inline-flex items-center rounded-full bg-white/90 px-7 py-3.5 text-[14px] font-semibold text-[#17392C] transition hover:bg-white hover:scale-105 active:scale-95">
                            Become a chef
                        </Link>
                    )}
                </div>
            </Reveal>
        </section>
    )
}

const Home = () => (
    <>
        <Hero />
        <HowItWorks />
        <MasterChefs />
        <Groceries />
        <ChefDifference />
        <MealPlans />
        <PurityPromise />
        <ClosingCta />
    </>
)

export default Home