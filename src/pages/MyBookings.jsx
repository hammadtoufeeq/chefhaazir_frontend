import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { images } from '../constants/images'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZE = 10
const CLOSED_STATUSES = ['cancelled', 'rejected', 'expired', 'disputed']
const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
    { id: 'closed', label: 'Cancelled / Other' }
]

const statusInfo = {
    pending: { label: 'Waiting for chef', color: 'border-amber-200 bg-amber-50 text-amber-800', icon: 'clock' },
    confirmed: { label: 'Confirmed', color: 'border-sage/20 bg-sage-soft text-sage-dark', icon: 'checkCircle' },
    completed: { label: 'Completed', color: 'border-sage/20 bg-sage-soft text-sage-dark', icon: 'checkCircle' },
    cancelled: { label: 'Cancelled', color: 'border-line bg-stone-100 text-muted', icon: 'xCircle' },
    rejected: { label: 'Request declined', color: 'border-rust/15 bg-rust-soft text-rust', icon: 'xCircle' },
    expired: { label: 'Request expired', color: 'border-line bg-stone-100 text-muted', icon: 'clock' },
    disputed: { label: 'Under review', color: 'border-orange-200 bg-orange-50 text-orange-800', icon: 'question' }
}

const money = (amount = 0) => `Rs. ${Number(amount).toLocaleString('en-PK')}`
const dateLabel = (value) => {
    if (!value) return 'Date to be confirmed'
    const date = new Date(`${value}T12:00:00+05:00`)
    return new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(date)
}
const slotLabel = (slot) => String(slot || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const canCancel = (booking) => ['pending', 'confirmed'].includes(booking.status) && booking.slotStart && new Date(booking.slotStart).getTime() - Date.now() >= 90 * 60 * 1000

const loadBookings = async ({ filter, page }) => {
    if (filter !== 'closed') {
        const { data } = await api.get('/bookings/mine', { params: { ...(filter !== 'all' ? { status: filter } : {}), page, limit: PAGE_SIZE } })
        return data
    }

    const responses = await Promise.all(CLOSED_STATUSES.map((status) => api.get('/bookings/mine', { params: { status, page: 1, limit: 50 } })))
    const bookings = responses.flatMap((response) => response.data.bookings)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const start = (page - 1) * PAGE_SIZE
    return {
        bookings: bookings.slice(start, start + PAGE_SIZE),
        pagination: { page, limit: PAGE_SIZE, total: bookings.length, totalPages: Math.ceil(bookings.length / PAGE_SIZE) }
    }
}

const Stat = ({ label, value, tone }) => (
    <div className="flex min-w-0 items-center gap-2 border-b border-line px-3 py-2.5 sm:border-b-0 sm:border-r sm:last:border-r-0">
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />
        <span className="truncate text-[12px] text-ink/80"><strong className="font-bold text-ink">{value}</strong> {label}</span>
    </div>
)

const BookingCard = ({ booking, onCancel, onDetails, cancelling }) => {
    const info = statusInfo[booking.status] || statusInfo.pending
    const name = booking.chef?.name || 'Chef'
    const meals = [booking.note, ...(booking.groceryItems || []).map((item) => `${item.name} × ${item.quantity}`)].filter(Boolean)
    const cancellationAllowed = canCancel(booking)

    return (
        <article className={`overflow-hidden rounded-xl border border-line border-t-[3px] bg-white shadow-card ${booking.status === 'confirmed' ? 'border-t-sage' : booking.status === 'disputed' ? 'border-t-orange-700' : 'border-t-transparent'}`}>
            <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-6 sm:p-5">
                <div className="flex min-w-0 gap-3.5">
                    <img src={images.rotiThali} alt="Home cooked meal" className="h-[68px] w-[68px] shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-serif text-[20px] font-semibold leading-tight">{name}</h2>
                            <span className="rounded bg-sage-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sage-dark">Chef Haazir</span>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-ink/75">
                            <Icon name="calendar" size={13} className="text-rust" />
                            {dateLabel(booking.date)} <span>·</span> {slotLabel(booking.slot)} <span>·</span> {booking.address?.city}
                        </p>
                        {meals.length > 0 ? (
                            <p className="mt-2 line-clamp-2 rounded-md bg-stone-50 px-2.5 py-2 text-[12px] text-ink/80">{meals.join(' · ')}</p>
                        ) : (
                            <p className="mt-2 text-[12px] text-muted">Home cooking appointment</p>
                        )}
                        {booking.grocerySubtotal > 0 && <p className="mt-1.5 text-[11px] text-muted">Groceries {money(booking.grocerySubtotal)}{booking.deliveryFee ? ` · Delivery ${money(booking.deliveryFee)}` : ''}</p>}
                    </div>
                </div>

                <div className="flex flex-row items-end justify-between gap-3 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${info.color}`}>
                        <Icon name={info.icon} size={12} />{info.label}
                    </span>
                    <div className="text-right">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Total</p>
                        <p className="font-serif text-[23px] font-semibold leading-none">{money(booking.totalFromCustomer)}</p>
                        <p className="mt-1 text-[10px] text-muted">Cash after service</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <button type="button" onClick={() => onDetails(booking._id)} className="rounded-md border border-line px-3 py-1.5 text-[11px] font-semibold transition hover:border-sage/50">Details</button>
                        {cancellationAllowed && <button type="button" disabled={cancelling} onClick={() => onCancel(booking)} className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-rust transition hover:bg-rust-soft disabled:opacity-50">{cancelling ? 'Cancelling…' : 'Cancel booking'}</button>}
                    </div>
                </div>
            </div>
            {booking.cancelReason && <p className="border-t border-line bg-stone-50 px-5 py-2.5 text-[11px] text-muted">Update: {booking.cancelReason}</p>}
        </article>
    )
}

const BookingDetails = ({ id, onClose }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['booking-detail', id],
        queryFn: async () => (await api.get(`/bookings/${id}`)).data.booking,
        enabled: !!id,
        refetchInterval: filter === 'closed' ? 15_000 : 5_000,
        refetchOnWindowFocus: true
    })
    const chef = data?.chef
    const phone = chef?.phone?.replace(/[^\d+]/g, '')

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section role="dialog" aria-modal="true" aria-labelledby="booking-details-title" className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div><p className="eyebrow">Your appointment</p><h2 id="booking-details-title" className="mt-1 font-serif text-2xl">Booking details</h2></div>
                    <button type="button" onClick={onClose} aria-label="Close details" className="rounded-full p-2 text-muted hover:bg-stone-100"><Icon name="close" /></button>
                </div>
                {isLoading ? <p className="py-10 text-center text-sm text-muted">Loading booking details…</p> : isError ? <p className="py-8 text-sm text-rust">We could not load this booking. Please close and try again.</p> : data && (
                    <div className="mt-5 space-y-4 text-sm">
                        <div className="rounded-lg bg-stone-50 p-4">
                            <p className="font-semibold">{chef?.name || 'Your chef'}</p>
                            <p className="mt-1 text-muted">{dateLabel(data.date)} · {slotLabel(data.slot)} · {data.address?.city}</p>
                            <p className="mt-1 text-muted">{data.address?.street}</p>
                        </div>
                        {data.note && <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Your note</p><p className="mt-1">{data.note}</p></div>}
                        {(data.groceryItems || []).length > 0 && <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Groceries</p><ul className="mt-1 space-y-1">{data.groceryItems.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4"><span>{item.name} × {item.quantity}</span><span>{money(item.lineTotal)}</span></li>)}</ul></div>}
                        <div className="flex justify-between border-t border-line pt-3 font-semibold"><span>Total due in cash</span><span>{money(data.totalFromCustomer)}</span></div>
                        {phone && ['confirmed', 'completed', 'disputed'].includes(data.status) && <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-sage px-4 py-3 font-semibold text-white hover:bg-sage-dark"><Icon name="chat" size={16} /> Message chef on WhatsApp</a>}
                    </div>
                )}
            </section>
        </div>
    )
}

const MyBookings = () => {
    const { user, isLoading: authLoading } = useAuth()
    const location = useLocation()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [detailId, setDetailId] = useState(null)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [notice, setNotice] = useState(location.state?.bookingNotice || '')

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['my-bookings', filter, page],
        queryFn: () => loadBookings({ filter, page }),
        enabled: user?.role === 'user',
        placeholderData: (previous) => previous,
        refetchInterval: 5_000,
        refetchOnWindowFocus: true
    })
    const pendingCount = useQuery({
        queryKey: ['my-bookings-count', 'pending'],
        queryFn: async () => (await api.get('/bookings/mine', { params: { status: 'pending', limit: 1 } })).data.pagination.total,
        enabled: user?.role === 'user',
        refetchInterval: 10_000,
        refetchOnWindowFocus: true
    })
    const confirmedCount = useQuery({
        queryKey: ['my-bookings-count', 'confirmed'],
        queryFn: async () => (await api.get('/bookings/mine', { params: { status: 'confirmed', limit: 1 } })).data.pagination.total,
        enabled: user?.role === 'user',
        refetchInterval: 10_000,
        refetchOnWindowFocus: true
    })
    const cancelMutation = useMutation({
        mutationFn: ({ id }) => api.patch(`/bookings/${id}/cancel`, {}),
        onSuccess: () => {
            setNotice('Your booking was cancelled.')
            setCancelTarget(null)
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
            queryClient.invalidateQueries({ queryKey: ['my-bookings-count'] })
            queryClient.invalidateQueries({ queryKey: ['pending-count'] })
        },
        onError: (cancelError) => { setNotice(errorMessage(cancelError)); setCancelTarget(null) }
    })

    const bookings = data?.bookings || []
    const visibleBookings = useMemo(() => {
        const query = search.trim().toLocaleLowerCase()
        if (!query) return bookings
        return bookings.filter((booking) => [booking.chef?.name, booking.note, booking.address?.city, booking.address?.street, ...(booking.groceryItems || []).map((item) => item.name)].filter(Boolean).join(' ').toLocaleLowerCase().includes(query))
    }, [bookings, search])

    const changeFilter = (next) => { setFilter(next); setPage(1); setNotice('') }
    const cancelBooking = (booking) => setCancelTarget(booking)

    if (authLoading) return <div className="mx-auto min-h-[50vh] max-w-7xl px-4 py-20"><div className="h-8 w-52 animate-pulse rounded bg-stone-100" /></div>
    if (!user) return (
        <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft text-sage"><Icon name="calendar" size={26} /></span>
            <h1 className="mt-5 font-serif text-4xl">Your bookings</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">Log in to review appointments, check chef responses, or manage a booking.</p>
            <Link to="/login?next=%2Fmy-bookings" className="mt-7 rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark">Log in to continue</Link>
        </main>
    )
    if (user.role !== 'user') return (
        <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
            <h1 className="font-serif text-3xl">Customer bookings</h1>
            <p className="mt-3 text-sm text-muted">This page is for customer accounts. Open your dashboard to manage your account.</p>
            <Link to="/" className="mt-6 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white">Back to home</Link>
        </main>
    )

    const totalPages = data?.pagination?.totalPages || 1

    return (
        <>
            <main className="mx-auto max-w-7xl px-4 pb-16 pt-7 md:px-8">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-muted"><Link to="/" className="hover:text-rust">Home</Link><span>›</span><span>Customer account</span><span>›</span><span className="font-semibold text-ink">Bookings</span></nav>
                <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div><p className="eyebrow">Private dining at home</p><h1 className="mt-1 font-serif text-[36px] font-semibold leading-tight tracking-tight sm:text-[42px]">My Bookings</h1><p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">Track and manage your home chef appointments and grocery orders.</p></div>
                    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-white sm:min-w-[290px] sm:grid-cols-2">
                        <Stat label="Confirmed" value={confirmedCount.data ?? '—'} tone="bg-sage" />
                        <Stat label="Pending" value={pendingCount.data ?? '—'} tone="bg-amber-600" />
                    </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter bookings">
                        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={filter === tab.id} onClick={() => changeFilter(tab.id)} className={`shrink-0 rounded-md border px-3 py-2 text-[11px] font-semibold transition ${filter === tab.id ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white text-ink/75 hover:border-sage/50'}`}>{tab.label}{filter === tab.id && data?.pagination?.total != null ? ` (${data.pagination.total})` : ''}</button>)}
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-muted focus-within:border-sage lg:w-[300px]">
                        <Icon name="search" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chef, dish, or area…" className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/80" /><span className="sr-only">Search bookings</span>
                    </label>
                </div>

                {notice && <div role="status" className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-sage/20 bg-sage-soft px-4 py-3 text-[13px] text-sage-dark"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><Icon name="close" size={15} /></button></div>}
                {isLoading ? <div className="mt-8 space-y-4">{[0, 1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-xl bg-stone-100" />)}</div>
                    : isError ? <div className="mt-8 rounded-xl border border-line bg-white px-5 py-12 text-center"><p className="font-semibold">We couldn’t load your bookings.</p><p className="mt-2 text-sm text-muted">{errorMessage(error)}</p><button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white">Try again</button></div>
                        : visibleBookings.length ? <div className="mt-7 space-y-4">{visibleBookings.map((booking) => <BookingCard key={booking._id} booking={booking} onCancel={cancelBooking} onDetails={setDetailId} cancelling={cancelMutation.isPending && cancelMutation.variables?.id === booking._id} />)}</div>
                            : <div className="mt-8 rounded-xl border border-line bg-white px-5 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-muted"><Icon name="calendar" size={22} /></span><h2 className="mt-4 font-serif text-2xl">{search ? 'No matching bookings' : filter === 'all' ? 'No bookings yet' : 'Nothing in this category'}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">{search ? 'Try another chef name, dish, or area.' : 'When you book a home chef, you’ll find the appointment and its updates here.'}</p>{filter === 'all' && !search && <Link to="/chefs" className="mt-5 inline-flex rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Find a chef</Link>}</div>}

                {!isLoading && !isError && visibleBookings.length > 0 && <div className="mt-8 flex flex-col items-center justify-between gap-4 text-[11px] text-muted sm:flex-row"><p>Showing {data?.pagination?.total ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, data?.pagination?.total || 0)} of {data?.pagination?.total || 0} bookings</p><Pagination page={page} totalPages={totalPages} onPage={setPage} className="justify-center sm:mt-0" /></div>}
            </main>
            {detailId && <BookingDetails id={detailId} onClose={() => setDetailId(null)} />}
            <ConfirmDialog
                open={!!cancelTarget}
                title="Cancel this booking?"
                description={`Cancel your booking with ${cancelTarget?.chef?.name || 'your chef'}? You can cancel up to 90 minutes before the visit starts.`}
                confirmLabel="Yes, cancel booking"
                tone="danger"
                busy={cancelMutation.isPending}
                onCancel={() => setCancelTarget(null)}
                onConfirm={() => cancelTarget && cancelMutation.mutate({ id: cancelTarget._id })}
            />
        </>
    )
}

export default MyBookings
