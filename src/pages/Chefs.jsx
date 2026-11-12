import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '../lib/api'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import ChefCard from '../components/ChefCard'
import { Underline } from '../components/Doodles'

const LIMIT = 9

const priceRanges = [
    { label: 'Any price', min: '', max: '' },
    { label: 'Under Rs 2,000', min: '', max: '1999' },
    { label: 'Rs 2,000 – 3,500', min: '2000', max: '3500' },
    { label: 'Above Rs 3,500', min: '3501', max: '' }
]

// The URL is the single source of truth for filters (shareable + back button works)
const Chefs = () => {
    const [params, setParams] = useSearchParams()
    const city = params.get('city') || ''
    const cuisine = params.get('cuisine') || ''
    const search = params.get('search') || ''
    const minPrice = params.get('minPrice') || ''
    const maxPrice = params.get('maxPrice') || ''
    const page = Number(params.get('page')) || 1

    // Typing updates local state; the URL updates 400ms after typing stops
    const [searchText, setSearchText] = useState(search)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText.trim() !== search) updateFilters({ search: searchText.trim() })
        }, 400)
        return () => clearTimeout(timer)
    }, [searchText])

    // Changing any filter resets to page 1 and drops empty values
    const updateFilters = (changes, keepPage = false) => {
        const next = new URLSearchParams(params)
        Object.entries(changes).forEach(([key, value]) => {
            if (value === '' || value === undefined) next.delete(key)
            else next.set(key, value)
        })
        if (!keepPage) next.delete('page')
        setParams(next)
    }

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ['chefs', { city, cuisine, search, minPrice, maxPrice, page }],
        queryFn: async () => {
            const query = { page, limit: LIMIT }
            if (city) query.city = city
            if (cuisine) query.cuisine = cuisine
            if (search) query.search = search
            if (minPrice) query.minPrice = minPrice
            if (maxPrice) query.maxPrice = maxPrice
            const res = await api.get('/chefs', { params: query })
            return res.data
        },
        placeholderData: keepPreviousData
    })

    const chefs = data?.chefs || []
    const pagination = data?.pagination
    const activePrice = priceRanges.findIndex((r) => r.min === minPrice && r.max === maxPrice)
    const hasFilters = city || cuisine || search || minPrice || maxPrice

    const clearAll = () => {
        setSearchText('')
        setParams(new URLSearchParams())
    }

    return (
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-8">
            {/* Header */}
            <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-dhania">Find a chef</p>
                <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                    Home chefs{' '}
                    <span className="relative inline-block">
                        {city ? `in ${city}` : 'across Pakistan'}
                        <Underline className="absolute -bottom-2 left-0 h-3 w-full" />
                    </span>
                </h1>
                <p className="mt-5 text-muted">Every chef is verified by our team. Pick one, choose a 2-hour slot, and they cook in your kitchen.</p>
            </div>

            {/* Filters */}
            <div className="mt-10 rounded-2xl border border-line bg-white p-4 shadow-[0_2px_12px_rgba(60,45,20,0.05)] md:p-5">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
                    <label className="flex items-center gap-3 rounded-xl bg-surface px-4">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                        <input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            maxLength={50}
                            placeholder="Search chef by name"
                            className="w-full bg-transparent py-3 outline-none placeholder:text-muted"
                            aria-label="Search chef by name"
                        />
                    </label>
                    <select value={city} onChange={(e) => updateFilters({ city: e.target.value })} className="cursor-pointer rounded-xl bg-surface px-4 py-3 font-medium outline-none" aria-label="City">
                        <option value="">All cities</option>
                        {cities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <select
                        value={activePrice === -1 ? 0 : activePrice}
                        onChange={(e) => { const r = priceRanges[e.target.value]; updateFilters({ minPrice: r.min, maxPrice: r.max }) }}
                        className="cursor-pointer rounded-xl bg-surface px-4 py-3 font-medium outline-none"
                        aria-label="Price per slot"
                    >
                        {priceRanges.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
                    </select>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {['', ...cuisines].map((c) => {
                        const active = cuisine === c
                        return (
                            <button
                                key={c || 'all'}
                                onClick={() => updateFilters({ cuisine: c })}
                                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-dhania bg-dhania text-cream' : 'border-line bg-cream hover:border-dhania hover:text-dhania'}`}
                            >
                                {c || 'All cuisines'}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Result count */}
            <div className="mt-8 flex min-h-6 items-center justify-between gap-4 text-sm text-muted">
                <p>
                    {pagination && !isError && (
                        <>
                            <span className="font-semibold text-ink">{pagination.total}</span> {pagination.total === 1 ? 'chef' : 'chefs'} found
                        </>
                    )}
                    {isFetching && !isPending && <span className="ml-2 text-dhania">updating…</span>}
                </p>
                {hasFilters && <button onClick={clearAll} className="font-semibold text-mirch hover:underline">Clear filters</button>}
            </div>

            {/* Results */}
            <div className="mt-4">
                {isPending ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
                        ))}
                    </div>
                ) : isError ? (
                    <EmptyState title="Couldn't load chefs" text="The server didn't respond. Check your connection and try again." />
                ) : chefs.length === 0 ? (
                    <EmptyState
                        title="No chefs match yet"
                        text={hasFilters ? 'Try another city, cuisine or price range.' : 'Chefs are joining soon. Check back in a few days.'}
                        action={hasFilters ? <button onClick={clearAll} className="mt-6 rounded-xl bg-dhania px-5 py-3 font-semibold text-cream hover:bg-dhania-dark">Clear filters</button> : null}
                    />
                ) : (
                    <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                            {chefs.map((chef, i) => (
                                <motion.div
                                    key={chef.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                >
                                    <ChefCard chef={chef} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                    <PageButton disabled={page <= 1} onClick={() => updateFilters({ page: page - 1 }, true)}>← Prev</PageButton>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                        <PageButton key={p} active={p === page} onClick={() => updateFilters({ page: p }, true)}>{p}</PageButton>
                    ))}
                    <PageButton disabled={page >= pagination.totalPages} onClick={() => updateFilters({ page: page + 1 }, true)}>Next →</PageButton>
                </nav>
            )}
        </div>
    )
}

const PageButton = ({ children, active, disabled, onClick }) => (
    <button
        onClick={() => { onClick(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        disabled={disabled}
        className={`min-w-10 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-dhania bg-dhania text-cream' : 'border-line bg-white hover:border-dhania hover:text-dhania'}`}
    >
        {children}
    </button>
)

const EmptyState = ({ title, text, action }) => (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-haldi-soft text-3xl" aria-hidden="true">🍳</span>
        <h2 className="mt-5 font-serif text-2xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-sm text-muted">{text}</p>
        {action}
    </div>
)

export default Chefs
