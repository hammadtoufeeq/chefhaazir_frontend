import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const money = (amount = 0) => `Rs. ${Number(amount).toLocaleString('en-PK')}`
const dateLabel = (value) => value
    ? new Intl.DateTimeFormat('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' }).format(new Date(`${value}T12:00:00+05:00`))
    : 'Date to be confirmed'
const slotLabel = (slot = '') => slot.split('-').map((hour) => {
    const number = Number(hour)
    return `${number % 12 || 12}:00 ${number >= 12 ? 'PM' : 'AM'}`
}).join(' – ')
const whatsappNumber = (phone = '') => {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('0')) return `92${digits.slice(1)}`
    if (digits.startsWith('92')) return digits
    return digits
}
const statusStyles = {
    pending: 'bg-amber-50 text-amber-800',
    confirmed: 'bg-sage-soft text-sage-dark',
    completed: 'bg-sage-soft text-sage-dark',
    cancelled: 'bg-stone-100 text-muted',
    rejected: 'bg-rust-soft text-rust',
    expired: 'bg-stone-100 text-muted',
    disputed: 'bg-orange-50 text-orange-800'
}
const statusText = {
    pending: 'Waiting for chef', confirmed: 'Confirmed', completed: 'Completed',
    cancelled: 'Cancelled', rejected: 'Request declined', expired: 'Request expired', disputed: 'Under review'
}

const BookingDetailsPage = () => {
    const { bookingId } = useParams()
    const { user, isLoading: authLoading } = useAuth()
    const query = useQuery({
        queryKey: ['booking-detail', bookingId],
        queryFn: async () => (await api.get(`/bookings/${bookingId}`)).data.booking,
        enabled: user?.role === 'user' && !!bookingId,
        refetchInterval: 5_000,
        refetchOnWindowFocus: true
    })

    if (authLoading) return <div className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12"><div className="h-64 animate-pulse rounded-xl bg-stone-100"/></div>
    if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/my-bookings/${bookingId}`)}`} replace/>
    if (user.role !== 'user') return <Navigate to={user.role === 'chef' ? '/chef/bookings' : '/'} replace/>

    const booking = query.data
    const chefPhone = whatsappNumber(booking?.chef?.phone || '')
    return <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to="/my-bookings" className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-rust"><Icon name="arrowLeft" size={15}/> Back to My Bookings</Link>
        {query.isLoading ? <div className="mt-6 h-80 animate-pulse rounded-xl bg-stone-100"/> : query.isError ? <section className="mt-6 rounded-xl border border-line bg-white p-8 text-center"><h1 className="font-serif text-2xl">Booking details unavailable</h1><p className="mt-2 text-sm text-muted">{errorMessage(query.error)}</p><button type="button" onClick={() => query.refetch()} className="mt-4 rounded-lg bg-sage-dark px-4 py-2.5 text-[12px] font-bold text-white">Try again</button></section> : booking && <>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Appointment details</p><h1 className="mt-1 font-serif text-[34px] font-semibold sm:text-[40px]">Your booking</h1><p className="mt-1 text-[12px] text-muted">Booking reference · {booking._id}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold ${statusStyles[booking.status] || 'bg-stone-100 text-muted'}`}><span className="h-2 w-2 rounded-full bg-current"/>{statusText[booking.status] || booking.status}</span></div>
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
                <section className="space-y-5 rounded-xl border border-line bg-white p-5 shadow-card sm:p-7">
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Chef</p><h2 className="mt-1 font-serif text-[25px] font-semibold">{booking.chef?.name || 'Chef Haazir chef'}</h2>{booking.chef?.phone && <p className="mt-1 text-[12px] text-muted">{booking.chef.phone}</p>}</div>
                    <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-stone-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Date</p><p className="mt-1 text-[13px] font-semibold">{dateLabel(booking.date)}</p></div><div className="rounded-lg bg-stone-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Time</p><p className="mt-1 text-[13px] font-semibold">{slotLabel(booking.slot)}</p></div></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Service address</p><p className="mt-1 text-[13px] leading-relaxed">{booking.address?.street}, {booking.address?.city}</p></div>
                    {booking.note && <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">What you asked the chef to cook</p><p className="mt-1 rounded-lg bg-stone-50 p-4 text-[13px] leading-relaxed">{booking.note}</p></div>}
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Groceries</p>{booking.groceryItems?.length ? <ul className="mt-2 divide-y divide-line rounded-lg border border-line px-4">{booking.groceryItems.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4 py-3 text-[12px]"><span>{item.name} × {item.quantity} {item.unit}</span><span className="font-semibold">{money(item.lineTotal)}</span></li>)}</ul> : <p className="mt-1 text-[12px] text-muted">No groceries added to this booking.</p>}</div>
                    {chefPhone && ['confirmed', 'completed', 'disputed'].includes(booking.status) && <a href={`https://wa.me/${chefPhone}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-4 py-3 text-[12px] font-bold text-white hover:bg-sage"><Icon name="chat" size={15}/> Message chef on WhatsApp</a>}
                </section>
                <aside className="h-fit rounded-xl border border-line bg-white p-5 shadow-card"><h2 className="font-serif text-[21px] font-semibold">Price summary</h2><div className="mt-4 space-y-3 text-[12px]"><div className="flex justify-between gap-3"><span className="text-muted">Chef fee</span><span>{money(booking.chefRate)}</span></div>{booking.grocerySubtotal > 0 && <div className="flex justify-between gap-3"><span className="text-muted">Groceries</span><span>{money(booking.grocerySubtotal)}</span></div>}{booking.deliveryFee > 0 && <div className="flex justify-between gap-3"><span className="text-muted">Delivery</span><span>{money(booking.deliveryFee)}</span></div>}<div className="flex justify-between border-t border-line pt-3 text-[14px] font-bold"><span>Total</span><span className="text-rust">{money(booking.totalFromCustomer)}</span></div><p className="text-[10px] leading-relaxed text-muted">Pay the chef in cash after the service.</p></div><p className="mt-5 rounded-lg bg-sage-soft/60 p-3 text-[11px] leading-relaxed text-sage-dark">Booking status refreshes automatically while this page is open.</p></aside>
            </div>
        </>}
    </main>
}

export default BookingDetailsPage
