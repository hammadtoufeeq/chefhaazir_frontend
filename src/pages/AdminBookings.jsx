import { useMemo, useState } from 'react'

const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`
const displayDate = (value) => value ? new Date(`${value}T12:00:00+05:00`).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }) : 'Date not set'
const statusStyles = {
    pending: 'bg-amber-100 text-amber-900', confirmed: 'bg-sage-soft text-sage-dark', completed: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-stone-200 text-ink/75', rejected: 'bg-red-100 text-red-800', expired: 'bg-stone-200 text-stone-700', disputed: 'bg-orange-100 text-rust'
}
const filters = [['all', 'All bookings'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['disputed', 'Disputed'], ['cancelled', 'Cancelled']]

const AdminBookings = ({ bookings, pagination, status, setStatus, loading, error }) => {
    const [search, setSearch] = useState('')
    const rows = useMemo(() => {
        const query = search.trim().toLowerCase()
        return bookings.filter((booking) => !query || [booking._id, booking.customer?.name, booking.customer?.phone, booking.chef?.name, booking.chef?.phone, booking.address?.city, booking.note].join(' ').toLowerCase().includes(query))
    }, [bookings, search])
    const counts = bookings.reduce((acc, booking) => ({ ...acc, [booking.status]: (acc[booking.status] || 0) + 1 }), {})
    const inPageValue = bookings.reduce((sum, booking) => sum + Number(booking.totalFromCustomer || 0), 0)

    return <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rust">Operations · All Hubs</p><h2 className="mt-2 font-serif text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]">Booking Operations Ledger</h2><p className="mt-2 text-[12px] text-muted">Review customer and chef bookings, service details, and payment amounts.</p></div><div className="flex gap-2"><Summary label="Bookings in results" value={pagination?.total ?? bookings.length}/><Summary label="Order value in results" value={money(inPageValue)}/></div></div>
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3"><div className="flex gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1">{filters.map(([value, label]) => <button key={value} type="button" onClick={() => setStatus(value)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${status === value ? 'bg-white text-rust shadow-sm' : 'text-ink/70 hover:bg-white/60'}`}>{label}<span className="ml-1.5 text-[9px] opacity-70">{value === 'all' ? (pagination?.total ?? bookings.length) : counts[value] || 0}</span></button>)}</div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking ID, customer, chef, phone, or city" className="w-full rounded-lg border border-line px-3 py-2.5 text-[11px] outline-none focus:border-sage"/></div>
        {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-[11px] text-red-800">Could not load booking records: {error}</div> : loading ? <div className="rounded-xl bg-white p-10 text-center text-[12px] text-muted">Loading booking ledger…</div> : rows.length === 0 ? <div className="rounded-xl bg-white p-10 text-center text-[12px] text-muted">No bookings match these filters.</div> : <div className="space-y-3">{rows.map((booking) => <BookingCard key={booking._id} booking={booking}/>)}</div>}
        <p className="text-[10px] text-muted">Showing {rows.length} of {pagination?.total ?? bookings.length} matching bookings{pagination?.total > bookings.length ? ' · latest records first' : ''}.</p>
    </div>
}

function BookingCard({ booking }) {
    const status = booking.status || 'pending'
    return <article className={`rounded-xl border border-line border-l-4 bg-white p-4 shadow-card sm:p-5 ${status === 'disputed' ? 'border-l-rust' : status === 'completed' ? 'border-l-sage-dark' : status === 'cancelled' || status === 'rejected' ? 'border-l-stone-400' : 'border-l-[#d9b99d]'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-[18px] font-semibold">{booking.customer?.name || 'Customer'} <span className="font-normal text-muted">→</span> {booking.chef?.name || 'Chef'}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${statusStyles[status] || 'bg-stone-100 text-ink'}`}>{status}</span></div><p className="mt-1 text-[10px] text-muted">Booking #{String(booking._id).slice(-8).toUpperCase()} · {displayDate(booking.date)} · {booking.slot} · {booking.address?.city || 'City not set'}</p></div><div className="text-right"><p className="text-[9px] font-bold uppercase text-muted">Customer total</p><p className="font-serif text-[21px] font-semibold text-rust">{money(booking.totalFromCustomer)}</p></div></div>
        <div className="mt-4 grid gap-2 rounded-lg bg-[#f5f2ee] p-3 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase text-muted">Customer</p><p className="mt-1 text-[11px] font-semibold">{booking.customer?.name || 'Customer'}</p><p className="text-[9px] text-muted">{booking.customer?.phone || booking.customer?.email || 'Contact unavailable'}</p></div><div><p className="text-[9px] font-bold uppercase text-muted">Chef</p><p className="mt-1 text-[11px] font-semibold">{booking.chef?.name || 'Chef'}</p><p className="text-[9px] text-muted">{booking.chef?.phone || booking.chef?.email || 'Contact unavailable'}</p></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[10px] sm:flex sm:gap-5"><span className="text-muted">Chef fee <strong className="text-ink">{money(booking.chefRate)}</strong></span><span className="text-muted">Commission <strong className="text-ink">{money(booking.commissionAmount)}</strong></span>{Number(booking.grocerySubtotal) > 0 && <span className="text-muted">Groceries <strong className="text-ink">{money(booking.grocerySubtotal)}</strong></span>}</div><span className="text-[9px] text-muted">Created {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
        {booking.note && <div className="mt-3 rounded-lg border border-line px-3 py-2.5"><p className="text-[9px] font-bold uppercase text-muted">Customer cooking request</p><p className="mt-1 text-[11px] leading-relaxed">{booking.note}</p></div>}
        {booking.cancelReason && <p className="mt-2 text-[10px] text-rust">Cancellation reason: {booking.cancelReason}</p>}
    </article>
}

function Summary({ label, value }) { return <div className="rounded-lg border border-line bg-white px-3 py-2"><p className="text-[9px] font-bold uppercase text-muted">{label}</p><p className="mt-1 font-serif text-[17px] font-semibold">{value}</p></div> }

export default AdminBookings
