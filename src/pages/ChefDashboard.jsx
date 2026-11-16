import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { chefPhoto } from '../constants/images'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import { todayInPakistan, addDays, dateParts, slotLabel, SLOTS } from '../lib/time'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'

const NAV = [
    { to: '/chef', label: 'Overview', icon: 'sparkle', exact: true },
    { to: '/chef/requests', label: 'Requests', icon: 'bell' },
    { to: '/chef/bookings', label: 'Bookings', icon: 'calendar' },
    { to: '/chef/earnings', label: 'Earnings', icon: 'wallet' },
    { to: '/chef/profile', label: 'Profile', icon: 'user' }
]
const TOP_NAV = [
    { to: '/chef', label: 'Dashboard', exact: true },
    { to: '/chef/profile', label: 'My Menu & Specialties' },
    { to: '/chef/timings', label: 'Kitchen Timings' }
]
const statusLabels = {
    pending: ['Pending response', 'border-amber-200 bg-amber-50 text-amber-800'],
    confirmed: ['Confirmed', 'border-sage/20 bg-sage-soft text-sage-dark'],
    rejected: ['Declined', 'border-rust/20 bg-rust-soft text-rust'],
    expired: ['Expired', 'border-line bg-stone-100 text-muted'],
    cancelled: ['Cancelled', 'border-line bg-stone-100 text-muted'],
    completed: ['Completed', 'border-sage/20 bg-sage-soft text-sage-dark'],
    disputed: ['Under review', 'border-orange-200 bg-orange-50 text-orange-800']
}
const bookingFilters = [
    ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'],
    ['rejected', 'Declined'], ['expired', 'Expired'], ['cancelled', 'Cancelled'], ['disputed', 'Under review']
]
const money = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-PK')}`
const dateLabel = (value) => {
    if (!value) return 'Date pending'
    return new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' })
        .format(new Date(`${value}T12:00:00+05:00`))
}
const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'Chef'
const PortalNavLink = ({ to, label, icon, exact = false, count }) => (
    <NavLink to={to} end={exact} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-rust text-white shadow-sm' : 'text-ink/75 hover:bg-stone-100 hover:text-ink'}`}>
        {({ isActive }) => <><Icon name={icon} size={16} className={isActive ? 'text-white' : 'text-muted'} /><span className="flex-1">{label}</span>{count > 0 && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-ink/70'}`}>{count > 99 ? '99+' : count}</span>}</>}
    </NavLink>
)

const StatusPill = ({ status }) => {
    const [label, color] = statusLabels[status] || ['In progress', 'border-line bg-stone-100 text-muted']
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${color}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>
}

const SectionHeading = ({ eyebrow, title, text, action }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rust">{eyebrow}</p><h1 className="mt-1 font-serif text-[32px] font-semibold leading-tight tracking-tight sm:text-[38px]">{title}</h1>{text && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{text}</p>}</div>
        {action}
    </div>
)

const Panel = ({ children, className = '' }) => <section className={`rounded-xl border border-line bg-white shadow-card ${className}`}>{children}</section>

const ChefPreview = ({ profile }) => (
    <Panel className="overflow-hidden">
        <div className="relative h-48">
            <SafeImage src={chefPhoto(profile)} alt={`${profile.cuisines?.[0] || 'Home cooked'} meal`} className="h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold text-white ${profile.approvalStatus === 'approved' ? 'bg-sage-dark' : 'bg-rust'}`}>
                {profile.approvalStatus === 'approved' ? 'Approved chef' : 'Preview · not live yet'}
            </span>
            <div className="absolute bottom-3 left-4 right-4 text-white"><p className="truncate font-serif text-[24px] font-semibold">{profile.name}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/85"><Icon name="pin" size={12} /> {profile.city}</p></div>
        </div>
        <div className="p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-rust">Culinary focus</p>
            <p className="mt-1 text-[13px] leading-relaxed">{profile.cuisines?.join(', ') || 'Add your specialties'}</p>
            <p className="mt-2 text-[11px] text-muted">Serving customers across {profile.city}</p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Your cooking bio</p>
            <blockquote className="mt-1 rounded-lg bg-stone-50 p-3 font-serif text-[13px] italic leading-relaxed text-ink/80">{profile.bio ? `“${profile.bio}”` : 'Add a short bio so customers can get to know your cooking.'}</blockquote>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3"><span className="text-[10px] font-bold uppercase tracking-wide text-muted">Starting rate</span><span className="font-serif text-[20px] font-semibold text-rust">{money(profile.ratePerSlot)} <span className="font-sans text-[10px] font-normal text-muted">/ 2-hour slot</span></span></div>
            <Link to="/chef/profile" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-line bg-stone-50 px-3 py-2.5 text-[11px] font-semibold hover:border-sage/50"><Icon name="filter" size={14} /> Edit profile details</Link>
        </div>
    </Panel>
)

const Onboarding = ({ profile, queryClient }) => {
    const [otp, setOtp] = useState('')
    const [checks, setChecks] = useState({ contract: false, declaration: false })
    const otpMutation = useMutation({
        mutationFn: () => api.post('/chefs/me/verify-otp', { otp }),
        onSuccess: () => { setOtp(''); queryClient.invalidateQueries({ queryKey: ['chef-profile'] }) }
    })
    const contractMutation = useMutation({
        mutationFn: () => api.post('/chefs/me/contract', { acceptContract: true, acceptDeclaration: true }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chef-profile'] })
    })
    const currentStep = profile.approvalStatus === 'approved' ? 3 : !profile.phoneVerified ? 1 : !profile.contractAccepted ? 2 : 3
    const progress = profile.approvalStatus === 'approved' ? 100 : profile.phoneVerified ? profile.contractAccepted ? 75 : 55 : 25
    const approved = profile.approvalStatus === 'approved'

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rust/15 bg-orange-50 px-4 py-3 text-rust-dark">
                <div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rust text-white"><Icon name="question" size={16}/></span><div><p className="text-[13px] font-bold">{approved ? 'Your chef profile is live' : 'Action required before you can accept bookings'}</p><p className="mt-0.5 text-[11px] leading-relaxed">{approved ? 'Customers can now find your profile and send booking requests.' : 'Complete phone verification and accept the Chef Partner agreement. Our team reviews your profile after that.'}</p></div></div>
                <span className="hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-rust sm:block">{approved ? 'Active' : `Step ${currentStep} of 3`}</span>
            </div>

            <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-stone-50/80 px-5 py-5 sm:px-7">
                    <div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sage-dark">Onboarding journey</p><h2 className="mt-1 font-serif text-[25px] font-semibold leading-tight">Kitchen Onboarding &amp; Approval</h2></div>
                    <div className="flex items-center gap-3"><div className="text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Current status</p><p className="mt-0.5 text-[12px] font-bold text-rust">{approved ? 'Approved and live' : `Step ${currentStep} of 3 in progress`}</p></div><div className="relative h-11 w-11 rounded-full" style={{ background: `conic-gradient(#A3410F ${progress}%, #e7e2dc ${progress}% 100%)` }}><span className="absolute inset-[4px] flex items-center justify-center rounded-full bg-white text-[10px] font-bold">{progress}%</span></div></div>
                </div>

                <div className="space-y-7 p-5 sm:p-7">
                    <div className={`rounded-xl border p-4 sm:p-5 ${profile.phoneVerified ? 'border-sage/20 bg-sage-soft/35' : 'border-rust/15 bg-[#faf8f4]'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${profile.phoneVerified ? 'bg-sage-dark text-white' : 'bg-rust text-white'}`}>{profile.phoneVerified ? 'Complete' : 'Active step'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Verify your phone number</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">Enter the six-digit code sent by the Chef Haazir team to <strong className="text-ink">{profile.phone}</strong>.</p></div><span className="flex items-center gap-1 text-[10px] text-muted"><Icon name="phone" size={13}/> Code sent by support</span></div>
                        {profile.phoneVerified ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[12px] font-semibold text-sage-dark"><Icon name="checkCircle" size={16}/> Phone verified</p> : <form onSubmit={(event) => { event.preventDefault(); otpMutation.mutate() }} className="mt-4">
                            <label htmlFor="chef-otp" className="text-[11px] font-bold text-ink/80">6-digit verification code</label><input id="chef-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" className="mt-2 block w-full max-w-[260px] rounded-lg border border-line bg-white px-4 py-3 font-mono text-center text-[22px] font-bold tracking-[0.55em] outline-none focus:border-sage focus:ring-2 focus:ring-sage/15" />
                            {otpMutation.isError && <p role="alert" className="mt-2 text-[11px] text-rust">{errorMessage(otpMutation.error)}</p>}
                            <button type="submit" disabled={otp.length !== 6 || otpMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sage-dark px-4 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-50">{otpMutation.isPending ? 'Verifying…' : 'Verify phone'} <Icon name="arrowRight" size={14}/></button>
                            <p className="mt-3 text-[10px] leading-relaxed text-muted">Codes expire after 10 minutes. Need a new code or changed number? <Link to="/contact" className="font-semibold text-rust underline">Contact our team</Link>.</p>
                        </form>}
                    </div>

                    <div className={`rounded-xl border p-4 sm:p-5 ${profile.contractAccepted ? 'border-sage/20 bg-sage-soft/35' : profile.phoneVerified ? 'border-line bg-white' : 'border-line bg-stone-50/70 opacity-75'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${profile.contractAccepted ? 'bg-sage-soft text-sage-dark' : 'bg-stone-100 text-muted'}`}>{profile.contractAccepted ? 'Accepted' : 'Step 2'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Accept the Chef Partner agreement</h3><p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">Review our chef contract and confirm your responsibilities as a Chef Haazir partner.</p></div><Link to="/about#chef-contract" className="text-[10px] font-semibold text-rust underline">Read the agreement</Link></div>
                        {profile.contractAccepted ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[12px] font-semibold text-sage-dark"><Icon name="checkCircle" size={16}/> Agreement and declaration accepted</p> : <div className="mt-4">
                            <div className="space-y-3 rounded-lg border border-line bg-white p-4"><p className="text-[11px] font-bold">Chef Haazir partner commitments</p><p className="text-[11px] leading-relaxed text-muted">Set your own rate, accept the booking requests that suit you, cook in your own city, and communicate with customers through Chef Haazir.</p>
                                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed"><input type="checkbox" checked={checks.contract} onChange={(event) => setChecks({ ...checks, contract: event.target.checked })} disabled={!profile.phoneVerified} className="mt-0.5 accent-[#3E5D4D]"/><span>I agree to the Chef Haazir partner contract and service rules.</span></label>
                                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed"><input type="checkbox" checked={checks.declaration} onChange={(event) => setChecks({ ...checks, declaration: event.target.checked })} disabled={!profile.phoneVerified} className="mt-0.5 accent-[#3E5D4D]"/><span>I confirm that the verified phone number belongs to me and I am responsible for this chef account.</span></label>
                            </div>
                            {contractMutation.isError && <p role="alert" className="mt-2 text-[11px] text-rust">{errorMessage(contractMutation.error)}</p>}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-muted">{profile.phoneVerified ? 'Unlocked after phone verification' : 'Unlocks after phone verification'}</p><button type="button" disabled={!profile.phoneVerified || !checks.contract || !checks.declaration || contractMutation.isPending} onClick={() => contractMutation.mutate()} className="rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage disabled:bg-stone-200 disabled:text-muted">{contractMutation.isPending ? 'Saving…' : 'Accept agreement'}</button></div>
                        </div>}
                    </div>

                    <div className={`rounded-xl border p-4 sm:p-5 ${approved ? 'border-sage/20 bg-sage-soft/35' : 'border-line bg-white'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${approved ? 'bg-sage-dark text-white' : 'bg-stone-100 text-muted'}`}>{approved ? 'Approved' : 'Step 3'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Chef Haazir admin &amp; culinary approval</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">Our team reviews your kitchen details, phone verification and culinary profile before your listing goes live.</p></div><span className="flex items-center gap-1 text-[10px] text-muted"><Icon name="clock" size={13}/> Review by our team</span></div>
                        <div className={`mt-4 rounded-lg p-3.5 text-[11px] leading-relaxed ${approved ? 'bg-white text-sage-dark' : 'bg-orange-50 text-rust-dark'}`}><p className="font-bold">{approved ? 'Your profile is live' : profile.approvalStatus === 'rejected' ? 'The team needs to review your application' : profile.contractAccepted ? 'Agreement accepted · awaiting review' : 'Next: complete phone and contract steps'}</p><p className="mt-1">{approved ? 'Customers can now discover your kitchen and send booking requests.' : 'You will see your approval status here. If you need help, contact the partner support team.'}</p></div>
                    </div>
                </div>
            </Panel>
        </div>
    )
}

const BookingCard = ({ booking, onAction, busy }) => {
    const isPending = booking.status === 'pending'
    const canComplete = booking.status === 'confirmed' && booking.slotEnd && new Date(booking.slotEnd).getTime() <= Date.now()
    const canCancel = ['pending', 'confirmed'].includes(booking.status) && booking.slotStart && new Date(booking.slotStart).getTime() - Date.now() >= 90 * 60 * 1000
    const hasDeliveredGroceries = booking.status === 'cancelled' && booking.groceryStatus === 'delivered_to_chef'
    return (
        <article className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-[20px] font-semibold">{booking.customer?.name || 'Customer'}</h3><StatusPill status={booking.status}/></div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><Icon name="calendar" size={13}/>{dateLabel(booking.date)}</span><span>·</span><span>{slotLabel(booking.slot)}</span><span>·</span><span>{booking.address?.city}</span></p>
                    {booking.address?.street && <p className="mt-2 rounded-md bg-stone-50 px-3 py-2 text-[11px] text-ink/75"><Icon name="pin" size={12} className="mr-1 inline text-sage"/>{booking.address.street}</p>}
                    {booking.note && <p className="mt-2 text-[12px] leading-relaxed text-ink/80">“{booking.note}”</p>}
                    {(booking.groceryItems || []).length > 0 && <div className="mt-2 rounded-md bg-sage-soft/50 px-3 py-2 text-[11px]"><p className="font-bold text-sage-dark">Groceries · {booking.groceryStatus?.replaceAll('_', ' ')}</p><p className="mt-0.5 text-ink/75">{booking.groceryItems.map((item) => `${item.name} × ${item.quantity} ${item.unit}`).join(' · ')}</p></div>}
                </div>
                <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><div className="text-left sm:text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">{isPending ? 'Customer total' : 'Chef fee'}</p><p className="font-serif text-[22px] font-semibold">{money(isPending ? booking.totalFromCustomer : booking.chefRate)}</p><p className="text-[10px] text-muted">{isPending ? 'Cash after service' : '2-hour visit'}</p></div>
                    <div className="flex flex-wrap justify-end gap-2">{isPending && <><button type="button" disabled={busy} onClick={() => onAction(booking, 'accept')} className="rounded-lg bg-sage-dark px-3 py-2 text-[11px] font-bold text-white hover:bg-sage disabled:opacity-50">Accept</button><button type="button" disabled={busy} onClick={() => onAction(booking, 'reject')} className="rounded-lg border border-rust/25 px-3 py-2 text-[11px] font-bold text-rust hover:bg-rust-soft disabled:opacity-50">Decline</button></>}{canCancel && <button type="button" disabled={busy} onClick={() => onAction(booking, 'cancel')} className="rounded-lg border border-rust/25 px-3 py-2 text-[11px] font-bold text-rust hover:bg-rust-soft disabled:opacity-50">Cancel booking</button>}{canComplete && <button type="button" disabled={busy} onClick={() => onAction(booking, 'complete')} className="rounded-lg bg-sage-dark px-3 py-2 text-[11px] font-bold text-white hover:bg-sage disabled:opacity-50">Mark completed</button>}{hasDeliveredGroceries && <button type="button" disabled={busy} onClick={() => onAction(booking, 'grocery-return')} className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold hover:border-sage/50 disabled:opacity-50">Request grocery return</button>}</div>
                </div>
            </div>
        </article>
    )
}

const BookingWorkspace = ({ mode, pendingCount }) => {
    const queryClient = useQueryClient()
    const [status, setStatus] = useState(mode === 'requests' ? 'pending' : 'confirmed')
    const [notice, setNotice] = useState('')
    const listQuery = useQuery({
        queryKey: ['chef-bookings', status],
        queryFn: async () => (await api.get('/bookings/chef', { params: { status, page: 1, limit: 50 } })).data,
        refetchInterval: mode === 'requests' && status === 'pending' ? 20_000 : false
    })
    const actionMutation = useMutation({
        mutationFn: async ({ booking, action }) => {
            if (action === 'accept') return (await api.patch(`/bookings/${booking._id}/accept`)).data
            if (action === 'reject') return (await api.patch(`/bookings/${booking._id}/reject`)).data
            if (action === 'complete') return (await api.patch(`/bookings/${booking._id}/complete`)).data
            if (action === 'grocery-return') return (await api.patch(`/bookings/${booking._id}/grocery-return`)).data
            return (await api.patch(`/bookings/${booking._id}/cancel`, {})).data
        },
        onSuccess: (data) => {
            setNotice(data.message || 'Booking updated.')
            queryClient.invalidateQueries({ queryKey: ['chef-bookings'] })
            queryClient.invalidateQueries({ queryKey: ['chef-pending-count'] })
            queryClient.invalidateQueries({ queryKey: ['chef-earnings'] })
        },
        onError: (error) => setNotice(errorMessage(error))
    })
    const onAction = (booking, action) => {
        const message = action === 'accept' ? `Accept ${booking.customer?.name || 'this customer'}’s booking request?` : action === 'reject' ? 'Decline this booking request?' : action === 'cancel' ? 'Cancel this booking?' : action === 'complete' ? 'Mark this booking completed?' : 'Request that the grocery store take back the delivered items?'
        if (window.confirm(message)) actionMutation.mutate({ booking, action })
    }
    const label = mode === 'requests' ? 'Requests' : 'Bookings'
    const bookings = listQuery.data?.bookings || []

    return (
        <div>
            <SectionHeading eyebrow="Kitchen workspace" title={label} text={mode === 'requests' ? 'Review incoming requests and choose the bookings that suit your kitchen.' : 'Keep track of accepted visits and their latest status.'} action={mode === 'requests' && <span className="rounded-full bg-rust-soft px-3 py-1.5 text-[11px] font-bold text-rust">{pendingCount} waiting</span>} />
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{bookingFilters.map(([value, title]) => <button key={value} type="button" onClick={() => setStatus(value)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${status === value ? 'border-sage-dark bg-sage-dark text-white' : 'border-line bg-white text-ink/75 hover:border-sage/50'}`}>{title}{value === 'pending' && ` (${pendingCount})`}</button>)}</div>
            {notice && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-sage/20 bg-sage-soft px-4 py-3 text-[12px] text-sage-dark"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><Icon name="close" size={15}/></button></div>}
            {listQuery.isLoading ? <div className="mt-5 space-y-3">{[0,1,2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-stone-100"/>)}</div>
                : listQuery.isError ? <Panel className="mt-5 px-5 py-10 text-center"><p className="font-semibold">Bookings couldn’t be loaded</p><p className="mt-2 text-sm text-muted">{errorMessage(listQuery.error)}</p><button type="button" onClick={() => listQuery.refetch()} className="mt-4 rounded-lg bg-sage-dark px-4 py-2 text-[11px] font-bold text-white">Try again</button></Panel>
                    : bookings.length ? <div className="mt-5 space-y-3">{bookings.map((booking) => <BookingCard key={booking._id} booking={booking} onAction={onAction} busy={actionMutation.isPending}/>)}</div>
                        : <Panel className="mt-5 px-5 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-muted"><Icon name={status === 'pending' ? 'bell' : 'calendar'} size={21}/></span><h2 className="mt-4 font-serif text-2xl">No {status} bookings</h2><p className="mt-2 text-[12px] text-muted">New customer requests will appear here.</p></Panel>}
        </div>
    )
}

const Earnings = () => {
    const [method, setMethod] = useState('cash')
    const [transactionId, setTransactionId] = useState('')
    const [notice, setNotice] = useState('')
    const queryClient = useQueryClient()
    const earnings = useQuery({ queryKey: ['chef-earnings'], queryFn: async () => (await api.get('/chefs/me/earnings')).data })
    const settlements = useQuery({ queryKey: ['chef-settlements'], queryFn: async () => (await api.get('/settlements/mine')).data.settlements })
    const payout = earnings.data
    const settlementMutation = useMutation({
        mutationFn: async () => (await api.post('/settlements', { method, ...(method !== 'cash' ? { transactionId: transactionId.trim() } : {}) })).data,
        onSuccess: (data) => { setNotice(data.message); setTransactionId(''); queryClient.invalidateQueries({ queryKey: ['chef-earnings'] }); queryClient.invalidateQueries({ queryKey: ['chef-settlements'] }) },
        onError: (error) => setNotice(errorMessage(error))
    })
    const canSubmit = !!payout?.summary?.totalDue && !payout?.summary?.awaitingVerification && (method === 'cash' || transactionId.trim().length >= 6)

    return <div>
        <SectionHeading eyebrow="Payments" title="Earnings & settlements" text="See what is due to Chef Haazir and the payments waiting for review."/>
        {earnings.isLoading ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-stone-100"/> : earnings.isError ? <Panel className="mt-6 p-5 text-sm text-rust">{errorMessage(earnings.error)}</Panel> : <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Amount due</p><p className="mt-2 font-serif text-[30px] font-semibold text-rust">{money(payout.summary.totalDue)}</p></Panel><Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Bookings in balance</p><p className="mt-2 font-serif text-[30px] font-semibold">{payout.summary.payableBookings}</p></Panel><Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Payment review</p><p className="mt-2 text-[14px] font-semibold">{payout.summary.awaitingVerification ? 'Submitted · awaiting review' : 'No payment submitted'}</p></Panel></div>
            {payout.summary.paymentBlocked && <div className="mt-4 rounded-lg border border-rust/20 bg-rust-soft/60 p-4 text-[12px] text-rust-dark">Your account is temporarily blocked from accepting new requests because a payment is overdue. Submit your settlement or contact support.</div>}
            {notice && <p role="status" className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-[12px] text-sage-dark">{notice}</p>}
            <Panel className="mt-5 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-[22px] font-semibold">Submit a settlement</h2><p className="mt-1 text-[12px] text-muted">When your payment is due, tell us how you paid so our team can verify it.</p></div><Icon name="wallet" size={22} className="text-rust"/></div><div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]"><label className="text-[11px] font-bold">Payment method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage">{[['cash','Cash'],['jazzcash','JazzCash'],['easypaisa','Easypaisa'],['bank','Bank transfer']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>{method !== 'cash' && <label className="text-[11px] font-bold">Transaction ID<input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} maxLength={30} placeholder="Enter the payment reference" className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/></label>}</div><button type="button" onClick={() => settlementMutation.mutate()} disabled={!canSubmit || settlementMutation.isPending} className="mt-4 rounded-lg bg-sage-dark px-4 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-45">{settlementMutation.isPending ? 'Submitting…' : `Submit ${money(payout.summary.totalDue)} payment`}</button></Panel>
            <Panel className="mt-5 overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-serif text-[21px] font-semibold">Payable bookings</h2><p className="mt-1 text-[11px] text-muted">These balances are due after the 24-hour customer issue window.</p></div>{payout.payable.length ? <div className="divide-y divide-line">{payout.payable.map((row) => <div key={row._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[12px]"><span><strong>{dateLabel(row.date)}</strong><span className="ml-2 text-muted">{slotLabel(row.slot)} · {row.status}</span></span><span className="font-bold">{money(row.owed)}</span></div>)}</div> : <p className="px-5 py-8 text-center text-[12px] text-muted">Nothing is due right now.</p>}</Panel>
            <Panel className="mt-5 overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-serif text-[21px] font-semibold">Settlement history</h2></div>{settlements.isLoading ? <p className="p-5 text-[12px] text-muted">Loading history…</p> : settlements.isError ? <p className="p-5 text-[12px] text-rust">{errorMessage(settlements.error)}</p> : settlements.data?.length ? <div className="divide-y divide-line">{settlements.data.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[12px]"><span>{new Date(item.createdAt).toLocaleDateString('en-PK')} · {item.method}{item.transactionId ? ` · ${item.transactionId}` : ''}</span><span className="flex items-center gap-2 font-semibold">{money(item.amount)} <StatusPill status={item.status === 'verified' ? 'completed' : item.status === 'rejected' ? 'disputed' : 'pending'}/></span></div>)}</div> : <p className="px-5 py-8 text-center text-[12px] text-muted">No settlements submitted.</p>}</Panel>
        </>}
    </div>
}

const ProfileEditor = ({ profile, queryClient }) => {
    const [draft, setDraft] = useState(null)
    const [cuisineText, setCuisineText] = useState('')
    const [notice, setNotice] = useState('')
    useEffect(() => {
        if (!draft && profile) {
            setDraft({ city: profile.city, address: profile.address, cuisines: profile.cuisines || [], ratePerSlot: String(profile.ratePerSlot), bio: profile.bio || '' })
            setCuisineText((profile.cuisines || []).join(', '))
        }
    }, [profile, draft])
    const updateMutation = useMutation({
        mutationFn: (body) => api.patch('/chefs/me/profile', body),
        onSuccess: (response) => { setDraft({ ...draft, ...response.data.profile, ratePerSlot: String(response.data.profile.ratePerSlot) }); setCuisineText((response.data.profile.cuisines || []).join(', ')); setNotice(response.data.message); queryClient.invalidateQueries({ queryKey: ['chef-profile'] }); queryClient.invalidateQueries({ queryKey: ['chefs'] }) },
        onError: (error) => setNotice(errorMessage(error))
    })
    if (!draft) return <div className="h-72 animate-pulse rounded-xl bg-stone-100"/>
    const update = (key) => (event) => setDraft({ ...draft, [key]: event.target.value })
    const submit = (event) => {
        event.preventDefault()
        const parsedCuisines = cuisineText.split(',').map((item) => item.trim()).filter(Boolean)
        if (!parsedCuisines.length || parsedCuisines.length > 5) { setNotice('Enter between 1 and 5 comma-separated cuisines.'); return }
        updateMutation.mutate({ city: draft.city, address: draft.address.trim(), cuisines: parsedCuisines, ratePerSlot: Number(draft.ratePerSlot), bio: draft.bio.trim() })
    }
    return <div>
        <SectionHeading eyebrow="Your customer-facing listing" title="Profile & specialties" text="Keep your chef profile, cooking focus and rate up to date."/>
        <Panel className="mt-6 p-5 sm:p-7"><div className="flex flex-wrap items-center gap-4 border-b border-line pb-5"><SafeImage src={chefPhoto(profile)} alt="Food from your cuisine" className="h-20 w-20 rounded-xl"/><div><p className="font-serif text-[23px] font-semibold">{profile.name}</p><p className="mt-1 text-[12px] text-muted">{profile.email} · {profile.phone}</p><div className="mt-2"><StatusPill status={profile.approvalStatus === 'approved' ? 'completed' : profile.approvalStatus === 'rejected' ? 'disputed' : 'pending'}/></div></div></div>
            {notice && <p role="status" className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-[12px] text-sage-dark">{notice}</p>}
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-[11px] font-bold">Kitchen city<select value={draft.city} onChange={update('city')} className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage">{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
                <label className="text-[11px] font-bold">Rate per 2-hour slot<input required type="number" min={500} max={20000} step={100} value={draft.ratePerSlot} onChange={update('ratePerSlot')} className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/></label>
                <label className="text-[11px] font-bold sm:col-span-2">Kitchen address<textarea required minLength={10} maxLength={200} rows={2} value={draft.address} onChange={update('address')} className="mt-1.5 block w-full resize-y rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/></label>
                <label className="text-[11px] font-bold sm:col-span-2">Cuisines and specialties <span className="font-normal text-muted">(comma separated, up to 5)</span><input required value={cuisineText} onChange={(event) => setCuisineText(event.target.value)} list="chef-cuisine-options" className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/><datalist id="chef-cuisine-options">{cuisines.map((item) => <option key={item} value={item}/>)}</datalist></label>
                <label className="text-[11px] font-bold sm:col-span-2">Cooking bio<textarea required minLength={10} maxLength={300} rows={4} value={draft.bio} onChange={update('bio')} className="mt-1.5 block w-full resize-y rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/><span className="mt-1 block text-right text-[10px] font-normal text-muted">{draft.bio.length}/300</span></label>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="text-[10px] text-muted">Your phone is verified by our team. To change it, contact partner support.</p><button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-sage-dark px-5 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-50">{updateMutation.isPending ? 'Saving…' : 'Save profile changes'}</button></div>
            </form>
        </Panel>
    </div>
}

const KitchenTimings = ({ profile }) => {
    const today = todayInPakistan()
    const [date, setDate] = useState(today)
    const dates = useMemo(() => Array.from({ length: 8 }, (_, index) => addDays(today, index)), [today])
    const availability = useQuery({ queryKey: ['chef-timing-availability', profile.id, date], queryFn: async () => (await api.get(`/chefs/${profile.id}/availability`, { params: { date } })).data.slots, enabled: !!profile.id })
    if (!profile.id) return <div><SectionHeading eyebrow="Kitchen schedule" title="Kitchen timings" text="See which two-hour slots customers can request over the coming week."/><Panel className="mt-5 p-6 text-[12px] leading-relaxed text-muted">The chef availability calendar will appear after your backend deployment updates the profile response. Refresh this page once the backend is live.</Panel></div>
    return <div>
        <SectionHeading eyebrow="Kitchen schedule" title="Kitchen timings" text="See which two-hour slots customers can request over the coming week."/>
        <div className="mt-5 rounded-lg border border-sage/20 bg-sage-soft/50 p-4 text-[12px] leading-relaxed text-sage-dark"><strong>How availability works:</strong> the platform offers seven daily two-hour slots. Confirmed bookings reserve their slot; pending requests do not block it until you accept.</div>
        <Panel className="mt-5 p-5 sm:p-6"><div className="flex gap-2 overflow-x-auto pb-2">{dates.map((value, index) => { const parts = dateParts(value); const active = date === value; return <button key={value} type="button" onClick={() => setDate(value)} className={`flex w-[64px] shrink-0 flex-col items-center rounded-lg border px-2 py-2 ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line hover:border-sage/50'}`}><span className={`text-[9px] font-bold uppercase ${active ? 'text-white/70' : 'text-muted'}`}>{index === 0 ? 'Today' : parts.day}</span><span className="font-serif text-[19px] font-semibold">{parts.date}</span><span className={`text-[9px] ${active ? 'text-white/70' : 'text-muted'}`}>{parts.month}</span></button>})}</div>
            {availability.isLoading ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{SLOTS.map((slot) => <div key={slot} className="h-14 animate-pulse rounded-lg bg-stone-100"/>)}</div> : availability.isError ? <p className="mt-4 rounded-lg bg-rust-soft p-3 text-[12px] text-rust">{errorMessage(availability.error)} <button type="button" onClick={() => availability.refetch()} className="font-bold underline">Retry</button></p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{availability.data?.map((slot) => { const blocked = slot.status !== 'available'; const status = { available: 'Open for requests', booked: 'Confirmed booking', too_late: 'Booking window closed', too_far: 'Outside booking window' }[slot.status]; return <div key={slot.slot} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${slot.status === 'booked' ? 'border-rust/15 bg-rust-soft/40' : blocked ? 'border-line bg-stone-50 text-muted' : 'border-sage/20 bg-sage-soft/35'}`}><div><p className="text-[13px] font-bold">{slotLabel(slot.slot)}</p><p className="mt-0.5 text-[10px]">{status}</p></div><span className={`h-2.5 w-2.5 rounded-full ${slot.status === 'available' ? 'bg-sage' : slot.status === 'booked' ? 'bg-rust' : 'bg-stone-300'}`}/></div>})}</div>}
        </Panel>
    </div>
}

const Overview = ({ profile, queryClient, pendingCount, navigate }) => (
    <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="shield" size={14}/> {profile.city} partner kitchen</p><span className="rounded-lg bg-stone-100 px-3 py-2 text-[10px] text-muted">Account stage · <strong className="text-ink">{profile.approvalStatus === 'approved' ? 'Live' : profile.phoneVerified ? profile.contractAccepted ? '3 · Review' : '2 · Agreement' : '1 · Verification'}</strong></span></div>
        <h1 className="font-serif text-[40px] font-semibold leading-[1.04] tracking-tight sm:text-[52px]">Salaam, {firstName(profile.name)}</h1>
        <p className="mt-2 max-w-2xl font-serif text-[15px] leading-relaxed text-ink/75">Welcome to your Chef Haazir Kitchen Portal. Complete your verification steps to activate your culinary profile and start receiving booking requests.</p>
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
            <Onboarding profile={profile} queryClient={queryClient}/>
            <aside className="space-y-3"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-serif text-[17px]"><Icon name="eye" size={16}/> Customer view preview</h2><span className="rounded-full bg-rust-soft px-2.5 py-1 text-[9px] font-bold text-rust">{profile.approvalStatus === 'approved' ? 'Live' : 'Draft'}</span></div><p className="text-[11px] leading-relaxed text-muted">This is how your kitchen profile will appear to customers looking for a home chef.</p><ChefPreview profile={profile}/><div className="rounded-xl border border-line bg-stone-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Requests waiting</p><p className="mt-1 font-serif text-[25px] font-semibold">{pendingCount}</p><button type="button" onClick={() => navigate('/chef/requests')} className="mt-2 text-[11px] font-bold text-rust underline">Review requests</button></div></aside>
        </div>
        <div className="mt-7 flex flex-col gap-4 rounded-xl bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="chat" size={20}/></span><div><h2 className="font-serif text-[19px]">Need help setting up your kitchen?</h2><p className="mt-1 text-[11px] text-muted">Our partner team can help with verification, contracts and your profile.</p></div></div><Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage"><Icon name="chat" size={14}/> Contact partner support</Link></div>
    </div>
)

const ChefDashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, isLoading: authLoading, logout } = useAuth()
    const profileQuery = useQuery({ queryKey: ['chef-profile'], queryFn: async () => (await api.get('/chefs/me/profile')).data.profile, enabled: user?.role === 'chef', retry: false })
    const pendingQuery = useQuery({ queryKey: ['chef-pending-count'], queryFn: async () => (await api.get('/bookings/chef', { params: { status: 'pending', page: 1, limit: 1 } })).data.pagination.total, enabled: user?.role === 'chef', refetchInterval: 20_000 })
    const profile = profileQuery.data
    const pathname = location.pathname
    const current = pathname === '/chef' ? 'overview' : pathname.split('/')[2] || 'overview'

    if (authLoading) return <div className="min-h-screen bg-white p-8"><div className="h-9 w-64 animate-pulse rounded bg-stone-100"/></div>
    if (!user) return <Navigate to="/login?next=%2Fchef" replace/>
    if (user.role !== 'chef') return <Navigate to={user.role === 'user' ? '/my-bookings' : '/'} replace/>

    const page = current === 'requests' || current === 'bookings' ? <BookingWorkspace mode={current} pendingCount={pendingQuery.data || 0}/> : current === 'earnings' ? <Earnings/> : current === 'profile' ? profile && <ProfileEditor profile={profile} queryClient={queryClient}/> : current === 'timings' ? profile && <KitchenTimings profile={profile}/> : profile && <Overview profile={profile} queryClient={queryClient} pendingCount={pendingQuery.data || 0} navigate={navigate}/>

    return (
        <div className="min-h-screen bg-[#fbfaf8] text-ink">
            <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-7">
                    <Link to="/chef" className="flex min-w-[205px] flex-col border-r border-line pr-5 leading-none"><span className="font-serif text-[22px] font-semibold tracking-tight text-rust">skillet <span className="text-ink">Chef Haazir</span></span><span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-muted">Chef portal / Apna kitchen</span></Link>
                    <div className="hidden items-center gap-5 xl:flex">{TOP_NAV.map((item) => <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `text-[11px] font-semibold ${isActive ? 'text-rust' : 'text-ink/70 hover:text-ink'}`}>{item.label}</NavLink>)}</div>
                    <div className="flex items-center gap-2 sm:gap-3"><span className={`hidden rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide sm:inline-flex ${profile?.approvalStatus === 'approved' ? 'bg-sage-soft text-sage-dark' : 'bg-orange-100 text-rust'}`}>{profile?.approvalStatus === 'approved' ? 'Approved chef' : 'Account under setup'}</span><Link to="/contact" className="hidden items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-[10px] font-semibold sm:flex"><Icon name="chat" size={13}/> Help & Concierge</Link><Link to="/chef/requests" aria-label={`${pendingQuery.data || 0} requests`} className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"><Icon name="bell" size={17}/>{pendingQuery.data > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rust ring-2 ring-white"/>}</Link><div className="hidden text-right sm:block"><p className="max-w-28 truncate text-[10px] font-bold">{profile?.name || user.name}</p><p className="text-[9px] text-muted">Partner chef</p></div><button type="button" onClick={() => { logout(); navigate('/') }} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-muted hover:bg-rust-soft hover:text-rust"><Icon name="logout" size={15}/></button></div>
                </div>
                <div className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">{TOP_NAV.map((item) => <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold ${isActive ? 'bg-sage-dark text-white' : 'text-muted hover:bg-stone-100'}`}>{item.label}</NavLink>)}</div>
            </header>

            <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1600px] lg:grid-cols-[218px_minmax(0,1fr)]">
                <aside className="hidden border-r border-line bg-[#f6f4f0] px-3 py-6 lg:flex lg:flex-col">
                    <p className="flex items-center gap-2 px-3 text-[10px] font-semibold text-ink/75"><Icon name="pin" size={13} className="text-rust"/>{profile?.city || 'Your city'} kitchen hub</p>
                    <p className="mb-2 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Workspace menu</p>
                    <nav className="space-y-1">{NAV.map((item) => <PortalNavLink key={item.to} {...item} count={item.label === 'Requests' ? pendingQuery.data : 0}/>)}</nav>
                    <div className="mt-auto space-y-4"><div className="rounded-lg bg-white px-3 py-3"><p className="flex items-center gap-2 text-[10px] font-bold text-muted"><Icon name="shield" size={13} className="text-sage"/> Profile verification</p><p className="mt-1 text-[10px]">{profile?.phoneVerified ? 'Phone verified' : 'In progress'}</p><div className="my-2 h-px bg-line"/><p className="flex items-center gap-2 text-[10px] font-bold text-muted"><Icon name="store" size={13} className="text-sage"/> Kitchen hub</p><p className="mt-1 text-[10px]">{profile?.city || 'Loading city'}</p></div><button type="button" onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 px-3 text-[11px] font-semibold text-muted hover:text-rust"><Icon name="logout" size={15}/> Log out</button></div>
                </aside>

                <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
                    {profileQuery.isLoading ? <div className="mx-auto max-w-6xl space-y-4"><div className="h-10 w-72 animate-pulse rounded bg-stone-100"/><div className="h-[520px] animate-pulse rounded-xl bg-stone-100"/></div>
                        : profileQuery.isError ? <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-8 text-center"><h1 className="font-serif text-2xl">Chef profile unavailable</h1><p className="mt-2 text-[12px] text-muted">{errorMessage(profileQuery.error)}</p><button type="button" onClick={() => profileQuery.refetch()} className="mt-4 rounded-lg bg-sage-dark px-4 py-2 text-[11px] font-bold text-white">Try again</button></div>
                            : <div className="mx-auto max-w-6xl">{page}</div>}
                    <footer className="mx-auto mt-9 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line py-4 text-[9px] text-muted"><span>© {new Date().getFullYear()} Chef Haazir · Lahore, Pakistan</span><div className="flex flex-wrap gap-4"><Link to="/about#chef-contract" className="hover:text-rust">Chef partner code</Link><Link to="/about" className="hover:text-rust">Food hygiene standards</Link><Link to="/contact" className="hover:text-rust">Support desk</Link></div></footer>
                </main>
            </div>
        </div>
    )
}

export default ChefDashboard
