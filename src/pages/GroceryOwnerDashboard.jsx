import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { groceryCategories, categoryStyle } from '../constants/grocery'
import { slotLabel } from '../lib/time'
import Icon from '../components/Icon'
import toast from '../lib/toast'

// ---------------------------------------------------------------------------
// Order journey for a grocery store:
//   ordered (new) -> packed (cart ready) -> out_for_delivery (shipped) -> delivered_to_chef (completed)
// An open order whose delivery time passed (or whose booking already completed) without
// being marked delivered moves to "Missed". The store can still update it from there.
// A cancelled booking turns undelivered groceries into 'cancelled'; delivered ones
// come back as 'return_requested' and the store verifies the return.
// ---------------------------------------------------------------------------
const STAGES = [
    { key: 'ordered', label: 'New orders', short: 'New', icon: 'bell', hint: 'Add every item to the cart, then mark the order packed.' },
    { key: 'packed', label: 'Ready to ship', short: 'Packed', icon: 'basket', hint: 'Packed and waiting. Send them out to the chef.' },
    { key: 'out_for_delivery', label: 'On the way', short: 'Shipped', icon: 'truck', hint: 'With your rider. Mark delivered once the chef has them.' },
    { key: 'delivered_to_chef', label: 'Delivered', short: 'Delivered', icon: 'checkCircle', hint: 'Completed deliveries. The chef has the groceries.' },
    { key: 'missed', label: 'Missed', short: 'Missed', icon: 'clock', hint: 'These orders passed their delivery time without being marked delivered. If you already delivered one, mark it delivered now. Otherwise contact the chef.' }
]
const OPEN_STATUSES = ['ordered', 'packed', 'out_for_delivery']
const DELIVERED = { status: 'delivered_to_chef', label: 'Mark delivered', icon: 'checkCircle' }
const statusInfo = {
    ordered: ['New order', 'border-amber-200 bg-amber-50 text-amber-800'],
    packed: ['Packed', 'border-sky-200 bg-sky-50 text-sky-800'],
    out_for_delivery: ['On the way', 'border-violet-200 bg-violet-50 text-violet-800'],
    delivered_to_chef: ['Delivered', 'border-sage/25 bg-sage-soft text-sage-dark'],
    return_requested: ['Return requested', 'border-rust/25 bg-rust-soft text-rust'],
    return_verified: ['Return verified', 'border-line bg-stone-100 text-muted'],
    cancelled: ['Cancelled', 'border-line bg-stone-100 text-muted']
}
const NEXT = {
    ordered: { status: 'packed', label: 'Mark packed', icon: 'basket' },
    packed: { status: 'out_for_delivery', label: 'Ship to chef', icon: 'truck' },
    out_for_delivery: { status: 'delivered_to_chef', label: 'Mark delivered', icon: 'checkCircle' }
}
const NAV = [
    { to: '/store', label: 'Overview', icon: 'sparkle', exact: true },
    { to: '/store/orders', label: 'Orders', icon: 'basket', countKey: 'orders' },
    { to: '/store/returns', label: 'Returns', icon: 'undo', countKey: 'returns' },
    { to: '/store/inventory', label: 'Inventory', icon: 'store' }
]
const units = ['kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'piece']
const emptyItem = { name: '', category: groceryCategories[0], price: '', unit: 'kg', inStock: true }

// ---------------- helpers ----------------
const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`
const orderRef = (id = '') => `#${String(id).slice(-6).toUpperCase()}`
const dateLabel = (date) => date ? new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(new Date(`${date}T12:00:00+05:00`)) : '—'
const timeLabel = (value) => value ? new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' }).format(new Date(value)) : ''
const startTime = (slot = '') => { const h = Number(slot.split('-')[0]); return `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}` }

// "in 3h 20m" / "45m ago"
const relative = (value) => {
    if (!value) return ''
    const diff = new Date(value).getTime() - Date.now()
    const mins = Math.round(Math.abs(diff) / 60000)
    const text = mins < 60 ? `${mins}m` : mins < 48 * 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}` : `${Math.round(mins / 1440)} days`
    return diff >= 0 ? `in ${text}` : `${text} ago`
}

// Pakistani mobile -> tel: and WhatsApp links
const phoneLinks = (phone = '') => {
    const digits = phone.replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits
    return { tel: `tel:+${intl}`, wa: `https://wa.me/${intl}` }
}

// Packing checklist ("cart") is kept per order in this browser
const cartKey = (id) => `chefhaazir-store-cart:${id}`
const readCart = (id) => { try { return JSON.parse(localStorage.getItem(cartKey(id)) || '[]') } catch { return [] } }
const writeCart = (id, value) => { try { localStorage.setItem(cartKey(id), JSON.stringify(value)) } catch { /* storage disabled */ } }

// ---------------- small UI parts ----------------
const Panel = ({ children, className = '' }) => <section className={`rounded-xl border border-line bg-white shadow-card ${className}`}>{children}</section>

const StatusPill = ({ status }) => {
    const [label, color] = statusInfo[status] || ['In progress', 'border-line bg-stone-100 text-muted']
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${color}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>
}

const PortalNavLink = ({ to, label, icon, exact, count }) => (
    <NavLink to={to} end={exact} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-rust text-white shadow-sm' : 'text-ink/75 hover:bg-stone-100 hover:text-ink'}`}>
        {({ isActive }) => <><Icon name={icon} size={16} className={isActive ? 'text-white' : 'text-muted'} /><span className="flex-1">{label}</span>{count > 0 && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-rust text-white'}`}>{count > 99 ? '99+' : count}</span>}</>}
    </NavLink>
)

const Heading = ({ eyebrow, title, text, action }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rust">{eyebrow}</p>}
            <h1 className="mt-1.5 font-serif text-[30px] font-semibold leading-tight sm:text-[36px]">{title}</h1>
            {text && <p className="mt-1 max-w-2xl text-[12.5px] text-muted">{text}</p>}
        </div>
        {action}
    </div>
)

const Empty = ({ icon, title, text }) => (
    <Panel className="px-6 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sage-soft text-sage-dark"><Icon name={icon} size={22} /></span>
        <p className="mt-4 font-serif text-[21px] font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-[12px] text-muted">{text}</p>
    </Panel>
)

// Ordered -> Packed -> Shipped -> Delivered, with the time of each step
const Timeline = ({ order }) => {
    const steps = [
        ['Ordered', order.createdAt, true],
        ['Packed', order.groceryPackedAt, ['packed', 'out_for_delivery', 'delivered_to_chef', 'return_requested', 'return_verified'].includes(order.groceryStatus)],
        ['Shipped', order.groceryShippedAt, ['out_for_delivery', 'delivered_to_chef', 'return_requested', 'return_verified'].includes(order.groceryStatus)],
        ['Delivered', order.groceryDeliveredAt, ['delivered_to_chef', 'return_requested', 'return_verified'].includes(order.groceryStatus)]
    ]
    return (
        <ol className="grid grid-cols-4 gap-1">
            {steps.map(([label, at, done], i) => (
                <li key={label} className="min-w-0">
                    <div className="flex items-center">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-sage-dark text-white' : 'border-2 border-line bg-white'}`}>{done && <Icon name="check" size={11} strokeWidth={3} />}</span>
                        {i < 3 && <span className={`mx-1 h-0.5 flex-1 rounded ${steps[i + 1][2] ? 'bg-sage-dark' : 'bg-line'}`} />}
                    </div>
                    <p className={`mt-1.5 text-[10px] font-bold ${done ? 'text-ink' : 'text-muted'}`}>{label}</p>
                    <p className="truncate text-[9px] text-muted">{done && at ? timeLabel(at) : ''}</p>
                </li>
            ))}
        </ol>
    )
}

// ---------------- Order card ----------------
const OrderCard = ({ order, onAdvance, onVerifyReturn, busyId }) => {
    const items = order.groceryItems || []
    const [cart, setCart] = useState(() => readCart(order._id))
    const isOpen = OPEN_STATUSES.includes(order.groceryStatus)
    // Booking is still relevant to the store (not cancelled, rejected or expired)
    const bookingLive = ['confirmed', 'completed', 'disputed'].includes(order.status)
    // Delivery time passed, or the booking already completed, and the order was never finished
    const missed = isOpen && bookingLive && (order.status !== 'confirmed' || new Date(order.slotStart).getTime() < Date.now())
    // The packing checklist only applies to a new order that is still on time
    const isNew = order.groceryStatus === 'ordered' && !missed
    const allInCart = items.length > 0 && items.every((_, i) => cart.includes(i))
    const next = NEXT[order.groceryStatus]
    const busy = busyId === order._id
    const chef = order.chef || {}
    const links = phoneLinks(chef.phone)
    const address = order.chefProfile?.address
    const deliverBy = order.slotStart
    const late = missed || ((isNew || order.groceryStatus === 'packed') && deliverBy ? new Date(deliverBy).getTime() < Date.now() + 60 * 60000 : false)

    const toggle = (i) => {
        if (!isNew) return
        const nextCart = cart.includes(i) ? cart.filter((x) => x !== i) : [...cart, i]
        setCart(nextCart)
        writeCart(order._id, nextCart)
    }
    const addAll = () => { const all = items.map((_, i) => i); setCart(all); writeCart(order._id, all) }

    return (
        <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-stone-50/70 px-4 py-3.5 sm:px-5">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-[19px] font-semibold">Order {orderRef(order._id)}</h3>
                        <StatusPill status={order.groceryStatus} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">{items.length} {items.length === 1 ? 'item' : 'items'} · for {dateLabel(order.date)}, {slotLabel(order.slot)}</p>
                </div>
                {isOpen && bookingLive && (
                    <div className={`rounded-lg px-3 py-1.5 text-right ${late ? 'bg-rust-soft text-rust-dark' : 'bg-white text-ink ring-1 ring-line'}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-75">{missed ? 'Was due at' : 'Deliver before'}</p>
                        <p className="text-[12px] font-bold">{startTime(order.slot)} · {relative(deliverBy)}</p>
                    </div>
                )}
            </div>

            {missed && (
                <p className="flex items-start gap-2 bg-amber-50 px-5 py-2.5 text-[11px] font-semibold text-amber-900"><Icon name="clock" size={14} className="mt-0.5 shrink-0" /> <span>{order.status === 'confirmed' ? 'The delivery time has passed.' : `This booking is already ${order.status}.`} This order was never marked delivered. If you already delivered it, mark it delivered. If a step is still pending, update it below.</span></p>
            )}

            {!bookingLive && isOpen && (
                <p className="flex items-center gap-2 bg-rust-soft px-5 py-2.5 text-[11px] font-semibold text-rust-dark"><Icon name="xCircle" size={14} /> This booking is {order.status}. Do not send these groceries.</p>
            )}

            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr]">
                {/* Cart / packing list */}
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{isNew ? 'Add to cart' : 'Items in this order'}</p>
                        {isNew && items.length > 0 && <span className="text-[11px] font-bold text-sage-dark">{cart.filter((i) => i < items.length).length}/{items.length} in cart</span>}
                    </div>
                    {isNew && items.length > 0 && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><motion.div className="h-full rounded-full bg-sage-dark" animate={{ width: `${(cart.filter((i) => i < items.length).length / items.length) * 100}%` }} /></div>}
                    <ul className="mt-3 space-y-1.5">
                        {items.map((line, i) => {
                            const inCart = !isNew || cart.includes(i)
                            const style = categoryStyle[line.category] || null
                            return (
                                <li key={`${line.name}-${i}`}>
                                    <button type="button" onClick={() => toggle(i)} disabled={!isNew} aria-pressed={inCart}
                                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${isNew ? (inCart ? 'border-sage/30 bg-sage-soft/50' : 'border-line hover:border-sage/40') : 'cursor-default border-transparent bg-stone-50'}`}>
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${inCart ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white'}`}>{inCart && <Icon name="check" size={12} strokeWidth={3} />}</span>
                                        {style && <span aria-hidden="true" className="text-[16px]">{style.emoji}</span>}
                                        <span className={`min-w-0 flex-1 text-[12.5px] ${inCart && isNew ? 'text-ink/60 line-through decoration-sage-dark/40' : 'font-semibold'}`}>{line.name}</span>
                                        <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-bold ring-1 ring-line">× {line.quantity} {line.unit}</span>
                                        <span className="w-16 shrink-0 text-right text-[11.5px] font-semibold">{money(line.lineTotal)}</span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                    <div className="mt-3 space-y-1 rounded-lg bg-stone-50 px-3 py-2.5 text-[11.5px]">
                        <div className="flex justify-between"><span className="text-muted">Groceries</span><span className="font-semibold">{money(order.grocerySubtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Delivery fee</span><span className="font-semibold">{order.deliveryFee ? money(order.deliveryFee) : 'Free'}</span></div>
                        <div className="flex justify-between border-t border-line pt-1.5 font-bold"><span>Order value</span><span className="text-rust">{money((order.grocerySubtotal || 0) + (order.deliveryFee || 0))}</span></div>
                        <p className="pt-0.5 text-[10px] text-muted">The chef collects this from the customer and settles it with Chef Haazir. Don’t collect cash from the chef.</p>
                    </div>
                </div>

                {/* Chef contact + delivery */}
                <div className="space-y-3">
                    <div className="rounded-lg border border-line p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Deliver to chef</p>
                        <p className="mt-1.5 flex items-center gap-2 text-[14px] font-bold"><Icon name="chef" size={16} className="text-rust" /> {chef.name || 'Chef'}</p>
                        {chef.phone ? (
                            <>
                                <p className="mt-1 font-mono text-[13px] tracking-wide">{chef.phone}</p>
                                <div className="mt-2.5 grid grid-cols-2 gap-2">
                                    <a href={links.tel} className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-bold hover:border-sage/50"><Icon name="phone" size={14} /> Call</a>
                                    <a href={links.wa} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1f7a4d] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#19663f]"><Icon name="chat" size={14} /> WhatsApp</a>
                                </div>
                            </>
                        ) : <p className="mt-1 text-[11px] text-muted">Phone not available</p>}
                        {address && (
                            <div className="mt-3 border-t border-line pt-3">
                                <p className="flex items-start gap-2 text-[12px]"><Icon name="pin" size={14} className="mt-0.5 shrink-0 text-rust" /> {address}{order.chefProfile?.city ? `, ${order.chefProfile.city}` : ''}</p>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${order.chefProfile?.city || ''}`)}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-rust hover:underline">Open in Maps <Icon name="arrowUpRight" size={12} /></a>
                            </div>
                        )}
                    </div>
                    <div className="rounded-lg border border-line p-3.5"><Timeline order={order} /></div>
                    {order.groceryStatus === 'cancelled' && order.cancelReason && <p className="rounded-lg bg-stone-50 px-3 py-2 text-[11px] text-muted">Booking cancelled: {order.cancelReason}</p>}
                </div>
            </div>

            {/* Action */}
            {(next || order.groceryStatus === 'return_requested') && (
                <div className="flex flex-col gap-2 border-t border-line bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-[11px] text-muted">
                        {order.groceryStatus === 'return_requested' ? 'The chef is sending these groceries back. Verify once you receive them.'
                            : missed ? 'Update this order to match what really happened. Skipped steps are filled in automatically.'
                                : isNew ? (allInCart ? 'Everything is in the cart. Mark the order packed.' : 'Tick each item as you put it in the cart.')
                                    : order.groceryStatus === 'packed' ? 'Hand the order to your rider, then mark it shipped.' : 'Mark delivered once the chef has received the groceries.'}
                    </p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {isNew && !allInCart && items.length > 0 && <button type="button" onClick={addAll} className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[11px] font-bold hover:border-sage/50">Add all to cart</button>}
                        {order.groceryStatus === 'return_requested' ? (
                            <button type="button" disabled={busy} onClick={() => onVerifyReturn(order)} className="flex items-center gap-1.5 rounded-lg bg-rust px-4 py-2.5 text-[11px] font-bold text-white hover:bg-rust-dark disabled:opacity-50"><Icon name="undo" size={14} /> {busy ? 'Saving…' : 'Verify return received'}</button>
                        ) : missed ? (
                            <>
                                {next.status !== 'delivered_to_chef' && <button type="button" disabled={busy} onClick={() => onAdvance(order, next)} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2.5 text-[11px] font-bold hover:border-sage/50 disabled:opacity-50"><Icon name={next.icon} size={14} /> {next.label}</button>}
                                <button type="button" disabled={busy} onClick={() => onAdvance(order, DELIVERED)} className="flex items-center gap-1.5 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage disabled:cursor-not-allowed disabled:opacity-45"><Icon name={DELIVERED.icon} size={14} /> {busy ? 'Saving…' : DELIVERED.label}</button>
                            </>
                        ) : (
                            <button type="button" disabled={busy || !bookingLive || (isNew && !allInCart)} onClick={() => onAdvance(order, next)} className="flex items-center gap-1.5 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage disabled:cursor-not-allowed disabled:opacity-45"><Icon name={next.icon} size={14} /> {busy ? 'Saving…' : next.label}</button>
                        )}
                    </div>
                </div>
            )}
        </motion.article>
    )
}

// ---------------- Orders, Returns, Overview, Inventory ----------------
// stage: a grocery status, 'missed', 'upcoming' (all open orders still on time), or null (everything)
const useOrders = (status, enabled = true) => useQuery({
    queryKey: ['store-orders', status || 'all'],
    queryFn: async () => {
        const params = status === 'missed' || status === 'upcoming' ? { view: status } : { status: status || undefined }
        return (await api.get('/grocery/orders', { params: { ...params, page: 1, limit: 50 } })).data.orders ?? []
    },
    enabled,
    refetchInterval: status === 'ordered' ? 20_000 : 30_000,
    refetchOnWindowFocus: true
})

const useOrderActions = () => {
    const client = useQueryClient()
    const [busyId, setBusyId] = useState(null)
    const done = (message) => {
        toast.success(message)
        client.invalidateQueries({ queryKey: ['store-orders'] })
        client.invalidateQueries({ queryKey: ['store-stats'] })
    }
    const advance = useMutation({
        mutationFn: async ({ order, next }) => (await api.patch(`/grocery/orders/${order._id}/status`, { status: next.status })).data,
        onMutate: ({ order }) => setBusyId(order._id),
        onSuccess: (data, { order, next }) => {
            if (next.status === 'packed' || next.status === 'delivered_to_chef') writeCart(order._id, [])
            done(data.message || 'Order updated')
        },
        onError: (error) => toast.error(errorMessage(error)),
        onSettled: () => setBusyId(null)
    })
    const verify = useMutation({
        mutationFn: async (order) => (await api.patch(`/grocery/orders/${order._id}/verify-return`)).data,
        onMutate: (order) => setBusyId(order._id),
        onSuccess: (data) => done(data.message || 'Return verified'),
        onError: (error) => toast.error(errorMessage(error)),
        onSettled: () => setBusyId(null)
    })
    return { busyId, onAdvance: (order, next) => advance.mutate({ order, next }), onVerifyReturn: (order) => verify.mutate(order) }
}

const OrderList = ({ query, empty, actions }) => {
    if (query.isLoading) return <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-stone-100" />)}</div>
    if (query.isError) return <Panel className="p-5 text-[12px] text-rust">{errorMessage(query.error)} <button type="button" onClick={() => query.refetch()} className="ml-2 font-bold underline">Retry</button></Panel>
    if (!query.data.length) return empty
    return <div className="space-y-4"><AnimatePresence mode="popLayout">{query.data.map((order) => <OrderCard key={order._id} order={order} {...actions} />)}</AnimatePresence></div>
}

const Orders = ({ counts }) => {
    const [stage, setStage] = useState('ordered')
    const query = useOrders(stage)
    const actions = useOrderActions()
    const current = STAGES.find((s) => s.key === stage)

    return (
        <div className="space-y-6">
            <Heading eyebrow="Order desk" title="Grocery orders" text="Orders arrive when a chef accepts a booking with groceries. Pack them, ship them to the chef, and mark them delivered. Anything you forget moves to Missed, where you can still update it." />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {STAGES.map((s, i) => {
                    const active = s.key === stage
                    const count = counts[s.key]
                    const warn = s.key === 'missed' && count > 0 && !active
                    return (
                        <button key={s.key} type="button" onClick={() => setStage(s.key)} aria-pressed={active}
                            className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-sage-dark bg-sage-dark text-white shadow-sm' : warn ? 'border-rust/40 bg-rust-soft hover:border-rust' : 'border-line bg-white hover:border-sage/40'}`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/15' : 'bg-stone-100 text-ink/70'}`}><Icon name={s.icon} size={17} /></span>
                            <span className="min-w-0">
                                <span className={`block text-[9px] font-bold uppercase tracking-wide ${active ? 'text-white/70' : 'text-muted'}`}>{s.key === 'missed' ? 'Needs attention' : `Step ${i + 1}`}</span>
                                <span className="block truncate text-[12.5px] font-bold">{s.label}</span>
                            </span>
                            {count > 0 && s.key !== 'delivered_to_chef' && <span className={`absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white text-sage-dark' : 'bg-rust text-white'}`}>{count}</span>}
                        </button>
                    )
                })}
            </div>
            <p className="flex items-center gap-2 text-[12px] text-muted"><Icon name={current.icon} size={14} className="text-rust" /> {current.hint}</p>
            <OrderList query={query} actions={actions} empty={<Empty icon={current.icon} title={stage === 'ordered' ? 'No new orders' : `Nothing ${current.label.toLowerCase()}`} text={stage === 'ordered' ? 'New grocery orders appear here as soon as a chef accepts a booking with groceries. This page refreshes on its own.' : stage === 'missed' ? 'Orders that pass their delivery time without being marked delivered show up here, so nothing gets forgotten.' : 'Orders move here as you work through them.'} />} />
        </div>
    )
}

const Returns = () => {
    const [tab, setTab] = useState('return_requested')
    const query = useOrders(tab)
    const actions = useOrderActions()
    return (
        <div className="space-y-6">
            <Heading eyebrow="Returns" title="Grocery returns" text="When a booking is cancelled after groceries reached the chef, the chef sends them back. Verify each return once the goods are with you." />
            <div className="flex w-fit gap-1 rounded-xl bg-stone-100 p-1">
                {[['return_requested', 'To verify'], ['return_verified', 'Verified'], ['cancelled', 'Cancelled orders']].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-[11.5px] font-semibold ${tab === key ? 'bg-white text-rust shadow-sm' : 'text-muted'}`}>{label}</button>
                ))}
            </div>
            <OrderList query={query} actions={actions} empty={<Empty icon="undo" title={tab === 'return_requested' ? 'No returns to verify' : 'Nothing here yet'} text="Returns appear here when a chef sends back groceries from a cancelled booking." />} />
        </div>
    )
}

const Overview = ({ store, stats, counts, navigate }) => {
    const open = useOrders('upcoming')
    const queue = (open.data || []).slice(0, 4)
    const kpis = [
        { label: 'New orders to pack', value: counts.ordered, icon: 'bell', tone: 'text-rust', to: '/store/orders' },
        { label: 'Ready to ship', value: counts.packed, icon: 'basket', tone: 'text-sky-700', to: '/store/orders' },
        { label: 'On the way', value: counts.out_for_delivery, icon: 'truck', tone: 'text-violet-700', to: '/store/orders' },
        { label: 'Missed orders', value: counts.missed, icon: 'clock', tone: 'text-rust', to: '/store/orders' },
        { label: 'Returns to verify', value: counts.return_requested, icon: 'undo', tone: 'text-rust', to: '/store/returns' }
    ]
    const top = stats.data?.topItems || []

    return (
        <div className="space-y-7">
            <Heading eyebrow={`${store.city} grocery store`} title={`Salaam, ${store.ownerName?.split(' ')[0] || 'partner'}`} text={`${store.name} · ${store.address || ''}`}
                action={<button type="button" onClick={() => navigate('/store/orders')} className="flex items-center gap-2 rounded-lg bg-rust px-4 py-2.5 text-[12px] font-bold text-white hover:bg-rust-dark"><Icon name="basket" size={15} /> Open order desk</button>} />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {kpis.map((k) => (
                    <Link key={k.label} to={k.to} className="group rounded-xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                        <div className="flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">{k.label}</p><Icon name={k.icon} size={18} className={k.tone} /></div>
                        <p className="mt-2 font-serif text-[32px] font-semibold leading-none">{stats.isLoading ? '—' : k.value || 0}</p>
                        <p className="mt-2 text-[10px] font-bold text-rust opacity-0 transition group-hover:opacity-100">View →</p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <section>
                    <div className="flex items-end justify-between gap-3"><div><h2 className="font-serif text-[23px] font-semibold">Next to deliver</h2><p className="text-[11px] text-muted">Open orders, soonest slot first.</p></div><Link to="/store/orders" className="text-[11px] font-bold text-rust">All orders →</Link></div>
                    {open.isLoading ? <div className="mt-3 h-40 animate-pulse rounded-xl bg-stone-100" /> : queue.length ? (
                        <Panel className="mt-3 divide-y divide-line">
                            {queue.map((o) => (
                                <button key={o._id} type="button" onClick={() => navigate('/store/orders')} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100"><Icon name={STAGES.find((s) => s.key === o.groceryStatus)?.icon || 'basket'} size={17} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2"><strong className="text-[13px]">Chef {o.chef?.name || '—'}</strong><StatusPill status={o.groceryStatus} /></span>
                                        <span className="mt-0.5 block truncate text-[11px] text-muted">{o.groceryItems?.length || 0} items · {money(o.grocerySubtotal)} · {o.chef?.phone || ''}</span>
                                    </span>
                                    <span className="shrink-0 text-right"><span className="block text-[12px] font-bold">{startTime(o.slot)}</span><span className="block text-[10px] text-muted">{relative(o.slotStart)}</span></span>
                                </button>
                            ))}
                        </Panel>
                    ) : <div className="mt-3"><Empty icon="checkCircle" title="All caught up" text="No open orders right now. New orders appear as soon as chefs accept bookings with groceries." /></div>}
                </section>

                <section className="space-y-4">
                    <Panel className="p-5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Completed grocery sales</p>
                        <p className="mt-2 font-serif text-[30px] font-semibold text-sage-dark">{money(stats.data?.sales?.sales)}</p>
                        <p className="mt-1 text-[11px] text-muted">{stats.data?.sales?.orders || 0} completed bookings · {money(stats.data?.sales?.deliveryFees)} delivery fees</p>
                    </Panel>
                    <Panel className="p-5">
                        <h3 className="font-serif text-[19px] font-semibold">Best sellers</h3>
                        {top.length ? (
                            <ul className="mt-3 space-y-2.5">
                                {top.slice(0, 5).map((t, i) => (
                                    <li key={t._id || t.name} className="flex items-center gap-3 text-[12px]">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold">{i + 1}</span>
                                        <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                                        <span className="text-muted">{t.quantitySold} {t.unit}</span>
                                        <span className="w-20 text-right font-bold">{money(t.revenue)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="mt-2 text-[11px] text-muted">Best sellers appear after your first completed bookings.</p>}
                    </Panel>
                </section>
            </div>
        </div>
    )
}

const ItemForm = ({ value, city, onClose, onSave, saving }) => {
    const [form, setForm] = useState(value)
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && !saving && onClose()
        document.addEventListener('keydown', esc)
        return () => document.removeEventListener('keydown', esc)
    }, [onClose, saving])
    const input = 'mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13px] font-normal outline-none focus:border-sage focus:ring-2 focus:ring-sage/20'
    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
            <form role="dialog" aria-modal="true" onSubmit={(e) => { e.preventDefault(); onSave({ name: form.name.trim(), category: form.category, unit: form.unit, price: Number(form.price), inStock: form.inStock }) }} className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl sm:p-6">
                <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-rust">{city} store inventory</p><h2 className="mt-1 font-serif text-[24px] font-semibold">{value._id ? 'Edit item' : 'Add grocery item'}</h2></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-stone-100"><Icon name="close" size={16} /></button></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-semibold sm:col-span-2">Item name<input required minLength={2} maxLength={60} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="e.g. Basmati rice (sella)" /></label>
                    <label className="text-[11px] font-semibold">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>{groceryCategories.map((c) => <option key={c}>{c}</option>)}</select></label>
                    <label className="text-[11px] font-semibold">Sold per<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input}>{units.map((u) => <option key={u}>{u}</option>)}</select></label>
                    <label className="text-[11px] font-semibold">Price (Rs)<input required type="number" min="1" max="100000" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} /></label>
                    <label className="flex items-center gap-2 self-end pb-3 text-[12px] font-semibold"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="h-4 w-4 accent-[#3E5D4D]" /> In stock</label>
                </div>
                <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 text-[12px] font-semibold">Cancel</button><button disabled={saving} className="rounded-lg bg-rust px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : value._id ? 'Save item' : 'Add item'}</button></div>
            </form>
        </div>
    )
}

const Inventory = ({ store }) => {
    const client = useQueryClient()
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const items = useQuery({ queryKey: ['store-items'], queryFn: async () => (await api.get('/grocery/my-items')).data.items ?? [] })
    const mutation = useMutation({
        mutationFn: async ({ action, id, value }) => {
            if (action === 'create') return (await api.post('/grocery/items', value)).data
            if (action === 'delete') return (await api.delete(`/grocery/items/${id}`)).data
            return (await api.patch(`/grocery/items/${id}`, value)).data
        },
        onSuccess: (data, vars) => {
            toast.success(data.message || (vars.action === 'delete' ? 'Item removed' : 'Item saved'))
            setEditing(null); setDeleting(null)
            client.invalidateQueries({ queryKey: ['store-items'] })
            client.invalidateQueries({ queryKey: ['grocery'] })
        },
        onError: (error) => toast.error(errorMessage(error))
    })

    const list = useMemo(() => (items.data || []).filter((i) => (!category || i.category === category) && i.name.toLowerCase().includes(search.trim().toLowerCase())), [items.data, category, search])
    const outCount = (items.data || []).filter((i) => !i.inStock).length

    return (
        <div className="space-y-6">
            <Heading eyebrow="Inventory" title="Store catalog" text={`Customers in ${store.city} pick from these items when they book a chef. Prices are locked into each booking.`}
                action={<button type="button" onClick={() => setEditing({ ...emptyItem })} className="flex items-center gap-2 rounded-lg bg-rust px-4 py-2.5 text-[12px] font-bold text-white hover:bg-rust-dark"><Icon name="plus" size={15} /> Add item</button>} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex-1"><Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items" className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-sage" /></label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2.5 text-[13px]"><option value="">All categories</option>{groceryCategories.map((c) => <option key={c}>{c}</option>)}</select>
                <span className="text-[11px] text-muted">{items.data?.length || 0} items{outCount ? ` · ${outCount} out of stock` : ''}</span>
            </div>
            {items.isLoading ? <div className="h-72 animate-pulse rounded-xl bg-stone-100" /> : items.isError ? <Panel className="p-5 text-[12px] text-rust">{errorMessage(items.error)}</Panel> : !list.length ? (
                <Empty icon="store" title={items.data?.length ? 'No matching items' : 'No items yet'} text={items.data?.length ? 'Try another search or category.' : 'Add your store’s first grocery item so customers can order it with a chef.'} />
            ) : (
                <Panel className="divide-y divide-line overflow-hidden">
                    {list.map((item) => {
                        const style = categoryStyle[item.category] || categoryStyle.Other
                        return (
                            <article key={item._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                                <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[20px] ${style.tint}`}>{style.emoji}</span>
                                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{item.name}</p><p className="text-[11px] text-muted">{item.category} · per {item.unit}</p></div>
                                <strong className="w-24 text-right text-[13px]">{money(item.price)}</strong>
                                <button type="button" role="switch" aria-checked={item.inStock} disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'edit', id: item._id, value: { inStock: !item.inStock } })}
                                    className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition ${item.inStock ? 'bg-sage-soft text-sage-dark' : 'bg-rust-soft text-rust'}`}>
                                    <span className={`relative h-4 w-7 rounded-full transition ${item.inStock ? 'bg-sage-dark' : 'bg-rust/40'}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${item.inStock ? 'left-3.5' : 'left-0.5'}`} /></span>
                                    {item.inStock ? 'In stock' : 'Out of stock'}
                                </button>
                                <button type="button" onClick={() => setEditing({ ...item, price: String(item.price) })} className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold hover:border-sage/50">Edit</button>
                                <button type="button" onClick={() => setDeleting(item)} aria-label={`Remove ${item.name}`} className="rounded-lg p-2 text-muted hover:bg-rust-soft hover:text-rust"><Icon name="close" size={14} /></button>
                            </article>
                        )
                    })}
                </Panel>
            )}
            {editing && <ItemForm value={editing} city={store.city} saving={mutation.isPending} onClose={() => setEditing(null)} onSave={(value) => mutation.mutate({ action: editing._id ? 'edit' : 'create', id: editing._id, value })} />}
            {deleting && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4">
                    <section role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lift">
                        <h2 className="font-serif text-[22px] font-semibold">Remove {deleting.name}?</h2>
                        <p className="mt-2 text-[12px] leading-relaxed text-muted">It disappears from your catalog. Past bookings keep their records. To pause it instead, mark it out of stock.</p>
                        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className="rounded-lg border border-line px-4 py-2.5 text-[11px] font-semibold">Keep item</button><button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'delete', id: deleting._id })} className="rounded-lg bg-rust px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50">Remove item</button></div>
                    </section>
                </div>
            )}
        </div>
    )
}

// ---------------- Page shell ----------------
const GroceryOwnerDashboard = () => {
    const { user, isLoading: authLoading, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const isOwner = user?.role === 'grocery_owner'

    const storeQuery = useQuery({ queryKey: ['store-me'], queryFn: async () => (await api.get('/grocery/my-store')).data.store ?? null, enabled: isOwner, retry: false })
    const stats = useQuery({ queryKey: ['store-stats'], queryFn: async () => (await api.get('/grocery/stats')).data, enabled: isOwner, refetchInterval: 20_000, refetchOnWindowFocus: true })

    if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-sage border-t-transparent" /></div>
    if (!user) return <Navigate to="/login?next=%2Fstore" replace />
    if (!isOwner) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'chef' ? '/chef' : '/'} replace />

    const counts = stats.data?.needsAction || {}
    const navCounts = { orders: (counts.ordered || 0) + (counts.packed || 0) + (counts.out_for_delivery || 0) + (counts.missed || 0), returns: counts.return_requested || 0 }
    const section = location.pathname.split('/')[2] || 'overview'
    const store = storeQuery.data ? { ...storeQuery.data, ownerName: user.name } : null
    const active = store?.approvalStatus === 'approved'
    const signOut = () => { logout(); navigate('/') }

    const page = !store ? null
        : !active ? <Empty icon="shield" title="Store not active yet" text="Your store is waiting for Chef Haazir to activate it. Orders and inventory open as soon as it is active." />
            : section === 'orders' ? <Orders counts={counts} />
                : section === 'returns' ? <Returns />
                    : section === 'inventory' ? <Inventory store={store} />
                        : <Overview store={store} stats={stats} counts={counts} navigate={navigate} />

    return (
        <div className="min-h-screen bg-[#fbfaf8] text-ink">
            <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-7">
                    <Link to="/store" className="flex flex-col leading-none"><span className="font-serif text-[22px] font-semibold tracking-tight text-rust">Chef Haazir</span><span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-muted">Grocery partner portal</span></Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`hidden rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide sm:inline-flex ${active ? 'bg-sage-soft text-sage-dark' : 'bg-orange-100 text-rust'}`}>{active ? `${store.city} store · live` : 'Store not active'}</span>
                        <Link to="/store/orders" aria-label={`${counts.ordered || 0} new orders`} className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"><Icon name="bell" size={17} />{counts.ordered > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-white">{counts.ordered}</span>}</Link>
                        <div className="hidden text-right sm:block"><p className="max-w-32 truncate text-[11px] font-bold">{user.name}</p><p className="text-[9px] text-muted">Store owner</p></div>
                        <button type="button" onClick={signOut} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-muted hover:bg-rust-soft hover:text-rust"><Icon name="logout" size={15} /></button>
                    </div>
                </div>
                <nav aria-label="Store sections" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
                    {NAV.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${isActive ? 'bg-sage-dark text-white' : 'text-muted hover:bg-stone-100'}`}>
                            {item.label}{navCounts[item.countKey] > 0 && <span className="rounded-full bg-rust px-1.5 text-[9px] font-bold text-white">{navCounts[item.countKey]}</span>}
                        </NavLink>
                    ))}
                </nav>
            </header>

            <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1600px] lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="hidden border-r border-line bg-[#f6f4f0] px-3 py-6 lg:flex lg:flex-col">
                    <p className="flex items-center gap-2 px-3 text-[11px] font-semibold text-ink/75"><Icon name="pin" size={13} className="text-rust" />{store?.city || 'Your city'} store</p>
                    <p className="mb-2 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Workspace</p>
                    <nav className="space-y-1">{NAV.map((item) => <PortalNavLink key={item.to} {...item} count={navCounts[item.countKey]} />)}</nav>
                    <div className="mt-auto space-y-4">
                        <div className="rounded-lg bg-white px-3 py-3 text-[10.5px]">
                            <p className="flex items-center gap-2 font-bold text-muted"><Icon name="truck" size={13} className="text-sage" /> How it works</p>
                            <ol className="mt-2 space-y-1 text-ink/75"><li>1. Add items to cart</li><li>2. Mark packed</li><li>3. Ship to chef</li><li>4. Mark delivered</li></ol>
                        </div>
                        <button type="button" onClick={signOut} className="flex items-center gap-2 px-3 text-[11px] font-semibold text-muted hover:text-rust"><Icon name="logout" size={15} /> Log out</button>
                    </div>
                </aside>

                <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
                    <div className="mx-auto max-w-6xl">
                        {storeQuery.isLoading ? <div className="space-y-4"><div className="h-10 w-72 animate-pulse rounded bg-stone-100" /><div className="h-[480px] animate-pulse rounded-xl bg-stone-100" /></div>
                            : storeQuery.isError ? <Panel className="mx-auto max-w-xl p-8 text-center"><h1 className="font-serif text-2xl">Store unavailable</h1><p className="mt-2 text-[12px] text-muted">{errorMessage(storeQuery.error)}</p><button type="button" onClick={() => storeQuery.refetch()} className="mt-4 rounded-lg bg-sage-dark px-4 py-2 text-[11px] font-bold text-white">Try again</button></Panel>
                                : page}
                    </div>
                    <footer className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line py-4 text-[10px] text-muted"><span>© {new Date().getFullYear()} Chef Haazir · Grocery partner portal</span><Link to="/contact" className="hover:text-rust">Support desk</Link></footer>
                </main>
            </div>
        </div>
    )
}

export default GroceryOwnerDashboard