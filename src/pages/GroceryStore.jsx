import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import { groceryCategories, categoryStyle, FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'
import { useCity } from '../context/CityContext'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import DeliveryBar from '../components/DeliveryBar'

const PAGE_SIZE = 12

// "kg" -> "per kg", "dozen" -> "per dozen"
const unitLine = (unit) => `Sold per ${unit}`

// One catalog item: { name, category, price, unit, inStock }. Items have no photo, so the
// tile shows the category's emoji on its tint.
const ItemCard = ({ item, onOpen }) => {
    const style = categoryStyle[item.category] || categoryStyle.Other
    const out = !item.inStock
    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            aria-haspopup="dialog"
            className={`group flex h-full w-full flex-col rounded-xl border border-line bg-white p-2.5 text-left shadow-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${out ? '' : 'hover:-translate-y-1 hover:shadow-lift'}`}
        >
            <div className={`relative flex aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-lg sm:aspect-[4/3] ${style.tint} ${out ? 'grayscale' : ''}`}>
                <span className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/30" />
                <span className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/25" />
                <span aria-hidden="true" className={`relative text-[64px] drop-shadow-sm transition-transform duration-500 ${out ? 'opacity-50' : 'group-hover:scale-110 group-hover:-rotate-6'}`}>{style.emoji}</span>
                <span className={`absolute left-2.5 top-2.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${out ? 'bg-white/80 text-rust' : 'bg-white text-ink shadow-sm'}`}>
                    {out ? 'Out of stock' : 'In stock'}
                </span>
            </div>
            <div className={`flex w-full flex-1 flex-col px-2 pb-2 pt-4 ${out ? 'opacity-60' : ''}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{item.category}</p>
                <h3 className="mt-1.5 font-serif text-[20px] leading-tight">{item.name}</h3>
                <p className="mt-1 text-[12px] text-muted">{unitLine(item.unit)}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-5">
                    <div>
                        <p className={`text-[10px] ${out ? 'text-rust' : 'text-muted'}`}>{out ? 'Back in stock soon' : 'Price locked at booking'}</p>
                        <p className="leading-none">
                            <span className="font-serif text-[24px] font-semibold text-rust">Rs {item.price.toLocaleString()}</span>
                            <span className="text-[13px] text-muted"> / {item.unit}</span>
                        </p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1 rounded border px-2.5 py-1.5 text-[11px] font-semibold transition ${out ? 'border-line text-muted' : 'border-line bg-sand/60 text-ink/80 group-hover:border-sage group-hover:bg-sage group-hover:text-white'}`}>
                        {out ? 'Unavailable' : <><Icon name="plus" size={13} strokeWidth={2.2} /> Add</>}
                    </span>
                </div>
            </div>
        </button>
    )
}

const steps = [
    { icon: 'chef', text: 'Pick a chef and a 2-hour slot' },
    { icon: 'basket', text: 'Add this item on the booking form' },
    { icon: 'truck', text: 'It reaches your chef before the slot' }
]

// Groceries can't be bought on their own: they are added to a booking with a chef
const BookChefFirst = ({ item, city, storeName, onClose }) => {
    const closeRef = useRef(null)

    useEffect(() => {
        if (!item) return
        closeRef.current?.focus()
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const { overflow } = document.body.style
        document.body.style.overflow = 'hidden'
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
    }, [item, onClose])

    const style = item && (categoryStyle[item.category] || categoryStyle.Other)

    return (
        <AnimatePresence>
            {item && (
                <motion.div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="book-first-title"
                        initial={{ y: 40, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 30, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-lift sm:rounded-2xl"
                    >
                        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white">
                            <Icon name="close" size={16} strokeWidth={2.2} />
                        </button>

                        {/* The item they clicked */}
                        <div className={`flex items-center gap-4 p-5 pr-14 ${style.tint}`}>
                            <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[38px]">{style.emoji}</span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/60">{item.category}</p>
                                <p className="font-serif text-[20px] leading-tight">{item.name}</p>
                                <p className="mt-0.5 text-[13px]"><span className="font-bold text-rust">Rs {item.price.toLocaleString()}</span> <span className="text-ink/60">/ {item.unit}</span></p>
                            </div>
                        </div>

                        <div className="p-6">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rust-soft text-rust"><Icon name="chef" size={22} /></span>
                            <h2 id="book-first-title" className="mt-4 font-serif text-[26px] leading-tight">Book a chef first</h2>
                            <p className="mt-2 text-[14px] leading-relaxed text-muted">
                                {item.inStock
                                    ? <>Groceries from {storeName} aren’t sold on their own. They come with a chef booking, and your chef brings them to your kitchen.</>
                                    : <>This item is out of stock right now. Groceries come with a chef booking, so pick a chef and add what’s available on the booking form.</>}
                            </p>

                            <ol className="mt-5 space-y-3">
                                {steps.map((s, i) => (
                                    <li key={s.text} className="flex items-center gap-3 text-[13.5px]">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[12px] font-bold text-sage-dark">{i + 1}</span>
                                        <Icon name={s.icon} size={16} className="text-muted" />
                                        {s.text}
                                    </li>
                                ))}
                            </ol>

                            <p className="mt-5 rounded-lg bg-sand/70 px-3.5 py-2.5 text-[12px] text-muted">
                                Free delivery from Rs {FREE_DELIVERY_FROM}, otherwise Rs {DELIVERY_FEE}. Pay the chef in cash with their fee.
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
                                <button type="button" onClick={onClose} className="rounded-lg border border-line px-5 py-3 text-[14px] font-semibold text-ink/80 hover:border-sage/50 sm:flex-1">Keep browsing</button>
                                <Link to={`/chefs?city=${encodeURIComponent(city)}`} className="flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-5 py-3 text-[14px] font-bold text-white hover:bg-sage sm:flex-[1.4]">
                                    Find a chef in {city} <Icon name="arrowRight" size={15} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

const GroceryStore = () => {
    const { city: rawCity } = useParams()
    const city = cities.find((c) => c.toLowerCase() === decodeURIComponent(rawCity).toLowerCase())
    const { setCity } = useCity()
    const [params, setParams] = useSearchParams()
    const category = params.get('category') || ''
    const search = params.get('search') || ''
    const page = Math.max(1, Number(params.get('page')) || 1)
    const [term, setTerm] = useState(search)
    const [picked, setPicked] = useState(null)
    const closePicked = useCallback(() => setPicked(null), [])

    useEffect(() => { if (city) setCity(city) }, [city])   // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => setTerm(search), [search])

    const update = (next) => {
        const p = new URLSearchParams({ category, search, ...next })
        ;[...p.keys()].forEach((k) => { if (!p.get(k) || (k === 'page' && p.get(k) === '1')) p.delete(k) })
        setParams(p)
    }

    // Search as you type, after a short pause
    useEffect(() => {
        const t = setTimeout(() => { if (term.trim() !== search) update({ search: term.trim(), page: '1' }) }, 350)
        return () => clearTimeout(t)
    }, [term])   // eslint-disable-line react-hooks/exhaustive-deps

    const query = { city, category: category || undefined, search: search || undefined, page, limit: PAGE_SIZE }
    const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
        queryKey: ['grocery', 'items', query],
        queryFn: async () => (await api.get('/grocery/items', { params: query })).data,
        enabled: !!city,
        placeholderData: keepPreviousData
    })

    // Total item count for the "All (n)" tab, whatever filter is active
    const { data: allCount } = useQuery({
        queryKey: ['grocery', 'count', city],
        queryFn: async () => (await api.get('/grocery/items', { params: { city, limit: 1 } })).data.pagination?.total ?? 0,
        enabled: !!city
    })

    if (!city) {
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <h1 className="font-serif text-4xl">City not found</h1>
                <Link to="/grocery" className="mt-6 inline-flex rounded-lg bg-sage px-5 py-2.5 font-semibold text-white">See all city stores</Link>
            </div>
        )
    }

    const store = data?.store
    const noStore = data && !store
    const total = data?.pagination.total ?? 0
    const chefsLink = `/chefs?city=${encodeURIComponent(city)}`
    const storeName = store?.name || `${city} store`
    const from = (page - 1) * PAGE_SIZE + 1
    const to = Math.min(page * PAGE_SIZE, total)

    return (
        <>
            <DeliveryBar />
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-8">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                    <Link to="/" className="hover:text-rust">Home</Link>
                    <Icon name="chevronDown" size={12} className="-rotate-90" />
                    <Link to="/grocery" className="hover:text-rust">Grocery Store</Link>
                    <Icon name="chevronDown" size={12} className="-rotate-90" />
                    <span className="text-ink">{storeName}</span>
                </nav>

                {/* Header */}
                <header className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                        {noStore ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-line/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/70">Not open in {city} yet</span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sage-dark">
                                <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Open for bookings in {city}
                            </span>
                        )}
                        <h1 className="mt-3 font-serif text-[36px] leading-tight tracking-tight sm:text-[46px]">
                            {store ? <>{store.name} <span className="text-muted/80">— {city}</span></> : storeName}
                        </h1>
                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                            <span className="flex items-center gap-1.5"><Icon name="truck" size={15} className="text-rust" /> Delivered to your chef before the slot</span>
                            <span className="hidden text-line sm:inline">•</span>
                            <span className="flex items-center gap-1.5"><Icon name="checkCircle" size={15} className="text-sage" /> Prices locked at booking</span>
                        </p>
                    </div>
                    {!noStore && (
                        <label className="relative w-full lg:w-[380px]">
                            <Icon name="search" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/70" />
                            <input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={50} placeholder="Search atta, basmati rice, desi ghee, chicken…" aria-label="Search items" className="w-full rounded-xl border border-line bg-white py-3.5 pl-11 pr-11 text-[13px] shadow-card outline-none transition placeholder:text-muted focus:border-sage focus:ring-2 focus:ring-sage/20" />
                            {term && (
                                <button type="button" onClick={() => setTerm('')} aria-label="Clear search" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                                    <Icon name="xCircle" size={17} />
                                </button>
                            )}
                        </label>
                    )}
                </header>

                {noStore ? (
                    <div className="mt-10 rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft text-rust"><Icon name="store" size={26} /></span>
                        <p className="mt-5 font-serif text-2xl">No grocery store in {city} yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">You can still book a chef in {city}. They will cook with the groceries you have at home.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link to={chefsLink} className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Find chefs in {city}</Link>
                            <Link to="/grocery" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-sage/50">Other city stores</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Category tabs */}
                        <div className="-mx-4 mt-7 overflow-x-auto border-t border-line px-4 pb-1 pt-5 md:mx-0 md:px-0">
                            <div className="flex w-max gap-2 lg:w-auto lg:flex-wrap">
                                {['', ...groceryCategories].map((c) => {
                                    const active = category === c
                                    return (
                                        <button key={c || 'all'} type="button" aria-pressed={active} onClick={() => update({ category: c, page: '1' })}
                                            className={`shrink-0 rounded-lg border px-4 py-2 text-[12px] font-semibold tracking-wide transition ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white text-ink/80 hover:border-sage/50'}`}>
                                            {c || `All${allCount !== undefined ? ` (${allCount})` : ''}`}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Browse-only notice */}
                        <div className="mt-6 flex flex-col gap-5 rounded-xl border border-line bg-sand/70 p-5 sm:p-6 md:flex-row md:items-center">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rust-soft text-rust"><Icon name="basket" size={24} /></span>
                            <div className="flex-1">
                                <p className="flex flex-wrap items-center gap-2 font-serif text-[20px] leading-tight sm:text-[22px]">
                                    This is browse only. Add groceries while booking a chef.
                                    <span className="rounded bg-[#F5E6C4] px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-rust-dark">Pantry service</span>
                                </p>
                                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
                                    Pick items and quantities on the booking form. Once the chef accepts, {storeName} packs your order and delivers it to the chef’s home, and the chef brings it to you. Free delivery from Rs {FREE_DELIVERY_FROM}, otherwise Rs {DELIVERY_FEE}.
                                </p>
                            </div>
                            <Link to={chefsLink} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sage-dark px-5 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-sage">
                                Find a chef <Icon name="arrowRight" size={16} />
                            </Link>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-3 text-[13px] text-muted">
                            <p>
                                {isLoading ? 'Loading…' : <>Showing <strong className="font-semibold text-ink">{total}</strong> {category ? category.toLowerCase() : 'pantry essentials'}{search && <> matching “<span className="text-ink">{search}</span>”</>} at {storeName}</>}
                            </p>
                            {isFetching && !isLoading && <span className="flex items-center gap-1.5 text-[12px]"><span className="h-3 w-3 animate-spin rounded-full border-2 border-sage border-t-transparent" /> Updating</span>}
                        </div>

                        {isError ? (
                            <div className="mt-5 rounded-xl border border-line bg-white p-10 text-center shadow-card">
                                <p className="font-serif text-2xl">Couldn’t load the items</p>
                                <p className="mt-2 text-sm text-muted">{errorMessage(error)}</p>
                                <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Try again</button>
                            </div>
                        ) : (
                            <div className={`mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
                                {isLoading && Array.from({ length: 8 }, (_, i) => <div key={i} className="h-[380px] animate-pulse rounded-xl bg-sand" />)}
                                <AnimatePresence mode="popLayout">
                                    {data?.items.map((item, i) => (
                                        <motion.div key={item._id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03 }}>
                                            <ItemCard item={item} onOpen={setPicked} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {data && data.items.length === 0 && (
                            <div className="mt-5 rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
                                <p className="font-serif text-2xl">Nothing found</p>
                                <p className="mt-2 text-sm text-muted">Try another word or category.</p>
                                <button type="button" onClick={() => { setTerm(''); update({ category: '', search: '', page: '1' }) }} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Show all items</button>
                            </div>
                        )}

                        {total > 0 && (
                            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
                                <p className="text-[13px] text-muted">Showing {from} to {to} of {total} products</p>
                                <Pagination className="justify-center" page={page} totalPages={data?.pagination.totalPages ?? 0} onPage={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
                            </div>
                        )}
                    </>
                )}
            </div>
            <BookChefFirst item={picked} city={city} storeName={storeName} onClose={closePicked} />
        </>
    )
}

export default GroceryStore
