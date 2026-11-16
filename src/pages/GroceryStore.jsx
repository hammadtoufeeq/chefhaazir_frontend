import { useEffect, useState } from 'react'
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

const PAGE_SIZE = 24

const ItemCard = ({ item }) => {
    const style = categoryStyle[item.category] || categoryStyle.Other
    return (
        <article className={`flex items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${item.inStock ? '' : 'opacity-60'}`}>
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-[26px] ${style.tint}`} aria-hidden="true">{style.emoji}</span>
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-bold" title={item.name}>{item.name}</h3>
                <p className="text-[11px] text-muted">{item.category}</p>
                <p className="mt-1.5 text-[14px]">
                    <span className="font-bold text-rust">Rs {item.price.toLocaleString()}</span>
                    <span className="text-[12px] text-muted"> / {item.unit}</span>
                </p>
            </div>
            {!item.inStock && <span className="shrink-0 self-start rounded bg-line px-2 py-0.5 text-[10px] font-bold uppercase text-ink/70">Out of stock</span>}
        </article>
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

    return (
        <>
            <DeliveryBar />
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Link to="/grocery" className="hover:text-rust">Grocery</Link>
                    <Icon name="arrowRight" size={12} />
                    <span className="font-semibold text-ink">{city}</span>
                </nav>

                <header className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <p className="eyebrow">City store · {city}</p>
                        <h1 className="mt-2 font-serif text-[38px] leading-tight tracking-tight sm:text-[44px]">{store?.name || `${city} store`}</h1>
                        <p className="mt-1.5 text-[14px] text-muted">
                            {isLoading ? 'Loading the catalog…' : noStore ? 'Not open yet.' : `${data.pagination.total} ${category || 'items'}${search ? ` matching “${search}”` : ''} · delivered to your chef before the slot`}
                        </p>
                    </div>
                    {!noStore && (
                        <label className="relative w-full md:w-80">
                            <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                            <input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={50} placeholder="Search atta, chicken, haldi…" aria-label="Search items" className="w-full rounded-lg border border-line bg-white py-3 pl-10 pr-4 text-[14px] outline-none transition placeholder:text-muted focus:border-sage focus:ring-2 focus:ring-sage/20" />
                        </label>
                    )}
                </header>

                {noStore ? (
                    <div className="mt-10 rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft text-rust"><Icon name="store" size={26} /></span>
                        <p className="mt-5 font-serif text-2xl">No grocery store in {city} yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">You can still book a chef in {city}. They will cook with the groceries you have at home.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link to={`/chefs?city=${encodeURIComponent(city)}`} className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Find chefs in {city}</Link>
                            <Link to="/grocery" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-sage/50">Other city stores</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Category chips */}
                        <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
                            <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
                                {['', ...groceryCategories].map((c) => {
                                    const active = category === c
                                    return (
                                        <button key={c || 'all'} type="button" aria-pressed={active} onClick={() => update({ category: c, page: '1' })}
                                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white text-ink/80 hover:border-sage/50'}`}>
                                            {c && <span aria-hidden="true">{categoryStyle[c].emoji}</span>} {c || 'All items'}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {isError ? (
                            <div className="mt-8 rounded-xl border border-line bg-white p-10 text-center shadow-card">
                                <p className="font-serif text-2xl">Couldn’t load the items</p>
                                <p className="mt-2 text-sm text-muted">{errorMessage(error)}</p>
                                <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Try again</button>
                            </div>
                        ) : (
                            <div className={`mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
                                {isLoading && Array.from({ length: 8 }, (_, i) => <div key={i} className="h-[90px] animate-pulse rounded-xl bg-sand" />)}
                                <AnimatePresence mode="popLayout">
                                    {data?.items.map((item, i) => (
                                        <motion.div key={item._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.02 }}>
                                            <ItemCard item={item} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {data && data.items.length === 0 && (
                            <div className="mt-6 rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
                                <p className="font-serif text-2xl">Nothing found</p>
                                <p className="mt-2 text-sm text-muted">Try another word or category.</p>
                                <button type="button" onClick={() => { setTerm(''); update({ category: '', search: '', page: '1' }) }} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Show all items</button>
                            </div>
                        )}

                        <Pagination page={page} totalPages={data?.pagination.totalPages ?? 0} onPage={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />

                        {/* How ordering works */}
                        <div className="mt-14 grid gap-5 rounded-xl border border-line bg-sand/70 p-6 sm:p-7 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <p className="font-serif text-[20px]">How to order these</p>
                                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                                    This catalog is for browsing. Book a chef in {city} and pick items and quantities on the booking form. Delivery is free from Rs {FREE_DELIVERY_FROM}, otherwise Rs {DELIVERY_FEE}. You pay the chef in cash with their fee.
                                </p>
                            </div>
                            <Link to={`/chefs?city=${encodeURIComponent(city)}`} className="flex items-center justify-center gap-2 rounded-lg bg-rust px-5 py-3 text-[13px] font-bold text-white transition hover:bg-rust-dark">
                                Book a chef in {city} <Icon name="arrowRight" size={15} />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default GroceryStore
