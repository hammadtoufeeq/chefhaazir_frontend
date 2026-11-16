import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import { useCity } from '../context/CityContext'
import Icon from '../components/Icon'
import ChefCard, { ChefCardSkeleton } from '../components/ChefCard'

const PAGE_SIZE = 8
const ALL = 'all'   // ?city=all means every city

// Filters live in the URL (?search=&city=&cuisine=&minPrice=&maxPrice=&page=), so links and refresh keep them
const readFilters = (params, fallbackCity) => ({
    search: params.get('search') || '',
    city: params.get('city') || fallbackCity,
    cuisine: params.get('cuisine') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || ''
})

const Label = ({ children }) => <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/80">{children}</p>

const inputClass = 'w-full rounded-lg border border-line bg-white py-2.5 text-[13px] text-ink outline-none transition placeholder:text-muted focus:border-sage focus:ring-2 focus:ring-sage/20'

const FilterPanel = ({ applied, onApply, onClear }) => {
    const [draft, setDraft] = useState(applied)
    useEffect(() => setDraft(applied), [applied])

    const set = (key) => (e) => setDraft({ ...draft, [key]: e.target.value })
    const priceError = draft.minPrice && draft.maxPrice && Number(draft.minPrice) > Number(draft.maxPrice)
        ? 'Min cannot be more than max' : ''

    const submit = (e) => {
        e.preventDefault()
        if (!priceError) onApply(draft)
    }

    const budgetLabel = draft.minPrice || draft.maxPrice
        ? `${draft.minPrice ? `Rs ${Number(draft.minPrice).toLocaleString()}` : 'Any'} – ${draft.maxPrice ? `Rs ${Number(draft.maxPrice).toLocaleString()}` : 'Any'}`
        : 'Any'

    return (
        <form onSubmit={submit} className="rounded-xl border border-line bg-sand/60 p-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
                <p className="flex items-center gap-2 text-[14px] font-bold"><Icon name="filter" size={16} /> Refine by taste & kitchen</p>
                <button type="button" onClick={onClear} className="text-[13px] font-semibold text-ink/80 hover:text-rust">Clear all</button>
            </div>

            <div className="mt-5">
                <Label>Search chef</Label>
                <span className="relative block">
                    <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input value={draft.search} onChange={set('search')} maxLength={50} placeholder="Chef name, e.g. Shabana" className={`${inputClass} pl-9 pr-3`} />
                </span>
            </div>

            <div className="mt-6">
                <Label>City</Label>
                <span className="relative block">
                    <Icon name="pin" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <select value={draft.city} onChange={set('city')} className={`${inputClass} appearance-none pl-9 pr-9`}>
                        <option value={ALL}>All cities</option>
                        {cities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <Icon name="chevronDown" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                </span>
            </div>

            <div className="mt-6">
                <Label>Specialty cuisine</Label>
                <div className="flex flex-wrap gap-2">
                    {cuisines.map((c) => {
                        const active = draft.cuisine === c
                        return (
                            <button
                                key={c}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setDraft({ ...draft, cuisine: active ? '' : c })}
                                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white text-ink/75 hover:border-sage/50'}`}
                            >
                                {active && <Icon name="check" size={13} strokeWidth={2.4} />} {c}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-baseline justify-between">
                    <Label>Budget (2-hr slot)</Label>
                    <span className="text-[12px] font-bold text-rust">{budgetLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[['minPrice', 'Min'], ['maxPrice', 'Max']].map(([key, label]) => (
                        <label key={key} className="relative block">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">{label}</span>
                            <input type="number" inputMode="numeric" min={0} step={100} value={draft[key]} onChange={set(key)} placeholder="Any" className={`${inputClass} pl-11 pr-3 text-right font-bold`} />
                        </label>
                    ))}
                </div>
                {priceError && <p className="mt-2 text-[12px] font-medium text-rust">{priceError}</p>}
            </div>

            <button disabled={!!priceError} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-sage disabled:opacity-50">
                <Icon name="checkCircle" size={17} /> Apply filters
            </button>
        </form>
    )
}

// Page numbers with "…" when there are many pages
const pageList = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
    const sorted = [...set].sort((a, b) => a - b)
    return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ['…', p] : [p]))
}

const Pagination = ({ page, totalPages, onPage }) => {
    if (totalPages <= 1) return null
    const btn = 'flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition disabled:pointer-events-none disabled:opacity-40'
    const idle = 'border-line bg-white hover:border-sage/50'
    return (
        <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} ${idle}`}><Icon name="arrowLeft" size={14} /> Prev</button>
            {pageList(page, totalPages).map((p, i) => p === '…'
                ? <span key={`gap${i}`} className="px-1 text-muted">…</span>
                : <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)} className={`${btn} ${p === page ? 'border-sage-dark bg-sage-dark text-white' : idle}`}>{p}</button>
            )}
            <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} ${idle}`}>Next <Icon name="arrowRight" size={14} /></button>
        </nav>
    )
}

const Chefs = () => {
    const [params, setParams] = useSearchParams()
    const { city: preferredCity, setCity } = useCity()
    const [showFilters, setShowFilters] = useState(false)

    const filters = readFilters(params, preferredCity)
    const page = Math.max(1, Number(params.get('page')) || 1)
    const cityName = filters.city === ALL ? null : filters.city

    const query = {
        search: filters.search || undefined,
        city: cityName || undefined,
        cuisine: filters.cuisine || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        page,
        limit: PAGE_SIZE
    }

    const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
        queryKey: ['chefs', 'list', query],
        queryFn: async () => (await api.get('/chefs', { params: query })).data,
        placeholderData: keepPreviousData
    })

    const apply = (next, nextPage = 1) => {
        const p = new URLSearchParams()
        Object.entries(next).forEach(([k, v]) => { if (v) p.set(k, v) })
        if (nextPage > 1) p.set('page', nextPage)
        setParams(p)
        if (next.city && next.city !== ALL) setCity(next.city)
        setShowFilters(false)
    }

    const goToPage = (p) => {
        apply(filters, p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const clear = () => apply({ city: filters.city })

    const total = data?.pagination.total ?? 0
    const place = cityName || 'Pakistan'
    const activeCount = ['search', 'cuisine', 'minPrice', 'maxPrice'].filter((k) => filters[k]).length

    return (
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8 lg:pt-10">
            {/* Header */}
            <header>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-[12px] font-semibold text-sage-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Book 2 hours to 7 days ahead
                </span>
                <h1 className="mt-4 font-serif text-[40px] leading-tight tracking-tight sm:text-5xl">Home chefs in {place}</h1>
                <p className="mt-2 text-[14px] text-muted">
                    {isLoading ? 'Finding chefs…' : <><strong className="font-semibold text-ink">{total} verified {total === 1 ? 'chef' : 'chefs'}</strong> ready to bring authentic ghar ka zaiqa to your dastarkhwan</>}
                </p>
            </header>

            <div className="mt-8 grid gap-6 lg:grid-cols-[290px_1fr] lg:items-start">
                {/* Filters: sidebar on desktop, toggle on mobile */}
                <aside className="lg:sticky lg:top-24">
                    <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-[14px] font-bold lg:hidden">
                        <span className="flex items-center gap-2"><Icon name="filter" size={16} /> Filters {activeCount > 0 && <span className="rounded-full bg-sage-dark px-2 py-0.5 text-[11px] text-white">{activeCount}</span>}</span>
                        <Icon name="chevronDown" size={16} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`${showFilters ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
                        <FilterPanel applied={filters} onApply={(d) => apply(d)} onClear={clear} />
                    </div>
                </aside>

                {/* Results */}
                <section aria-live="polite">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-5 py-3.5 text-[13px] text-muted shadow-card">
                        <p>
                            Showing <strong className="font-semibold text-ink">{total} verified {total === 1 ? 'chef' : 'chefs'}</strong> in {place}
                            {filters.cuisine && <> · <span className="text-ink">{filters.cuisine}</span></>}
                            {filters.search && <> · “<span className="text-ink">{filters.search}</span>”</>}
                        </p>
                        {isFetching && !isLoading && <span className="flex items-center gap-1.5 text-[12px]"><span className="h-3 w-3 animate-spin rounded-full border-2 border-sage border-t-transparent" /> Updating</span>}
                    </div>

                    {isError ? (
                        <div className="mt-5 rounded-xl border border-line bg-white p-10 text-center shadow-card">
                            <p className="font-serif text-2xl">Couldn’t load chefs</p>
                            <p className="mt-2 text-sm text-muted">{errorMessage(error)}</p>
                            <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage">Try again</button>
                        </div>
                    ) : (
                        <>
                            <div className={`mt-5 grid gap-5 sm:grid-cols-2 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
                                {isLoading && Array.from({ length: 4 }, (_, i) => <ChefCardSkeleton key={i} />)}
                                <AnimatePresence mode="popLayout">
                                    {data?.chefs.map((chef, i) => (
                                        <motion.div key={chef.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}>
                                            <ChefCard chef={chef} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {data && data.chefs.length === 0 && (
                                <div className="mt-5 rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
                                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft text-rust"><Icon name="pot" size={28} /></span>
                                    <p className="mt-5 font-serif text-2xl">No chefs match these filters</p>
                                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                                        {activeCount ? 'Try another cuisine, a wider budget or a different name.' : `No approved chefs in ${place} yet. Try another city.`}
                                    </p>
                                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                                        {activeCount > 0 && <button type="button" onClick={clear} className="rounded-lg bg-sage-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage">Clear filters</button>}
                                        {cityName && <button type="button" onClick={() => apply({ ...filters, city: ALL })} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-sage/50">Search all cities</button>}
                                    </div>
                                </div>
                            )}

                            <Pagination page={page} totalPages={data?.pagination.totalPages ?? 0} onPage={goToPage} />
                        </>
                    )}
                </section>
            </div>

            {/* Trust banner */}
            <div className="mt-16 flex flex-col gap-5 rounded-xl border border-line bg-sand/60 p-6 sm:flex-row sm:items-center sm:p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage-dark"><Icon name="shield" size={24} /></span>
                <div className="flex-1">
                    <p className="font-serif text-[17px] font-medium">Ghar ka bharosa</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                        Every chef listed here has verified their phone number, signed the Chef Haazir contract and been approved by our team. Your booking, price and any issue are on record.
                    </p>
                </div>
                <Link to="/about#chef-contract" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold hover:border-sage/50">
                    <Icon name="checkCircle" size={15} className="text-sage" /> How we verify
                </Link>
            </div>
        </div>
    )
}

export default Chefs
