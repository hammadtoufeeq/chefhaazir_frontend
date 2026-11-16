import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { chefPhoto } from '../constants/images'
import { todayInPakistan, addDays, dateParts, slotLabel } from '../lib/time'
import { groceryCategories, categoryStyle } from '../constants/grocery'
import { hasPendingSlotRequest } from '../lib/bookings'
import Icon from '../components/Icon'
import SafeImage from '../components/SafeImage'

const DELIVERY_FEE = 150
const FREE_DELIVERY_FROM = 500
const slotMood = { '08-10': 'Breakfast', '10-12': 'Brunch', '12-14': 'Lunch', '14-16': 'Afternoon', '16-18': 'Evening', '18-20': 'Dinner', '20-22': 'Late dinner' }
const money = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-PK')}`
const validDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= todayInPakistan() && date <= addDays(todayInPakistan(), 7)

const BookingRequest = () => {
    const { chefId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user, isLoading: authLoading } = useAuth()
    const initialDate = validDate(searchParams.get('date')) ? searchParams.get('date') : todayInPakistan()
    const [date, setDate] = useState(initialDate)
    const [selectedSlot, setSelectedSlot] = useState(searchParams.get('slot') || '')
    const [step, setStep] = useState(1)
    const [note, setNote] = useState('')
    const [noteTouched, setNoteTouched] = useState(false)
    const [street, setStreet] = useState(user?.address || '')
    const [category, setCategory] = useState('All items')
    const [search, setSearch] = useState('')
    const [quantities, setQuantities] = useState({})

    useEffect(() => {
        if (user?.address && !street) setStreet(user.address)
    }, [user?.address, street])

    const chefQuery = useQuery({
        queryKey: ['chef', chefId],
        queryFn: async () => (await api.get(`/chefs/${chefId}`)).data.chef,
        enabled: !!chefId,
        retry: (count, error) => ![400, 404].includes(error?.response?.status) && count < 2
    })
    const chef = chefQuery.data

    const availability = useQuery({
        queryKey: ['availability', chefId, date],
        queryFn: async () => (await api.get(`/chefs/${chefId}/availability`, { params: { date } })).data.slots,
        enabled: !!chefId && !!date,
        refetchInterval: 60_000
    })

    const pendingRequests = useQuery({
        queryKey: ['customer-pending-bookings', user?.id],
        queryFn: async () => (await api.get('/bookings/mine', { params: { status: 'pending', page: 1, limit: 50 } })).data.bookings,
        enabled: user?.role === 'user',
        refetchInterval: 30_000
    })

    const groceryQuery = useQuery({
        queryKey: ['booking-groceries', chef?.city],
        queryFn: async () => (await api.get('/grocery/items', { params: { city: chef.city, page: 1, limit: 50 } })).data,
        enabled: step === 2 && !!chef?.city
    })

    const bookMutation = useMutation({
        mutationFn: async (body) => (await api.post('/bookings', body)).data,
        onSuccess: (data) => navigate('/my-bookings', { replace: true, state: { bookingNotice: data.message || 'Your request was sent to the chef.' } })
    })

    const dates = useMemo(() => Array.from({ length: 8 }, (_, index) => addDays(todayInPakistan(), index)), [])
    const items = groceryQuery.data?.items || []
    const visibleItems = useMemo(() => {
        const term = search.trim().toLocaleLowerCase()
        return items.filter((item) => (category === 'All items' || item.category === category) && (!term || `${item.name} ${item.category}`.toLocaleLowerCase().includes(term)))
    }, [items, category, search])
    const selectedItems = items.filter((item) => quantities[item._id] > 0)
    const grocerySubtotal = selectedItems.reduce((sum, item) => sum + item.price * quantities[item._id], 0)
    const estimatedDelivery = grocerySubtotal > 0 && grocerySubtotal < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0
    const estimatedTotal = (chef?.ratePerSlot || 0) + grocerySubtotal + estimatedDelivery
    const pendingForSelectedSlot = hasPendingSlotRequest(pendingRequests.data, chefId, date, selectedSlot)
    const checkingPending = user?.role === 'user' && (pendingRequests.isFetching || pendingRequests.isError)
    const currentSlot = !checkingPending && !pendingForSelectedSlot && availability.data?.find((item) => item.slot === selectedSlot && item.status === 'available')
    const isDifferentCity = !!user?.city && !!chef?.city && user.city !== chef.city
    const noteValid = note.trim().length >= 10

    const changeQuantity = (id, value) => setQuantities((current) => {
        const next = { ...current }
        const qty = Math.max(0, Math.min(50, value))
        if (qty === 0) delete next[id]
        else next[id] = qty
        return next
    })

    const submitRequest = (event) => {
        event.preventDefault()
        if (!chef || !currentSlot || !street.trim() || !noteValid) return
        bookMutation.mutate({
            chefId,
            date,
            slot: selectedSlot,
            note: note.trim(),
            street: street.trim(),
            groceryItems: selectedItems.map((item) => ({ itemId: item._id, quantity: quantities[item._id] }))
        })
    }

    if (authLoading) return <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-16"><div className="h-8 w-64 animate-pulse rounded bg-stone-100" /></main>
    if (!user) return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft text-sage"><Icon name="chef" size={26} /></span><h1 className="mt-5 font-serif text-3xl">Log in to book this chef</h1><p className="mt-3 text-sm text-muted">Your selected chef and appointment will be waiting after you sign in.</p><Link to={`/login?next=${encodeURIComponent(`/book/${chefId}?${searchParams.toString()}`)}`} className="mt-6 rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-white">Log in to continue</Link></main>
    if (user.role !== 'user') return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center"><h1 className="font-serif text-3xl">Customer account required</h1><p className="mt-3 text-sm text-muted">Only customer accounts can send booking requests.</p><Link to="/" className="mt-6 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white">Back to home</Link></main>

    if (chefQuery.isLoading) return <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-16"><div className="h-8 w-64 animate-pulse rounded bg-stone-100" /><div className="mt-6 h-72 animate-pulse rounded-2xl bg-stone-100" /></main>
    if (chefQuery.isError || !chef) return <main className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center"><h1 className="font-serif text-3xl">Chef unavailable</h1><p className="mt-3 text-sm text-muted">{errorMessage(chefQuery.error)}</p><Link to="/chefs" className="mt-6 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white">Browse chefs</Link></main>

    return (
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-muted"><Link to="/" className="hover:text-rust">Home</Link><span>›</span><Link to={`/chefs/${chefId}`} className="hover:text-rust">{chef.name}</Link><span>›</span><span className="font-semibold text-ink">Booking request</span></nav>
            <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
                <section className="min-w-0">
                    <p className="eyebrow">Book a home chef</p>
                    <h1 className="mt-1 font-serif text-[34px] font-semibold tracking-tight sm:text-[40px]">Plan your visit</h1>
                    <p className="mt-1 text-[13px] text-muted">Choose your appointment, then add groceries for the chef to bring along.</p>

                    <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-2">
                        {[['1', 'Appointment'], ['2', 'Choose groceries']].map(([id, label]) => <div key={id} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold ${step === Number(id) ? 'bg-white text-sage-dark shadow-sm' : 'text-muted'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === Number(id) ? 'bg-sage-dark text-white' : 'bg-stone-200'}`}>{step > Number(id) ? <Icon name="check" size={14} /> : id}</span>{label}</div>)}
                    </div>

                    {step === 1 ? (
                        <form onSubmit={(event) => { event.preventDefault(); setStep(2) }} className="mt-5 space-y-5 rounded-xl border border-line bg-white p-4 shadow-card sm:p-6">
                            <div className="flex items-center gap-3 border-b border-line pb-4"><SafeImage src={chefPhoto(chef)} alt={`${chef.cuisines?.[0] || 'Home cooked'} meal`} className="h-14 w-14 rounded-lg" /><div><p className="font-serif text-[20px] font-semibold">{chef.name}</p><p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted"><Icon name="pin" size={13} /> {chef.city} · {chef.cuisines?.join(', ')}</p></div></div>
                            <div>
                                <div className="flex items-baseline justify-between"><label className="text-[13px] font-bold">Choose a date</label><span className="text-[11px] text-muted">Within the next 7 days</span></div>
                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{dates.map((value, index) => { const parts = dateParts(value); const active = date === value; return <button key={value} type="button" onClick={() => { setDate(value); setSelectedSlot('') }} className={`flex w-[58px] shrink-0 flex-col items-center rounded-lg border py-2 ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line hover:border-sage/50'}`}><span className={`text-[9px] font-bold uppercase ${active ? 'text-white/75' : 'text-muted'}`}>{index === 0 ? 'Today' : parts.day}</span><span className="font-serif text-[19px] font-semibold">{parts.date}</span><span className={`text-[9px] ${active ? 'text-white/75' : 'text-muted'}`}>{parts.month}</span></button> })}</div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between"><p className="text-[13px] font-bold">Choose a 2-hour slot</p>{availability.isLoading && <span className="text-[11px] text-muted">Checking availability…</span>}</div>
                                {user?.role === 'user' && pendingRequests.isError && <p className="mt-3 rounded-lg bg-rust-soft p-3 text-[12px] text-rust">We couldn’t check your pending requests, so booking is paused. <button type="button" onClick={() => pendingRequests.refetch()} className="font-bold underline">Try again</button></p>}
                                {availability.isError ? <p className="mt-3 rounded-lg bg-rust-soft p-3 text-[12px] text-rust">{errorMessage(availability.error)} <button type="button" onClick={() => availability.refetch()} className="font-bold underline">Retry</button></p> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{availability.isLoading ? Array.from({ length: 7 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-stone-100" />) : availability.data?.map((item) => { const pending = hasPendingSlotRequest(pendingRequests.data, chefId, date, item.slot); const isAvailable = item.status === 'available' && !pending && !checkingPending; const active = selectedSlot === item.slot && isAvailable; const label = pending ? 'Your request is pending' : checkingPending ? 'Checking your requests…' : { booked: 'Already booked', chef_unavailable: 'Chef unavailable', too_late: 'Too soon', too_far: 'Too far' }[item.status]; return <button key={item.slot} type="button" disabled={!isAvailable} onClick={() => setSelectedSlot(item.slot)} className={`rounded-lg border px-3 py-2.5 text-left ${active ? 'border-sage-dark bg-sage-dark text-white' : pending ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900' : isAvailable ? 'border-line hover:border-sage/60' : 'cursor-not-allowed border-transparent bg-stone-50 text-muted/60'}`}><span className="block text-[13px] font-bold">{slotLabel(item.slot)}</span><span className={`block text-[10px] ${active ? 'text-white/75' : pending ? 'text-amber-800' : 'text-muted'}`}>{label || slotMood[item.slot]}</span></button> })}</div>}
                                {pendingForSelectedSlot && <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900"><Icon name="clock" size={15} className="mt-0.5 shrink-0"/><span>You already have a pending request for this chef and time. <Link to="/my-bookings" className="font-bold underline">View your request</Link></span></div>}
                            </div>
                            <div><label htmlFor="booking-note" className="text-[13px] font-bold">What would you like the chef to cook? <span className="font-bold text-rust">(required)</span></label><textarea id="booking-note" required minLength={10} rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} onBlur={() => setNoteTouched(true)} placeholder="Describe the dishes you expect, servings, and any preferences…" className={`mt-2 w-full resize-y rounded-lg border px-3.5 py-3 text-[13px] outline-none focus:ring-2 focus:ring-sage/15 ${noteTouched && !noteValid ? 'border-rust/60 focus:border-rust' : 'border-line focus:border-sage'}`}/><p className="mt-1 flex justify-between gap-2 text-[10px]"><span className={noteTouched && !noteValid ? 'text-rust' : 'text-muted'}>{noteValid ? 'Your chef will see this menu request.' : 'Describe your expected dishes (at least 10 characters).'}</span><span className="shrink-0 text-muted">{note.length}/500</span></p></div>
                            <div><label htmlFor="booking-address" className="text-[13px] font-bold">Service address in {chef.city}</label>{isDifferentCity && <p className="mt-1 text-[11px] text-muted">This chef serves {chef.city}. Please enter an address in that city.</p>}<textarea id="booking-address" required minLength={10} maxLength={200} rows={2} value={street} onChange={(event) => setStreet(event.target.value)} placeholder="House, street, area, and nearby landmark" className="mt-2 w-full resize-y rounded-lg border border-line px-3.5 py-3 text-[13px] outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/></div>
                            <button type="submit" disabled={!currentSlot || !street.trim() || !noteValid || availability.isLoading || checkingPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-3.5 text-[14px] font-bold text-white transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-45">Continue to groceries <Icon name="arrowRight" size={16} /></button>
                        </form>
                    ) : (
                        <form onSubmit={submitRequest} className="mt-5 rounded-xl border border-line bg-white p-4 shadow-card sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-[25px] font-semibold">Add groceries</h2><p className="mt-1 text-[12px] text-muted">Choose ingredients from the approved store in {chef.city}; the chef will bring them to your home.</p></div><button type="button" onClick={() => setStep(1)} className="rounded-md border border-line px-3 py-2 text-[11px] font-semibold hover:border-sage/50"><Icon name="arrowLeft" size={13} className="mr-1 inline" /> Edit appointment</button></div>
                            {pendingForSelectedSlot && <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900"><Icon name="clock" size={15} className="mt-0.5 shrink-0"/><span>You already have a pending request for this chef and time. <Link to="/my-bookings" className="font-bold underline">View your request</Link></span></div>}
                            <label className="mt-5 flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-muted focus-within:border-sage"><Icon name="search" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an ingredient" className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none"/><span className="sr-only">Search groceries</span></label>
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{['All items', ...groceryCategories].map((value) => <button key={value} type="button" onClick={() => setCategory(value)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${category === value ? 'border-sage-dark bg-sage-dark text-white' : 'border-line text-ink/75 hover:border-sage/50'}`}>{value}</button>)}</div>
                            {groceryQuery.isLoading ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{[0,1,2,3].map((key) => <div key={key} className="h-28 animate-pulse rounded-lg bg-stone-100" />)}</div>
                                : groceryQuery.isError ? <div className="mt-5 rounded-lg bg-rust-soft p-4 text-[12px] text-rust">{errorMessage(groceryQuery.error)} <button type="button" onClick={() => groceryQuery.refetch()} className="font-bold underline">Retry</button></div>
                                    : !groceryQuery.data?.store ? <div className="mt-5 rounded-lg bg-stone-50 p-5 text-center"><p className="font-semibold">No grocery store serving {chef.city} yet</p><p className="mt-1 text-[12px] text-muted">You can still send your booking request without groceries.</p></div>
                                        : <div className="mt-4 grid max-h-[470px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{visibleItems.map((item) => { const style = categoryStyle[item.category] || categoryStyle.Other; const quantity = quantities[item._id] || 0; return <div key={item._id} className="flex min-w-0 items-center gap-3 rounded-lg border border-line p-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[23px] ${style.tint}`}>{style.emoji}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold">{item.name}</p><p className="text-[10px] text-muted">{item.category} · {item.unit}</p><p className="mt-1 text-[12px] font-bold text-rust">{money(item.price)} / {item.unit}</p></div>{item.inStock ? quantity ? <div className="flex items-center gap-2"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item._id, quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line"><Icon name="minus" size={14}/></button><span className="w-4 text-center text-[12px] font-bold">{quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item._id, quantity + 1)} disabled={quantity >= 50} className="flex h-7 w-7 items-center justify-center rounded-full border border-line disabled:opacity-40"><Icon name="plus" size={14}/></button></div> : <button type="button" onClick={() => changeQuantity(item._id, 1)} className="rounded-md bg-sage-soft px-3 py-2 text-[10px] font-bold text-sage-dark hover:bg-sage hover:text-white">Add</button> : <span className="text-[10px] font-semibold text-muted">Out of stock</span>}</div> })}{visibleItems.length === 0 && <p className="col-span-2 py-8 text-center text-[12px] text-muted">No matching items in this category.</p>}</div>}

                            {selectedItems.length > 0 && <div className="mt-4 rounded-lg bg-stone-50 p-3"><div className="flex items-center justify-between text-[12px]"><span>{selectedItems.reduce((sum, item) => sum + quantities[item._id], 0)} grocery item(s)</span><span className="font-bold">{money(grocerySubtotal)}</span></div><div className="mt-1 flex items-center justify-between text-[11px] text-muted"><span>Estimated delivery</span><span>{estimatedDelivery ? money(estimatedDelivery) : 'Free'}</span></div></div>}

                            {bookMutation.isError && <p role="alert" className="mt-4 rounded-lg bg-rust-soft p-3 text-[12px] text-rust">{errorMessage(bookMutation.error)}</p>}
                            <div className="mt-5 border-t border-line pt-4"><div className="flex items-center justify-between"><span className="text-[12px] text-muted">Estimated total in cash</span><span className="font-serif text-[22px] font-semibold">{money(estimatedTotal)}</span></div><p className="mt-1 text-[10px] text-muted">Grocery delivery estimate uses current standard rates; final amount is confirmed by the server.</p><button type="submit" disabled={bookMutation.isPending || !currentSlot || !street.trim() || checkingPending || pendingForSelectedSlot} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-3.5 text-[14px] font-bold text-white transition hover:bg-sage disabled:cursor-wait disabled:opacity-50">{bookMutation.isPending ? 'Sending request…' : 'Send request to chef'} {!bookMutation.isPending && <Icon name="arrowRight" size={16}/>}</button><p className="mt-2 text-center text-[10px] text-muted">The chef has 15 minutes to respond. No payment is taken now.</p></div>
                        </form>
                    )}
                </section>

                <aside className="lg:sticky lg:top-24">
                    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                        <div className="border-b border-line bg-stone-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rust">Booking summary</p><h2 className="mt-1 font-serif text-[21px] font-semibold">{chef.name}</h2><p className="mt-1 text-[11px] text-muted">{chef.city} · {chef.cuisines?.join(', ')}</p></div>
                        <div className="space-y-3 p-4 text-[12px]"><div className="flex justify-between gap-3"><span className="text-muted">Date & time</span><span className="text-right font-semibold">{dateParts(date).day}, {dateParts(date).date} {dateParts(date).month}<br/>{selectedSlot ? slotLabel(selectedSlot) : 'Choose a slot'}</span></div><div className="flex justify-between gap-3"><span className="text-muted">Chef fee · 2 hours</span><span className="font-semibold">{money(chef.ratePerSlot)}</span></div>{grocerySubtotal > 0 && <><div className="flex justify-between gap-3"><span className="text-muted">Groceries</span><span className="font-semibold">{money(grocerySubtotal)}</span></div><div className="flex justify-between gap-3"><span className="text-muted">Delivery estimate</span><span className="font-semibold">{estimatedDelivery ? money(estimatedDelivery) : 'Free'}</span></div></>}<div className="flex justify-between border-t border-line pt-3 text-[13px] font-bold"><span>Estimated total</span><span className="text-rust">{money(estimatedTotal)}</span></div><p className="text-[10px] text-muted">Pay the chef in cash after the meal.</p></div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-sage-soft/60 p-3 text-[11px] leading-relaxed text-sage-dark"><Icon name="shield" size={15} className="mt-0.5 shrink-0"/>The chef confirms or declines within 15 minutes. Free cancellation is available until 90 minutes before the slot.</div>
                </aside>
            </div>
        </main>
    )
}

export default BookingRequest
