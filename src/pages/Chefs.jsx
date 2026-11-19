import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import { images, chefPhoto } from '../constants/images'
import { useCity } from '../context/CityContext'
import { todayInPakistan, addDays, dateParts, SLOTS } from '../lib/time'
import Icon from '../components/Icon'
import SafeImage from '../components/SafeImage'
import Pagination from '../components/Pagination'

// ---------------------------------------------------------------------------
// Find Chefs. Same palette as Home, used simply:
//   hero      -> forest green #17392C (one colour)
//   main body -> cream #FAF6EE (one colour), white cards
//   accents   -> lime #C2E35A, mint #D3F0DE, beige #F5F0E4, borders #E9E3D3
// Every filter here is sent to GET /chefs; the cuisine chips and price range
// come from GET /chefs/filters, so nothing on the page is made up.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 9
const ALL = 'all'
const heading = { fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }

const slotName = { '08-10': 'Breakfast', '10-12': 'Brunch', '12-14': 'Lunch', '14-16': 'Afternoon', '16-18': 'Evening', '18-20': 'Dinner', '20-22': 'Late dinner' }
const slotTime = (slot) => {
    const [a, b] = slot.split('-').map(Number)
    const h = (n) => n % 12 || 12
    const ap = (n) => (n >= 12 ? 'PM' : 'AM')
    return ap(a) === ap(b) ? `${h(a)}–${h(b)} ${ap(b)}` : `${h(a)} ${ap(a)}–${h(b)} ${ap(b)}`
}
// A slot can be booked only if it starts at least 2 hours from now (Pakistan time)
const slotOpen = (date, slot) => new Date(`${date}T${slot.slice(0, 2)}:00:00+05:00`).getTime() - Date.now() >= 2 * 60 * 60 * 1000
const dayLabel = (date, today) => {
    if (date === today) return 'Today'
    if (date === addDays(today, 1)) return 'Tomorrow'
    const p = dateParts(date)
    return `${p.day} ${p.date} ${p.month}`
}
const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`

// Filters live in the URL so links, refresh and the back button keep them
const readFilters = (params, fallbackCity) => ({
    search: params.get('search') || '',
    city: params.get('city') || fallbackCity,
    cuisine: params.get('cuisine') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    date: params.get('date') || '',
    slot: params.get('slot') || '',
    sort: params.get('sort') || 'newest'
})

// ---------------- Chef card ----------------
const ChefCard = ({ chef, date, slot, today }) => {
    const bookLink = `/chefs/${chef.id}${date && slot ? `?date=${date}&slot=${slot}` : ''}`
    return (
        <motion.article whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="flex h-full flex-col rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-card">
            <Link to={bookLink} className="relative block overflow-hidden rounded-xl">
                <SafeImage src={chefPhoto(chef)} alt={`${chef.cuisines?.[0] || 'Home'} food`} className="h-44" imgClassName="transition duration-700 hover:scale-105" />
                {chef.cuisines?.[0] && <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-full bg-[#C2E35A] px-2.5 py-1 text-[11px] font-bold text-[#17392C]">{chef.cuisines[0]}</span>}
                <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#17392C] backdrop-blur-sm"><Icon name="pin" size={12} /> {chef.city}</span>
            </Link>
            <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 style={heading} className="text-[19px] text-[#17392C]">{chef.name}</h3>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#D3F0DE] px-2 py-0.5 text-[10px] font-bold text-[#17392C]"><Icon name="shield" size={11} /> Verified</span>
                </div>
                {date && slot && (
                    <p className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-[#F5F0E4] px-2.5 py-1 text-[11px] font-semibold text-[#17392C]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7DBB3A]" /> Free {dayLabel(date, today).toLowerCase() === 'today' ? 'today' : dayLabel(date, today)} · {slotTime(slot)}
                    </p>
                )}
                {chef.bio && <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-[#5E6B63]">{chef.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {(chef.cuisines || []).slice(0, 4).map((c) => <span key={c} className="rounded-full bg-[#F5F0E4] px-2.5 py-1 text-[11px] font-medium text-[#4E5F55]">{c}</span>)}
                </div>
                <div className="min-h-4 flex-1" />
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#EFE9DA] pt-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Cooking fee</p>
                        <p className="whitespace-nowrap text-[18px] font-bold leading-tight text-[#17392C]">{money(chef.ratePerSlot)}</p>
                        <p className="text-[11px] text-[#8A9189]">per 2-hour slot</p>
                    </div>
                    <Link to={bookLink} className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#17392C] px-4 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[#0F2A20]">
                        Book chef <Icon name="arrowRight" size={14} className="transition group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </motion.article>
    )
}

const CardSkeleton = () => (
    <div className="rounded-2xl border border-[#E9E3D3] bg-white p-3">
        <div className="h-44 animate-pulse rounded-xl bg-[#F5F0E4]" />
        <div className="space-y-3 p-2 pt-4"><div className="h-5 w-2/3 animate-pulse rounded bg-[#F5F0E4]" /><div className="h-4 w-full animate-pulse rounded bg-[#F5F0E4]" /><div className="h-10 animate-pulse rounded-full bg-[#F5F0E4]" /></div>
    </div>
)

// ---------------- Hero search (forest green band) ----------------
const field = 'h-12 w-full appearance-none rounded-xl border border-transparent bg-[#FAF6EE] pr-9 text-[13px] text-[#17392C] outline-none transition focus:border-[#17392C]/40 focus:bg-white'

const HeroSearch = ({ filters, onApply, today, dates }) => {
    const [draft, setDraft] = useState(filters)
    useEffect(() => setDraft(filters), [filters])   // eslint-disable-line react-hooks/exhaustive-deps

    const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
    const pickDate = (e) => {
        const date = e.target.value
        // Drop a slot that is no longer bookable on the new day
        setDraft((d) => ({ ...d, date, slot: d.slot && !slotOpen(date || today, d.slot) ? '' : d.slot }))
    }
    const submit = (e) => {
        e.preventDefault()
        const next = { ...draft, search: draft.search.trim() }
        // Availability needs both: a time with no day means today; a day with no time is ignored
        if (next.slot && !next.date) next.date = today
        if (!next.slot) next.date = ''
        onApply(next)
    }

    return (
        <form onSubmit={submit} className="rounded-2xl bg-white p-2.5 shadow-lift">
            <div className="grid gap-2 md:grid-cols-[1.6fr_1fr_1fr_1.1fr_auto]">
                <label className="relative">
                    <span className="sr-only">Search chefs</span>
                    <Icon name="search" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                    <input value={draft.search} onChange={set('search')} maxLength={50} placeholder="Chef name, karahi, biryani, nihari…" className={`${field} pl-11`} />
                </label>
                <label className="relative">
                    <span className="sr-only">City</span>
                    <Icon name="pin" size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                    <select value={draft.city} onChange={set('city')} className={`${field} pl-10`}>
                        <option value={ALL}>All cities</option>
                        {cities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                </label>
                <label className="relative">
                    <span className="sr-only">Day</span>
                    <Icon name="calendar" size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                    <select value={draft.date} onChange={pickDate} className={`${field} pl-10`}>
                        <option value="">Any day</option>
                        {dates.map((d) => <option key={d} value={d}>{dayLabel(d, today)}</option>)}
                    </select>
                    <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                </label>
                <label className="relative">
                    <span className="sr-only">Time slot</span>
                    <Icon name="clock" size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                    <select value={draft.slot} onChange={(e) => setDraft((d) => ({ ...d, slot: e.target.value, date: e.target.value && !d.date ? today : d.date }))} className={`${field} pl-10`}>
                        <option value="">Any time</option>
                        {SLOTS.map((s) => {
                            const open = slotOpen(draft.date || today, s)
                            return <option key={s} value={s} disabled={!open}>{slotName[s]} ({slotTime(s)}){open ? '' : ' · too soon'}</option>
                        })}
                    </select>
                    <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                </label>
                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C2E35A] px-6 text-[13.5px] font-bold text-[#17392C] transition hover:bg-[#B3D94A]">
                    Find chefs <Icon name="arrowRight" size={16} />
                </button>
            </div>
            <p className="px-2 pb-1 pt-2.5 text-[11px] text-[#8A9189]">Pick a day and a time to see only chefs who are free then. Book at least 2 hours ahead, up to 7 days.</p>
        </form>
    )
}

// ---------------- Price filter (sidebar) ----------------
const PricePanel = ({ filters, range, onApply }) => {
    const [min, setMin] = useState(filters.minPrice)
    const [max, setMax] = useState(filters.maxPrice)
    useEffect(() => { setMin(filters.minPrice); setMax(filters.maxPrice) }, [filters.minPrice, filters.maxPrice])
    const bad = min && max && Number(min) > Number(max)

    // Quick ranges built from the real lowest and highest price
    const presets = useMemo(() => {
        if (!range?.max) return []
        const lo = range.min, hi = range.max
        if (hi - lo < 300) return []
        const mid = Math.round((lo + (hi - lo) / 2) / 100) * 100
        return [{ label: `Under ${money(mid)}`, min: '', max: String(mid) }, { label: `${money(mid)} and above`, min: String(mid), max: '' }]
    }, [range])

    const input = 'h-11 w-full rounded-xl border border-[#E9E3D3] bg-[#FAF6EE] pl-10 pr-3 text-right text-[13px] font-bold text-[#17392C] outline-none focus:border-[#17392C]/40 focus:bg-white'
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Price per 2-hr slot</p>
            {range?.max > 0 && <p className="mt-1 text-[11.5px] text-[#5E6B63]">Chefs here charge {money(range.min)} – {money(range.max)}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
                {[['Min', min, setMin], ['Max', max, setMax]].map(([label, value, setter]) => (
                    <label key={label} className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#8A9189]">{label}</span>
                        <input type="number" inputMode="numeric" min={0} step={100} value={value} onChange={(e) => setter(e.target.value)} placeholder="Any" className={input} />
                    </label>
                ))}
            </div>
            {bad && <p className="mt-2 text-[11.5px] font-medium text-[#B4441C]">Min cannot be more than max</p>}
            {presets.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                        <button key={p.label} type="button" onClick={() => onApply({ ...filters, minPrice: p.min, maxPrice: p.max })} className="rounded-full border border-[#E9E3D3] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#17392C] hover:border-[#17392C]/40">{p.label}</button>
                    ))}
                </div>
            )}
            <button type="button" disabled={!!bad} onClick={() => onApply({ ...filters, minPrice: min, maxPrice: max })} className="mt-3 w-full rounded-xl bg-[#17392C] py-2.5 text-[12.5px] font-bold text-white transition hover:bg-[#0F2A20] disabled:opacity-50">Apply price</button>
        </div>
    )
}

// ---------------- Page ----------------
const Chefs = () => {
    const [params, setParams] = useSearchParams()
    const { city: preferredCity, setCity } = useCity()
    const [showFilters, setShowFilters] = useState(false)
    const today = todayInPakistan()
    const dates = useMemo(() => Array.from({ length: 8 }, (_, i) => addDays(today, i)), [today])

    const filters = readFilters(params, preferredCity)
    const page = Math.max(1, Number(params.get('page')) || 1)
    const cityName = filters.city === ALL ? null : filters.city
    const place = cityName || 'Pakistan'
    // Ignore an old or too-soon date/slot left in the URL
    const availability = filters.date && filters.slot && dates.includes(filters.date) && SLOTS.includes(filters.slot) && slotOpen(filters.date, filters.slot)

    const query = {
        search: filters.search || undefined,
        city: cityName || undefined,
        cuisine: filters.cuisine || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        date: availability ? filters.date : undefined,
        slot: availability ? filters.slot : undefined,
        sort: filters.sort !== 'newest' ? filters.sort : undefined,
        page,
        limit: PAGE_SIZE
    }

    const list = useQuery({
        queryKey: ['chefs', 'list', query],
        queryFn: async () => (await api.get('/chefs', { params: query })).data,
        placeholderData: keepPreviousData
    })
    const facets = useQuery({
        queryKey: ['chefs', 'filters', cityName],
        queryFn: async () => (await api.get('/chefs/filters', { params: { city: cityName || undefined } })).data
    })

    const apply = (next, nextPage = 1) => {
        const p = new URLSearchParams()
        Object.entries(next).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'newest')) p.set(k, v) })
        if (nextPage > 1) p.set('page', nextPage)
        setParams(p)
        if (next.city && next.city !== ALL) setCity(next.city)
        setShowFilters(false)
    }
    const goToPage = (p) => { apply(filters, p); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    const clearAll = () => apply({ city: filters.city })
    const remove = (...keys) => apply({ ...filters, ...Object.fromEntries(keys.map((k) => [k, ''])) })

    const chefs = list.data?.chefs || []
    const total = list.data?.pagination?.total ?? 0
    const totalPages = list.data?.pagination?.totalPages ?? 0
    const from = total ? (page - 1) * PAGE_SIZE + 1 : 0
    const to = Math.min(page * PAGE_SIZE, total)
    const cuisineChips = facets.data?.cuisines || []

    const active = [
        filters.search && { label: `“${filters.search}”`, keys: ['search'] },
        filters.cuisine && { label: filters.cuisine, keys: ['cuisine'] },
        availability && { label: `${dayLabel(filters.date, today)} · ${slotTime(filters.slot)}`, keys: ['date', 'slot'] },
        (filters.minPrice || filters.maxPrice) && { label: `${filters.minPrice ? money(filters.minPrice) : 'Any'} – ${filters.maxPrice ? money(filters.maxPrice) : 'Any'}`, keys: ['minPrice', 'maxPrice'] }
    ].filter(Boolean)

    return (
        <div className="bg-[#FAF6EE]">
            {/* ===== Hero: one colour, forest green ===== */}
            <section className="relative overflow-hidden bg-[#17392C] text-white">
                <svg aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] text-white" viewBox="0 0 600 600" fill="none">
                    {[110, 180, 250, 300].map((r) => <circle key={r} cx="300" cy="300" r={r} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1.5" />)}
                </svg>
                <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 md:px-8 lg:pb-14 lg:pt-14">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#C2E35A]" />
                                {facets.isLoading ? 'Finding verified chefs…' : `${facets.data?.totalChefs ?? 0} verified home ${facets.data?.totalChefs === 1 ? 'chef' : 'chefs'} in ${place}`}
                            </span>
                            <h1 style={heading} className="mt-4 text-[36px] text-white sm:text-[46px] lg:text-[52px]">
                                Find a home chef in <span className="text-[#C2E35A]">{place}</span>
                            </h1>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
                                Every chef here is phone-verified and approved by our team. Pick a free 2-hour slot, add groceries if you like, and pay in cash after the meal.
                            </p>
                            <ul className="mt-6 flex flex-wrap gap-2">
                                {[['shield', 'Phone verified & admin approved'], ['basket', 'Groceries from our city store'], ['wallet', 'Pay in cash after the meal']].map(([icon, text]) => (
                                    <li key={text} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] font-medium text-white/85"><Icon name={icon} size={13} className="text-[#C2E35A]" /> {text}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative hidden lg:block">
                            <div className="overflow-hidden rounded-[24px] border-[6px] border-white/10">
                                <SafeImage src={images.heroKarahi} alt="Chicken karahi cooking at home" eager className="h-72" />
                            </div>
                            <div className="absolute -bottom-5 -left-6 rounded-2xl bg-white p-4 text-[#17392C] shadow-lift">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">How booking works</p>
                                <ol className="mt-2 space-y-1.5 text-[12px] font-semibold">
                                    {['Pick a chef and a slot', 'Chef replies within 15 minutes', 'Pay after the meal'].map((t, i) => (
                                        <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C2E35A] text-[10px] font-bold">{i + 1}</span>{t}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 lg:mt-12">
                        <HeroSearch filters={filters} onApply={(next) => apply(next)} today={today} dates={dates} />
                    </div>
                </div>
            </section>

            {/* ===== Main body: one colour, cream ===== */}
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8">
                {/* Cuisine chips from real chef data */}
                <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
                    <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap">
                        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-[#8A9189]">Cuisines</span>
                        <button type="button" onClick={() => apply({ ...filters, cuisine: '' })} className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ${!filters.cuisine ? 'bg-[#17392C] text-white' : 'border border-[#E9E3D3] bg-white text-[#17392C] hover:border-[#17392C]/30'}`}>All cuisines</button>
                        {facets.isLoading && [0, 1, 2, 3].map((i) => <span key={i} className="h-9 w-24 animate-pulse rounded-full bg-[#F5F0E4]" />)}
                        {cuisineChips.map((c) => {
                            const on = filters.cuisine.toLowerCase() === c.name.toLowerCase()
                            return (
                                <button key={c.name} type="button" aria-pressed={on} onClick={() => apply({ ...filters, cuisine: on ? '' : c.name })}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition ${on ? 'bg-[#17392C] text-white' : 'border border-[#E9E3D3] bg-white text-[#17392C] hover:border-[#17392C]/30'}`}>
                                    {c.name} <span className={`text-[10.5px] ${on ? 'text-[#C2E35A]' : 'text-[#8A9189]'}`}>{c.count}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-8 grid items-start gap-8 lg:grid-cols-[270px_1fr]">
                    {/* Sidebar */}
                    <aside className="lg:sticky lg:top-24">
                        <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="flex w-full items-center justify-between rounded-xl border border-[#E9E3D3] bg-white px-4 py-3 text-[13px] font-bold text-[#17392C] lg:hidden">
                            <span className="flex items-center gap-2"><Icon name="filter" size={16} /> Price & filters {active.length > 0 && <span className="rounded-full bg-[#17392C] px-2 py-0.5 text-[10px] text-white">{active.length}</span>}</span>
                            <Icon name="chevronDown" size={16} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`${showFilters ? 'mt-3 block' : 'hidden'} space-y-4 lg:mt-0 lg:block`}>
                            <div className="rounded-2xl border border-[#E9E3D3] bg-white p-5">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#17392C]"><Icon name="filter" size={16} /> Refine</h2>
                                    {active.length > 0 && <button type="button" onClick={clearAll} className="text-[11.5px] font-semibold text-[#8A9189] hover:text-[#B4441C]">Reset all</button>}
                                </div>
                                <PricePanel filters={filters} range={facets.data?.price} onApply={apply} />
                            </div>
                            <div className="rounded-2xl bg-[#D3F0DE] p-5">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17392C]"><Icon name="shield" size={17} /></span>
                                <h3 className="mt-3 text-[13.5px] font-bold text-[#17392C]">How we verify chefs</h3>
                                <ul className="mt-2 space-y-1.5 text-[11.5px] text-[#17392C]/85">
                                    {['Phone number verified', 'Chef contract & declaration signed', 'Approved by our team', 'Any booking issue reviewed by us'].map((t) => (
                                        <li key={t} className="flex items-start gap-1.5"><Icon name="check" size={13} strokeWidth={2.6} className="mt-0.5 shrink-0 text-[#17392C]" /> {t}</li>
                                    ))}
                                </ul>
                                <Link to="/about#chef-contract" className="mt-3 inline-flex text-[11.5px] font-bold text-[#17392C] underline-offset-4 hover:underline">Read the chef contract →</Link>
                            </div>
                        </div>
                    </aside>

                    {/* Results */}
                    <section aria-live="polite">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 style={heading} className="text-[22px] text-[#17392C]">
                                    {list.isLoading ? 'Finding chefs…' : total ? `${total} ${total === 1 ? 'chef' : 'chefs'} in ${place}` : `No chefs found in ${place}`}
                                </h2>
                                <p className="mt-0.5 text-[12px] text-[#8A9189]">
                                    {total ? `Showing ${from}–${to}` : 'Try changing a filter'}{availability ? ` · free ${dayLabel(filters.date, today).toLowerCase() === 'today' ? 'today' : `on ${dayLabel(filters.date, today)}`}, ${slotTime(filters.slot)}` : ''}
                                    {list.isFetching && !list.isLoading && <span className="ml-2 inline-flex items-center gap-1"><span className="h-3 w-3 animate-spin rounded-full border-2 border-[#17392C] border-t-transparent" /> updating</span>}
                                </p>
                            </div>
                            <label className="flex items-center gap-2 text-[12.5px]">
                                <span className="text-[#8A9189]">Sort by</span>
                                <span className="relative">
                                    <select value={filters.sort} onChange={(e) => apply({ ...filters, sort: e.target.value })} className="appearance-none rounded-full border border-[#E9E3D3] bg-white py-2 pl-4 pr-9 font-semibold text-[#17392C] outline-none focus:border-[#17392C]/40">
                                        <option value="newest">Newest chefs</option>
                                        <option value="price_asc">Price: low to high</option>
                                        <option value="price_desc">Price: high to low</option>
                                    </select>
                                    <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                                </span>
                            </label>
                        </div>

                        {active.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {active.map((a) => (
                                    <button key={a.label} type="button" onClick={() => remove(...a.keys)} className="flex items-center gap-1.5 rounded-full bg-[#17392C] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#0F2A20]">
                                        {a.label} <Icon name="close" size={12} strokeWidth={2.4} />
                                    </button>
                                ))}
                                <button type="button" onClick={clearAll} className="text-[11.5px] font-semibold text-[#8A9189] underline-offset-4 hover:underline">Clear all</button>
                            </div>
                        )}

                        {list.isError ? (
                            <div className="mt-6 rounded-2xl border border-[#E9E3D3] bg-white p-10 text-center">
                                <p style={heading} className="text-xl text-[#17392C]">Couldn’t load chefs</p>
                                <p className="mt-2 text-sm text-[#8A9189]">{errorMessage(list.error)}</p>
                                <button type="button" onClick={() => list.refetch()} className="mt-5 rounded-full bg-[#17392C] px-6 py-2.5 text-sm font-semibold text-white">Try again</button>
                            </div>
                        ) : (
                            <>
                                <div className={`mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${list.isFetching && !list.isLoading ? 'opacity-60' : ''}`}>
                                    {list.isLoading && Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
                                    <AnimatePresence mode="popLayout">
                                        {chefs.map((chef, i) => (
                                            <motion.div key={chef.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                                                <ChefCard chef={chef} date={availability ? filters.date : ''} slot={availability ? filters.slot : ''} today={today} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {list.data && chefs.length === 0 && (
                                    <div className="mt-6 rounded-2xl border border-dashed border-[#D9D2BF] bg-white px-6 py-14 text-center">
                                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E4] text-[#17392C]"><Icon name="pot" size={28} /></span>
                                        <p style={heading} className="mt-5 text-2xl text-[#17392C]">{active.length ? 'No chefs match these filters' : `No chefs in ${place} yet`}</p>
                                        <p className="mx-auto mt-2 max-w-sm text-sm text-[#8A9189]">
                                            {availability ? 'Everyone is busy at that time. Try another slot or day.' : active.length ? 'Try another cuisine, a wider price range or a different name.' : 'New chefs are joining. Try another city for now.'}
                                        </p>
                                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                                            {active.length > 0 && <button type="button" onClick={clearAll} className="rounded-full bg-[#17392C] px-6 py-2.5 text-sm font-semibold text-white">Clear filters</button>}
                                            {cityName && <button type="button" onClick={() => apply({ ...filters, city: ALL })} className="rounded-full border border-[#E9E3D3] bg-white px-6 py-2.5 text-sm font-semibold text-[#17392C]">Search all cities</button>}
                                        </div>
                                    </div>
                                )}

                                <Pagination page={page} totalPages={totalPages} onPage={goToPage} className="mt-10 justify-center" />
                            </>
                        )}
                    </section>
                </div>

                {/* Dawat help */}
                <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-[24px] border border-[#E9E3D3] bg-white p-7 sm:flex-row sm:items-center sm:p-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C2E35A] text-[#17392C]"><Icon name="sparkle" size={22} /></span>
                        <div>
                            <h3 style={heading} className="text-[20px] text-[#17392C]">Planning a dawat or family gathering?</h3>
                            <p className="mt-1 max-w-lg text-[13.5px] text-[#5E6B63]">Tell us the date, city and number of guests and we’ll help you pick the right chef and menu.</p>
                        </div>
                    </div>
                    <Link to="/contact" className="flex shrink-0 items-center gap-2 rounded-full bg-[#17392C] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#0F2A20]">
                        <Icon name="chat" size={16} /> Contact our team
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Chefs
