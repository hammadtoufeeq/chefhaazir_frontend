import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { chefPhoto, images } from '../constants/images'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import { todayInPakistan, addDays, dateParts, slotLabel, SLOTS } from '../lib/time'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import ChefNotificationsBell from '../components/ChefNotificationsBell'
import Contact from './Contact'

const NAV = [
    { to: '/chef', label: 'Overview', icon: 'sparkle', exact: true },
    { to: '/chef/timings', label: 'Kitchen Timings', icon: 'calendar' },
    { to: '/chef/bookings', label: 'Bookings', icon: 'calendar' },
    { to: '/chef/earnings', label: 'Earnings', icon: 'wallet' },
    { to: '/chef/profile', label: 'Profile', icon: 'user' }
]
const TOP_NAV = [
    { to: '/chef', label: 'Dashboard', exact: true },
    { to: '/chef/profile', label: 'My Menu & Specialties' }
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
    ['pending', 'Pending'],
    ['confirmed', 'Confirmed'],
    ['completed', 'Completed'],
    ['cancelled_by_customer', 'Cancelled by Customer'],
    ['cancelled_by_chef', 'Cancelled by Chef'],
    ['rejected', 'Declined'],
    ['expired', 'Expired'],
    ['disputed', 'Under review']
]
const money = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-PK')}`
const fetchChefDashboard = async () => (await api.get('/chefs/me/dashboard')).data
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

const DashboardSections = ({ active }) => (
    <nav aria-label="Chef dashboard sections" className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
        {[
            ['overview', '/chef', 'Overview'],
            ['timings', '/chef/timings', 'Kitchen Timings'],
            ['bookings', '/chef/bookings', 'Bookings']
        ].map(([key, to, label]) => <Link key={key} to={to} aria-current={active === key ? 'page' : undefined} className={`shrink-0 rounded-lg px-4 py-2 text-[11px] font-semibold transition ${active === key ? 'bg-white text-rust shadow-sm' : 'text-ink/70 hover:text-ink'}`}>{label}</Link>)}
    </nav>
)

const Panel = ({ children, className = '' }) => <section className={`rounded-xl border border-line bg-white shadow-card ${className}`}>{children}</section>

const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0)
    const current = useRef(0)
    useEffect(() => {
        const target = Number(value) || 0
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            current.current = target
            setDisplayValue(target)
            return
        }
        const startValue = current.current
        const startedAt = performance.now()
        const duration = 850
        let frame
        const animate = (now) => {
            const progress = Math.min((now - startedAt) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const next = Math.round(startValue + (target - startValue) * eased)
            current.current = next
            setDisplayValue(next)
            if (progress < 1) frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [value])
    return <>{displayValue.toLocaleString('en-PK')}</>
}

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
    const otpIsActive = profile.otpExpiresAt && new Date(profile.otpExpiresAt).getTime() > Date.now()
    const requestIsPending = profile.otpRequestedAt && Date.now() - new Date(profile.otpRequestedAt).getTime() < 5 * 60 * 1000
    const requestMutation = useMutation({
        mutationFn: () => api.post('/chefs/me/request-otp'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chef-profile'] }),
        onError: () => queryClient.invalidateQueries({ queryKey: ['chef-profile'] })
    })
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
                <div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rust text-white"><Icon name="question" size={16} /></span><div><p className="text-[13px] font-bold">{approved ? 'Your chef profile is live' : 'Action required before you can accept bookings'}</p><p className="mt-0.5 text-[11px] leading-relaxed">{approved ? 'Customers can now find your profile and send booking requests.' : 'Complete phone verification and accept the Chef Partner agreement. Our team reviews your profile after that.'}</p></div></div>
                <span className="hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-rust sm:block">{approved ? 'Active' : `Step ${currentStep} of 3`}</span>
            </div>

            <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-stone-50/80 px-5 py-5 sm:px-7">
                    <div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sage-dark">Onboarding journey</p><h2 className="mt-1 font-serif text-[25px] font-semibold leading-tight">Kitchen Onboarding &amp; Approval</h2></div>
                    <div className="flex items-center gap-3"><div className="text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Current status</p><p className="mt-0.5 text-[12px] font-bold text-rust">{approved ? 'Approved and live' : `Step ${currentStep} of 3 in progress`}</p></div><div className="relative h-11 w-11 rounded-full" style={{ background: `conic-gradient(#A3410F ${progress}%, #e7e2dc ${progress}% 100%)` }}><span className="absolute inset-[4px] flex items-center justify-center rounded-full bg-white text-[10px] font-bold">{progress}%</span></div></div>
                </div>

                <div className="space-y-7 p-5 sm:p-7">
                    <div className={`rounded-xl border p-4 sm:p-5 ${profile.phoneVerified ? 'border-sage/20 bg-sage-soft/35' : 'border-rust/15 bg-[#faf8f4]'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${profile.phoneVerified ? 'bg-sage-dark text-white' : 'bg-rust text-white'}`}>{profile.phoneVerified ? 'Complete' : 'Active step'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Verify your phone number</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">Enter the six-digit code sent by the Chef Haazir team to <strong className="text-ink">{profile.phone}</strong>.</p></div><span className="flex items-center gap-1 text-[10px] text-muted"><Icon name="phone" size={13} /> Code sent by support</span></div>
                        {profile.phoneVerified ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[12px] font-semibold text-sage-dark"><Icon name="checkCircle" size={16} /> Phone verified</p> : otpIsActive ? <form onSubmit={(event) => { event.preventDefault(); otpMutation.mutate() }} className="mt-4">
                            <p className="mb-3 rounded-lg bg-sage-soft/60 px-3 py-2.5 text-[11px] text-sage-dark">The admin generated a code for your phone. Enter the 6-digit code they sent you. It expires at {new Date(profile.otpExpiresAt).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}.</p>
                            <label htmlFor="chef-otp" className="text-[11px] font-bold text-ink/80">6-digit verification code</label><input id="chef-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" className="mt-2 block w-full max-w-[260px] rounded-lg border border-line bg-white px-4 py-3 font-sans text-center text-[22px] font-bold tracking-[0.55em] outline-none focus:border-sage focus:ring-2 focus:ring-sage/15" />
                            {otpMutation.isError && <p role="alert" className="mt-2 text-[11px] text-rust">{errorMessage(otpMutation.error)}</p>}
                            <button type="submit" disabled={otp.length !== 6 || otpMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sage-dark px-4 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-50">{otpMutation.isPending ? 'Verifying…' : 'Verify phone'} <Icon name="arrowRight" size={14} /></button>
                            <p className="mt-3 text-[10px] leading-relaxed text-muted">Code expires 10 minutes after it is generated. If you don’t receive it, contact the partner team.</p>
                        </form> : <div className="mt-4">
                            {requestIsPending ? <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"><Icon name="clock" size={15} className="mt-0.5 shrink-0" /><span>Your request was sent to the admin team at {new Date(profile.otpRequestedAt).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}. They’ll generate and send your code. You can request again after 5 minutes if it hasn’t arrived.</span></div> : <><p className="text-[11px] leading-relaxed text-muted">Ask the admin team to generate a one-time code for <strong className="text-ink">{profile.phone}</strong>. They’ll send it to you so you can verify your number.</p><button type="button" disabled={requestMutation.isPending} onClick={() => requestMutation.mutate()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rust px-4 py-2.5 text-[12px] font-bold text-white hover:bg-rust-dark disabled:opacity-50">{requestMutation.isPending ? 'Sending request…' : 'Request OTP from admin'} <Icon name="arrowRight" size={14} /></button></>}
                            {requestMutation.isError && <p role="alert" className="mt-2 text-[11px] text-rust">{errorMessage(requestMutation.error)}</p>}
                        </div>}
                    </div>

                    <div className={`rounded-xl border p-4 sm:p-5 ${profile.contractAccepted ? 'border-sage/20 bg-sage-soft/35' : profile.phoneVerified ? 'border-line bg-white' : 'border-line bg-stone-50/70 opacity-75'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${profile.contractAccepted ? 'bg-sage-soft text-sage-dark' : 'bg-stone-100 text-muted'}`}>{profile.contractAccepted ? 'Accepted' : 'Step 2'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Accept the Chef Partner agreement</h3><p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">Review our chef contract and confirm your responsibilities as a Chef Haazir partner.</p></div><Link to="/about#chef-contract" className="text-[10px] font-semibold text-rust underline">Read the agreement</Link></div>
                        {profile.contractAccepted ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[12px] font-semibold text-sage-dark"><Icon name="checkCircle" size={16} /> Agreement and declaration accepted</p> : <div className="mt-4">
                            <div className="space-y-3 rounded-lg border border-line bg-white p-4"><p className="text-[11px] font-bold">Chef Haazir partner commitments</p><p className="text-[11px] leading-relaxed text-muted">Set your own rate, accept the booking requests that suit you, cook in your own city, and communicate with customers through Chef Haazir.</p>
                                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed"><input type="checkbox" checked={checks.contract} onChange={(event) => setChecks({ ...checks, contract: event.target.checked })} disabled={!profile.phoneVerified} className="mt-0.5 accent-[#3E5D4D]" /><span>I agree to the Chef Haazir partner contract and service rules.</span></label>
                                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed"><input type="checkbox" checked={checks.declaration} onChange={(event) => setChecks({ ...checks, declaration: event.target.checked })} disabled={!profile.phoneVerified} className="mt-0.5 accent-[#3E5D4D]" /><span>I confirm that the verified phone number belongs to me and I am responsible for this chef account.</span></label>
                            </div>
                            {contractMutation.isError && <p role="alert" className="mt-2 text-[11px] text-rust">{errorMessage(contractMutation.error)}</p>}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-muted">{profile.phoneVerified ? 'Unlocked after phone verification' : 'Unlocks after phone verification'}</p><button type="button" disabled={!profile.phoneVerified || !checks.contract || !checks.declaration || contractMutation.isPending} onClick={() => contractMutation.mutate()} className="rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage disabled:bg-stone-200 disabled:text-muted">{contractMutation.isPending ? 'Saving…' : 'Accept agreement'}</button></div>
                        </div>}
                    </div>

                    <div className={`rounded-xl border p-4 sm:p-5 ${approved ? 'border-sage/20 bg-sage-soft/35' : 'border-line bg-white'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${approved ? 'bg-sage-dark text-white' : 'bg-stone-100 text-muted'}`}>{approved ? 'Approved' : 'Step 3'}</span><h3 className="mt-3 font-serif text-[21px] font-semibold">Chef Haazir admin &amp; culinary approval</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">Our team reviews your kitchen details, phone verification and culinary profile before your listing goes live.</p></div><span className="flex items-center gap-1 text-[10px] text-muted"><Icon name="clock" size={13} /> Review by our team</span></div>
                        <div className={`mt-4 rounded-lg p-3.5 text-[11px] leading-relaxed ${approved ? 'bg-white text-sage-dark' : 'bg-orange-50 text-rust-dark'}`}><p className="font-bold">{approved ? 'Your profile is live' : profile.approvalStatus === 'rejected' ? 'The team needs to review your application' : profile.contractAccepted ? 'Agreement accepted · awaiting review' : 'Next: complete phone and contract steps'}</p><p className="mt-1">{approved ? 'Customers can now discover your kitchen and send booking requests.' : 'You will see your approval status here. If you need help, contact the partner support team.'}</p></div>
                    </div>
                </div>
            </Panel>
        </div>
    )
}

// Where the booking's groceries are: Ordered -> Packed -> On the way -> Delivered, plus the store's contact
const GROCERY_STEPS = [['ordered', 'Ordered'], ['packed', 'Packed'], ['out_for_delivery', 'On the way'], ['delivered_to_chef', 'Delivered']]
const GROCERY_STEP_LABELS = {
    ordered: 'Ordered & Packing',
    packed: 'Packed & Ready',
    out_for_delivery: 'On the way to Chef',
    delivered_to_chef: 'Delivered to Chef',
    return_requested: 'Return requested',
    return_verified: 'Return verified',
    cancelled: 'Cancelled'
}
const groceryMessages = {
    ordered: 'The store has your order and is packing it.',
    packed: 'Packed at the store, leaving soon.',
    out_for_delivery: 'On the way to your home now.',
    delivered_to_chef: 'Delivered. Take them along to the customer.',
    return_requested: 'Return requested. Send the groceries back to the store.',
    return_verified: 'The store received your returned groceries.',
    cancelled: 'Grocery order cancelled with the booking.'
}

const GroceryStatusModal = ({ booking, onClose }) => {
    if (!booking) return null
    const status = booking.groceryStatus || 'ordered'
    const reached = GROCERY_STEPS.findIndex(([key]) => key === status)
    const done = ['return_requested', 'return_verified'].includes(status) ? 3 : reached
    const store = booking.groceryStore && typeof booking.groceryStore === 'object' ? booking.groceryStore : null
    const storePhone = store?.owner?.phone
    const digits = (storePhone || '').replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits
    const items = booking.groceryItems || []

    const badgeStyle = {
        ordered: 'border-amber-200 bg-amber-50 text-amber-800',
        packed: 'border-blue-200 bg-blue-50 text-blue-800',
        out_for_delivery: 'border-purple-200 bg-purple-50 text-purple-800',
        delivered_to_chef: 'border-sage/20 bg-sage-soft text-sage-dark',
        return_requested: 'border-orange-200 bg-orange-50 text-orange-800',
        return_verified: 'border-stone-200 bg-stone-100 text-muted',
        cancelled: 'border-line bg-stone-100 text-muted'
    }[status] || 'border-line bg-stone-100 text-muted'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs" onClick={onClose}>
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lift sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="grocery-modal-title">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-line pb-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage-dark">
                            <Icon name="truck" size={20} />
                        </span>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rust">Order groceries tracking</p>
                            <h2 id="grocery-modal-title" className="font-serif text-[22px] font-semibold leading-tight">
                                Grocery Status for {booking.customer?.name || 'Customer'}
                            </h2>
                            <p className="mt-0.5 text-[11px] text-muted">
                                {dateLabel(booking.date)} · {slotLabel(booking.slot)}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-stone-100 hover:text-ink">
                        <Icon name="close" size={16} />
                    </button>
                </div>

                {/* Status Hero Card */}
                <div className="mt-4 rounded-xl border border-line bg-stone-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Current status</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeStyle}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {GROCERY_STEP_LABELS[status] || status}
                        </span>
                    </div>
                    <p className="mt-2 text-[12px] font-medium text-ink/80">
                        {groceryMessages[status] || 'Grocery order is being processed.'}
                    </p>
                </div>

                {/* Step Progress Tracker */}
                {status !== 'cancelled' && (
                    <div className="mt-4 rounded-xl border border-line p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Delivery Progress</p>
                        <ol className="mt-3 grid grid-cols-4 gap-1">
                            {GROCERY_STEPS.map(([key, label], i) => (
                                <li key={key} className="min-w-0">
                                    <div className="flex items-center">
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${i <= done ? 'bg-sage-dark text-white' : 'border border-line bg-white text-muted'}`}>
                                            {i < done ? '✓' : i + 1}
                                        </span>
                                        {i < 3 && <span className={`mx-1 h-0.5 flex-1 rounded ${i < done ? 'bg-sage-dark' : 'bg-line'}`} />}
                                    </div>
                                    <p className={`mt-1.5 truncate text-[10px] font-semibold ${i <= done ? 'text-ink' : 'text-muted'}`}>{label}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Store Partner Information */}
                {store && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-stone-50/60 p-4 text-[12px]">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Fulfilling Store</p>
                            <p className="font-semibold text-ink">{store.name} <span className="font-normal text-muted">({store.city})</span></p>
                            {storePhone && <p className="text-[11px] text-muted">Contact: {storePhone}</p>}
                        </div>
                        {storePhone && (
                            <div className="flex gap-2">
                                <a href={`tel:+${intl}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink hover:border-sage">
                                    <Icon name="phone" size={13} /> Call
                                </a>
                                <a href={`https://wa.me/${intl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-sage-dark hover:border-sage">
                                    <Icon name="chat" size={13} /> WhatsApp
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Items Breakdown */}
                <div className="mt-4 rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Ordered Items ({items.length})</p>
                        <span className="text-[11px] font-bold text-rust">{money(booking.grocerySubtotal)}</span>
                    </div>
                    {items.length > 0 ? (
                        <ul className="mt-2 divide-y divide-line/60">
                            {items.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-between py-2 text-[11.5px]">
                                    <span className="text-ink/80">{item.name}</span>
                                    <span className="font-semibold text-ink">
                                        {item.quantity} {item.unit} {item.lineTotal ? `· ${money(item.lineTotal)}` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-[11px] text-muted">No itemized list found for this booking.</p>
                    )}
                </div>

                {/* Close Button */}
                <div className="mt-5 flex justify-end">
                    <button type="button" onClick={onClose} className="rounded-lg bg-sage-dark px-4 py-2 text-[11px] font-bold text-white hover:bg-sage">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

const GroceryTracker = ({ booking }) => {
    const status = booking.groceryStatus
    const reached = GROCERY_STEPS.findIndex(([key]) => key === status)
    const done = ['return_requested', 'return_verified'].includes(status) ? 3 : reached
    const store = booking.groceryStore && typeof booking.groceryStore === 'object' ? booking.groceryStore : null
    const storePhone = store?.owner?.phone
    const digits = (storePhone || '').replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits
    return (
        <div className="mt-2 rounded-lg border border-sage/20 bg-sage-soft/40 px-3 py-3 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-bold text-sage-dark"><Icon name="truck" size={14} /> Groceries · {money(booking.grocerySubtotal)}</p>
                {store && <p className="text-[10px] text-muted">From {store.name}</p>}
            </div>
            {status !== 'cancelled' && (
                <ol className="mt-2.5 grid grid-cols-4 gap-1">
                    {GROCERY_STEPS.map(([key, label], i) => (
                        <li key={key} className="min-w-0">
                            <div className="flex items-center"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i <= done ? 'bg-sage-dark' : 'bg-white ring-2 ring-line'}`} />{i < 3 && <span className={`mx-1 h-0.5 flex-1 rounded ${i < done ? 'bg-sage-dark' : 'bg-line'}`} />}</div>
                            <p className={`mt-1 truncate text-[10px] font-semibold ${i <= done ? 'text-ink' : 'text-muted'}`}>{label}</p>
                        </li>
                    ))}
                </ol>
            )}
            <p className="mt-2 text-ink/80">{groceryMessages[status] || ''}</p>
            <p className="mt-1.5 text-ink/65">{booking.groceryItems.map((item) => `${item.name} × ${item.quantity} ${item.unit}`).join(' · ')}</p>
            {storePhone && ['ordered', 'packed', 'out_for_delivery', 'return_requested'].includes(status) && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                    <a href={`tel:+${intl}`} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[10px] font-bold hover:border-sage/50"><Icon name="phone" size={12} /> Call store</a>
                    <a href={`https://wa.me/${intl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[10px] font-bold hover:border-sage/50"><Icon name="chat" size={12} /> WhatsApp store</a>
                </div>
            )}
        </div>
    )
}

const BookingCard = ({ booking, onAction, busy, targetBookingId }) => {
    const [showGroceryModal, setShowGroceryModal] = useState(false)
    const isPending = booking.status === 'pending'
    const canComplete = booking.status === 'confirmed' && booking.slotEnd && new Date(booking.slotEnd).getTime() <= Date.now()
    const canCancel = ['pending', 'confirmed'].includes(booking.status) && booking.slotStart && new Date(booking.slotStart).getTime() - Date.now() >= 90 * 60 * 1000
    const hasDeliveredGroceries = booking.status === 'cancelled' && booking.groceryStatus === 'delivered_to_chef'
    const hasGroceries = (booking.groceryItems || []).length > 0 || (booking.groceryStatus && booking.groceryStatus !== 'none')
    const isTarget = targetBookingId && targetBookingId === booking._id

    return (
        <>
            <article id={`booking-${booking._id}`} className={`rounded-xl border bg-white p-4 shadow-card sm:p-5 transition-all ${isTarget ? 'border-rust ring-2 ring-rust/50 shadow-lift' : 'border-line'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-[20px] font-semibold">{booking.customer?.name || 'Customer'}</h3>
                            <StatusPill status={booking.status} />
                            {hasGroceries && (
                                <button
                                    type="button"
                                    onClick={() => setShowGroceryModal(true)}
                                    className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage-soft/70 px-2.5 py-0.5 text-[10px] font-bold text-sage-dark hover:bg-sage hover:text-white transition"
                                    title="Click to view full grocery delivery status"
                                >
                                    <Icon name="basket" size={12} /> Groceries: {GROCERY_STEP_LABELS[booking.groceryStatus] || booking.groceryStatus}
                                </button>
                            )}
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><Icon name="calendar" size={13} />{dateLabel(booking.date)}</span><span>·</span><span>{slotLabel(booking.slot)}</span><span>·</span><span>{booking.address?.city}</span></p>
                        {booking.address?.street && <p className="mt-2 rounded-md bg-stone-50 px-3 py-2 text-[11px] text-ink/75"><Icon name="pin" size={12} className="mr-1 inline text-sage" />{booking.address.street}</p>}
                        {booking.note && <div className="mt-2 rounded-md bg-stone-50 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Customer’s menu request</p><p className="mt-1 text-[12px] leading-relaxed text-ink/80">“{booking.note}”</p></div>}
                        {hasGroceries && (
                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sage/20 bg-sage-soft/30 px-3 py-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <Icon name="truck" size={14} className="text-sage-dark" />
                                    <span className="font-semibold text-sage-dark">Groceries ({booking.groceryItems?.length || 0} items · {money(booking.grocerySubtotal)}):</span>
                                    <span className="font-medium text-ink/80">{GROCERY_STEP_LABELS[booking.groceryStatus] || booking.groceryStatus}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGroceryModal(true)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rust hover:underline"
                                >
                                    View grocery status →
                                </button>
                            </div>
                        )}
                        {booking.status === 'completed' && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-sage/20 bg-sage-soft/40 px-3 py-2 text-[11px]"><span>Admin commission: <strong className="text-rust">{money(booking.commissionAmount)}</strong></span><span>Total payable to platform: <strong>{money(booking.payableToPlatform)}</strong></span><span>You keep from chef fee: <strong className="text-sage-dark">{money(booking.chefRate - booking.commissionAmount)}</strong></span></div>}
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><div className="text-left sm:text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">{isPending ? 'Customer total' : 'Chef fee'}</p><p className="font-serif text-[22px] font-semibold">{money(isPending ? booking.totalFromCustomer : booking.chefRate)}</p><p className="text-[10px] text-muted">{isPending ? 'Cash after service' : '2-hour visit'}</p></div>
                        <div className="flex flex-wrap justify-end gap-2">
                            {hasGroceries && (
                                <button
                                    type="button"
                                    onClick={() => setShowGroceryModal(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sage/40 bg-sage-soft/60 px-3 py-2 text-[11px] font-bold text-sage-dark hover:bg-sage hover:text-white transition shadow-xs"
                                    title="Check grocery delivery status for this order"
                                >
                                    <Icon name="truck" size={13} />
                                    Grocery Status
                                </button>
                            )}
                            {isPending && <><button type="button" disabled={busy} onClick={() => onAction(booking, 'accept')} className="rounded-lg bg-sage-dark px-3 py-2 text-[11px] font-bold text-white hover:bg-sage disabled:opacity-50">Accept</button><button type="button" disabled={busy} onClick={() => onAction(booking, 'reject')} className="rounded-lg border border-rust/25 px-3 py-2 text-[11px] font-bold text-rust hover:bg-rust-soft disabled:opacity-50">Decline</button></>}{canCancel && <button type="button" disabled={busy} onClick={() => onAction(booking, 'cancel')} className="rounded-lg border border-rust/25 px-3 py-2 text-[11px] font-bold text-rust hover:bg-rust-soft disabled:opacity-50">Cancel booking</button>}{canComplete && <button type="button" disabled={busy} onClick={() => onAction(booking, 'complete')} className="rounded-lg bg-sage-dark px-3 py-2 text-[11px] font-bold text-white hover:bg-sage disabled:opacity-50">Mark completed</button>}{hasDeliveredGroceries && <button type="button" disabled={busy} onClick={() => onAction(booking, 'grocery-return')} className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold hover:border-sage/50 disabled:opacity-50">Request grocery return</button>}
                        </div>
                    </div>
                </div>
            </article>
            {showGroceryModal && <GroceryStatusModal booking={booking} onClose={() => setShowGroceryModal(false)} />}
        </>
    )
}

const BookingWorkspace = ({ mode, pendingCount }) => {
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()

    const targetBookingId = searchParams.get('bookingId')
    const urlStatus = searchParams.get('status')
    const openGrocery = searchParams.get('openGrocery') === 'true'

    const [selectedGroceryBooking, setSelectedGroceryBooking] = useState(null)
    const [status, setStatus] = useState(urlStatus || (mode === 'requests' ? 'pending' : 'confirmed'))
    const [notice, setNotice] = useState('')
    const [confirmAction, setConfirmAction] = useState(null)

    // Scroll to the specific booking when it loads
    useEffect(() => {
        if (!targetBookingId) return
        const timer = setTimeout(() => {
            const el = document.getElementById(`booking-${targetBookingId}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
        return () => clearTimeout(timer)
    }, [targetBookingId, status])

    const listQuery = useQuery({
        queryKey: ['chef-bookings', status],
        queryFn: async () => {
            const apiStatus = ['cancelled_by_customer', 'cancelled_by_chef'].includes(status) ? 'cancelled' : status
            const res = await api.get('/bookings/chef', { params: { status: apiStatus, page: 1, limit: 50 } })
            let fetchedBookings = res.data.bookings || []

            if (status === 'cancelled_by_customer') {
                fetchedBookings = fetchedBookings.filter(b => b.cancelledBy === 'user')
            } else if (status === 'cancelled_by_chef') {
                fetchedBookings = fetchedBookings.filter(b => b.cancelledBy === 'chef')
            }

            return { ...res.data, bookings: fetchedBookings }
        },
        refetchInterval: status === 'pending' ? 15_000 : 30_000,
        refetchOnWindowFocus: true
    })
    const bookings = listQuery.data?.bookings || []

    useEffect(() => {
        if (!targetBookingId || !openGrocery) return
        const found = bookings.find((b) => b._id === targetBookingId)
        if (found) {
            setSelectedGroceryBooking(found)
        } else {
            api.get(`/bookings/${targetBookingId}`)
                .then((res) => { if (res.data?.booking) setSelectedGroceryBooking(res.data.booking) })
                .catch(() => { })
        }
    }, [targetBookingId, openGrocery, bookings])

    const closeGroceryModal = () => {
        setSelectedGroceryBooking(null)
        if (searchParams.get('openGrocery')) {
            const next = new URLSearchParams(searchParams)
            next.delete('openGrocery')
            next.delete('bookingId')
            setSearchParams(next, { replace: true })
        }
    }
    const actionMutation = useMutation({
        mutationFn: async ({ booking, action }) => {
            if (action === 'accept') return (await api.patch(`/bookings/${booking._id}/accept`)).data
            if (action === 'reject') return (await api.patch(`/bookings/${booking._id}/reject`)).data
            if (action === 'complete') return (await api.patch(`/bookings/${booking._id}/complete`)).data
            if (action === 'grocery-return') return (await api.patch(`/bookings/${booking._id}/grocery-return`)).data
            return (await api.patch(`/bookings/${booking._id}/cancel`, {})).data
        },
        onSuccess: (data) => {
            setNotice(data.finances ? `${data.message}. Admin commission: ${money(data.finances.commission)}; total payable to platform: ${money(data.finances.totalDueToPlatform)}.` : data.message || 'Booking updated.')
            queryClient.invalidateQueries({ queryKey: ['chef-bookings'] })
            queryClient.invalidateQueries({ queryKey: ['chef-dashboard-analytics'] })
            queryClient.invalidateQueries({ queryKey: ['chef-earnings'] })
        },
        onError: (error) => setNotice(errorMessage(error))
    })
    const onAction = (booking, action) => setConfirmAction({ booking, action })
    const confirmCopy = confirmAction ? {
        accept: [`Accept ${confirmAction.booking.customer?.name || 'this customer'}’s request?`, 'The customer will see the booking as confirmed. Other pending requests for this same slot will be declined.', 'Accept request'],
        reject: ['Decline this request?', 'The customer will see that you declined the booking.', 'Decline request'],
        cancel: ['Cancel this booking?', 'The customer will be notified that the booking was cancelled.', 'Cancel booking'],
        complete: ['Mark this booking completed?', `This makes the balance due immediately. Admin commission: ${money(confirmAction.booking.commissionAmount)}; total payable to the platform, including groceries and delivery: ${money(confirmAction.booking.payableToPlatform)}.`, 'Mark completed'],
        'grocery-return': ['Request a grocery return?', 'The store will be asked to verify the groceries returned from this cancelled booking.', 'Request return']
    }[confirmAction.action] : null
    const label = mode === 'requests' ? 'Requests' : 'Bookings'

    return (
        <>
            <div>
                <DashboardSections active="bookings" />
                <SectionHeading eyebrow="Kitchen workspace" title={label} text={mode === 'requests' ? 'Review incoming requests and choose the bookings that suit your kitchen.' : 'Keep track of accepted visits and their latest status.'} action={mode === 'requests' && <span className="rounded-full bg-rust-soft px-3 py-1.5 text-[11px] font-bold text-rust">{pendingCount} waiting</span>} />
                <div className="mt-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-stone-100 p-1.5 shadow-inner">
                    {bookingFilters.map(([value, title]) => {
                        const isActive = status === value
                        const isPending = value === 'pending'

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setStatus(value)}
                                className={`shrink-0 rounded-lg px-4 py-2 text-[11px] font-bold transition-all duration-200 ${isActive
                                        ? 'bg-sage-dark text-white shadow-md'
                                        : 'text-ink/60 hover:bg-white/60 hover:text-ink'
                                    }`}
                            >
                                {title}
                                {isPending && (
                                    <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-ink/70'
                                        }`}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
                {notice && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-sage/20 bg-sage-soft px-4 py-3 text-[12px] text-sage-dark"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><Icon name="close" size={15} /></button></div>}
                {listQuery.isLoading ? <div className="mt-5 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-stone-100" />)}</div>
                    : listQuery.isError ? <Panel className="mt-5 px-5 py-10 text-center"><p className="font-semibold">Bookings couldn’t be loaded</p><p className="mt-2 text-sm text-muted">{errorMessage(listQuery.error)}</p><button type="button" onClick={() => listQuery.refetch()} className="mt-4 rounded-lg bg-sage-dark px-4 py-2 text-[11px] font-bold text-white">Try again</button></Panel>
                        : bookings.length ? <div className="mt-5 space-y-3">{bookings.map((booking) => <BookingCard key={booking._id} booking={booking} onAction={onAction} busy={actionMutation.isPending} targetBookingId={targetBookingId} />)}</div>
                            : <Panel className="mt-5 px-5 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-muted"><Icon name={status === 'pending' ? 'bell' : 'calendar'} size={21} /></span><h2 className="mt-4 font-serif text-2xl">No {status.replaceAll('_', ' ')} bookings</h2><p className="mt-2 text-[12px] text-muted">New customer requests will appear here.</p></Panel>}
            </div>
            {selectedGroceryBooking && <GroceryStatusModal booking={selectedGroceryBooking} onClose={closeGroceryModal} />}
            <ConfirmDialog
                open={!!confirmAction}
                title={confirmCopy?.[0]}
                description={confirmCopy?.[1]}
                confirmLabel={confirmCopy?.[2]}
                tone={['reject', 'cancel'].includes(confirmAction?.action) ? 'danger' : 'sage'}
                busy={actionMutation.isPending}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => confirmAction && actionMutation.mutate(confirmAction, { onSettled: () => setConfirmAction(null) })}
            />
        </>
    )
}

const Earnings = () => {
    const [copied, setCopied] = useState(false)
    const [transactionId, setTransactionId] = useState('')
    const [notice, setNotice] = useState('')
    const queryClient = useQueryClient()
    const earnings = useQuery({ queryKey: ['chef-earnings'], queryFn: async () => (await api.get('/chefs/me/earnings')).data })
    const settlements = useQuery({ queryKey: ['chef-settlements'], queryFn: async () => (await api.get('/settlements/mine')).data.settlements ?? [] })
    const payout = earnings.data
    const settlementMutation = useMutation({
        mutationFn: async () => (await api.post('/settlements', { method: 'sadapay', transactionId: transactionId.trim() })).data,
        onSuccess: (data) => { setNotice(data.message); setTransactionId(''); queryClient.invalidateQueries({ queryKey: ['chef-earnings'] }); queryClient.invalidateQueries({ queryKey: ['chef-settlements'] }) },
        onError: (error) => setNotice(errorMessage(error))
    })
    const canSubmit = !!payout?.summary?.totalDue && !payout?.summary?.awaitingVerification && transactionId.trim().length >= 6
    const copyAccountNumber = async () => {
        try {
            await navigator.clipboard.writeText('0300-0000000')
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
        } catch {
            setNotice('Copy is unavailable in this browser. Please copy the SadaPay number manually.')
        }
    }

    return <div>
        <SectionHeading eyebrow="Payments" title="Earnings & settlements" text="See what is due to Chef Haazir and the payments waiting for review." />
        {earnings.isLoading ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-stone-100" /> : earnings.isError ? <Panel className="mt-6 p-5 text-sm text-rust">{errorMessage(earnings.error)}</Panel> : <>

            {/* NEW: Total Lifetime Earnings Panel */}
            <Panel className="mt-6 overflow-hidden border-sage/30 bg-gradient-to-r from-sage-soft/50 to-white p-6 sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-sage-dark">Total Lifetime Earnings</p>
                        <p className="mt-2 font-serif text-[42px] font-semibold leading-none text-ink">
                            {money(payout.summary.totalEarnings || 0)}
                        </p>
                        <p className="mt-2 text-[12px] text-muted">
                            Your total payout from all completed bookings (after platform commission).
                        </p>
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-dark text-white shadow-sm">
                        <Icon name="wallet" size={26} />
                    </div>
                </div>
            </Panel>

            {/* Existing top row panels */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Due to platform</p><p className="mt-2 font-serif text-[28px] font-semibold text-rust">{money(payout.summary.totalDue)}</p><p className="mt-1 text-[10px] text-muted">Includes completed bookings and eligible grocery balances</p></Panel>
                <Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Completed bookings · unpaid</p><p className="mt-2 font-serif text-[28px] font-semibold">{payout.summary.completedUnsettledBookings || 0}</p><p className="mt-1 text-[10px] text-muted">{money(payout.summary.completedUnsettledTotal)} total payable</p></Panel>
                <Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Payment review</p><p className="mt-2 text-[14px] font-semibold">{payout.summary.awaitingVerification ? 'Submitted · awaiting review' : 'No payment submitted'}</p></Panel>
            </div>

            {payout.summary.paymentBlocked && <div className="mt-4 rounded-lg border border-rust/20 bg-rust-soft/60 p-4 text-[12px] text-rust-dark">Your account is temporarily blocked from accepting new requests because a payment is overdue. Submit your settlement or contact support.</div>}
            {notice && <p role="status" className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-[12px] text-sage-dark">{notice}</p>}
            <Panel className="mt-5 overflow-hidden"><div className="flex items-start gap-3 border-b border-line bg-stone-50 px-5 py-4"><Icon name="wallet" size={22} className="mt-0.5 text-rust" /><div><h2 className="font-serif text-[22px] font-semibold">Pay Chef Haazir via SadaPay</h2><p className="mt-1 text-[12px] text-muted">Transfer the due amount, then enter the transaction reference below.</p></div></div><div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6"><div className="rounded-xl border border-sage/20 bg-sage-soft/30 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sage-dark">SadaPay recipient · demo details</p><p className="mt-2 font-serif text-[19px] font-semibold">Chef Haazir Admin (Demo)</p><p className="mt-1 text-[10px] text-muted">Placeholder account · replace with the real admin account before launch</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-sage-dark">SadaPay</span></div><div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-3"><span className="font-mono text-[16px] font-bold tracking-wide">0300-0000000</span><button type="button" onClick={copyAccountNumber} className="rounded-md border border-line px-3 py-2 text-[10px] font-bold transition hover:border-sage hover:text-sage-dark">{copied ? 'Copied!' : 'Copy number'}</button></div></div><div className="flex flex-col justify-between gap-4"><label className="text-[11px] font-bold">SadaPay transaction ID<input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} maxLength={30} placeholder="Enter the transfer reference" className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage" /><span className="mt-1 block text-[10px] font-normal text-muted">Use the reference shown in your SadaPay transfer receipt.</span></label><button type="button" onClick={() => settlementMutation.mutate()} disabled={!canSubmit || settlementMutation.isPending} className="rounded-lg bg-sage-dark px-4 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-45">{settlementMutation.isPending ? 'Submitting…' : `Submit ${money(payout.summary.totalDue)} payment`}</button></div></div></Panel>
            <Panel className="mt-5 overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-serif text-[21px] font-semibold">Completed bookings · commission ledger</h2><p className="mt-1 text-[11px] text-muted">Balances become due as soon as an order is marked completed. Confirmed orders auto-complete 24 hours after the slot ends.</p></div>{payout.recentBookings?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[11px]"><thead className="bg-stone-50 text-[9px] uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Booking</th><th className="px-3 py-3">Chef fee</th><th className="px-3 py-3">Groceries + delivery</th><th className="px-3 py-3">Admin commission</th><th className="px-5 py-3 text-right">Total to platform</th></tr></thead><tbody className="divide-y divide-line">{payout.recentBookings.map((row) => <tr key={row.id}><td className="px-5 py-3"><strong>{dateLabel(row.date)}</strong><span className="ml-2 text-muted">{slotLabel(row.slot)}</span></td><td className="px-3 py-3">{money(row.chefFee)}</td><td className="px-3 py-3">{money((row.groceries || 0) + (row.delivery || 0))}</td><td className="px-3 py-3 font-semibold text-rust">{money(row.commission)}</td><td className="px-5 py-3 text-right font-bold">{money(row.payToPlatform)}</td></tr>)}</tbody></table></div> : <p className="px-5 py-8 text-center text-[12px] text-muted">Completed orders and their admin commission will appear here.</p>}</Panel>
            <Panel className="mt-5 overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-serif text-[21px] font-semibold">Due balances</h2><p className="mt-1 text-[11px] text-muted">Completed orders are due immediately. Cancelled grocery balances remain pending through the 24-hour customer issue window.</p></div>{payout.payable.length ? <div className="divide-y divide-line">{payout.payable.map((row) => <div key={row._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[12px]"><span><strong>{dateLabel(row.date)}</strong><span className="ml-2 text-muted">{slotLabel(row.slot)} · {row.status}</span><span className="ml-3 text-rust">Commission {money(row.commissionAmount)}</span></span><span className="font-bold">{money(row.owed)}</span></div>)}</div> : <p className="px-5 py-8 text-center text-[12px] text-muted">Nothing is due right now.</p>}</Panel>
            <Panel className="mt-5 overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-serif text-[21px] font-semibold">Settlement history</h2></div>{settlements.isLoading ? <p className="p-5 text-[12px] text-muted">Loading history…</p> : settlements.isError ? <p className="p-5 text-[12px] text-rust">{errorMessage(settlements.error)}</p> : settlements.data?.length ? <div className="divide-y divide-line">{settlements.data.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[12px]"><span>{new Date(item.createdAt).toLocaleDateString('en-PK')} · {{ sadapay: 'SadaPay', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', bank: 'Bank transfer', cash: 'Cash (legacy)' }[item.method] || item.method}{item.transactionId ? ` · ${item.transactionId}` : ''}</span><span className="flex items-center gap-2 font-semibold">{money(item.amount)} <StatusPill status={item.status === 'verified' ? 'completed' : item.status === 'rejected' ? 'disputed' : 'pending'} /></span></div>)}</div> : <p className="px-5 py-8 text-center text-[12px] text-muted">No settlements submitted.</p>}</Panel>
        </>}
    </div>
}

const ProfileEditor = ({ profile, queryClient }) => {
    const [draft, setDraft] = useState(null)
    const [cuisineChoice, setCuisineChoice] = useState('')
    const [customCuisine, setCustomCuisine] = useState('')
    const [notice, setNotice] = useState('')
    useEffect(() => {
        if (!draft && profile) {
            setDraft({ city: profile.city, address: profile.address, cuisines: profile.cuisines || [], ratePerSlot: String(profile.ratePerSlot), bio: profile.bio || '' })
        }
    }, [profile, draft])
    const updateMutation = useMutation({
        mutationFn: (body) => api.patch('/chefs/me/profile', body),
        onSuccess: (response) => { setDraft({ ...draft, ...response.data.profile, ratePerSlot: String(response.data.profile.ratePerSlot) }); setNotice(response.data.message); queryClient.invalidateQueries({ queryKey: ['chef-profile'] }); queryClient.invalidateQueries({ queryKey: ['chefs'] }) },
        onError: (error) => setNotice(errorMessage(error))
    })
    if (!draft) return <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
    const update = (key) => (event) => setDraft({ ...draft, [key]: event.target.value })
    const addCuisine = () => {
        const value = cuisineChoice === 'Other' ? customCuisine.trim() : cuisineChoice
        if (!value || value.length < 2 || value.length > 40) { setNotice('Choose a cuisine or enter a name between 2 and 40 characters.'); return }
        if (draft.cuisines.some((item) => item.toLowerCase() === value.toLowerCase())) { setNotice('That cuisine is already selected.'); return }
        if (draft.cuisines.length >= 5) { setNotice('You can add up to 5 cuisines.'); return }
        setDraft({ ...draft, cuisines: [...draft.cuisines, value] })
        setCuisineChoice('')
        setCustomCuisine('')
        setNotice('')
    }
    const removeCuisine = (value) => setDraft({ ...draft, cuisines: draft.cuisines.filter((item) => item !== value) })
    const submit = (event) => {
        event.preventDefault()
        if (!draft.cuisines.length || draft.cuisines.length > 5) { setNotice('Choose between 1 and 5 cuisines from the list.'); return }
        updateMutation.mutate({ city: draft.city, address: draft.address.trim(), cuisines: draft.cuisines, ratePerSlot: Number(draft.ratePerSlot), bio: draft.bio.trim() })
    }
    return <div>
        <SectionHeading eyebrow="Your customer-facing listing" title="Profile & specialties" text="Keep your chef profile, cooking focus and rate up to date." />
        <Panel className="mt-6 p-5 sm:p-7"><div className="flex flex-wrap items-center gap-4 border-b border-line pb-5"><SafeImage src={chefPhoto(profile)} alt="Food from your cuisine" className="h-20 w-20 rounded-xl" /><div><p className="font-serif text-[23px] font-semibold">{profile.name}</p><p className="mt-1 text-[12px] text-muted">{profile.email} · {profile.phone}</p><div className="mt-2"><StatusPill status={profile.approvalStatus === 'approved' ? 'completed' : profile.approvalStatus === 'rejected' ? 'disputed' : 'pending'} /></div></div></div>
            {notice && <p role="status" className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-[12px] text-sage-dark">{notice}</p>}
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-[11px] font-bold">Kitchen city<select value={draft.city} onChange={update('city')} className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage">{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
                <label className="text-[11px] font-bold">Rate per 2-hour slot<input required type="number" min={500} max={20000} step={100} value={draft.ratePerSlot} onChange={update('ratePerSlot')} className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage" /></label>
                <label className="text-[11px] font-bold sm:col-span-2">Kitchen address<textarea required minLength={10} maxLength={200} rows={2} value={draft.address} onChange={update('address')} className="mt-1.5 block w-full resize-y rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage" /></label>
                <div className="sm:col-span-2"><div className="flex items-center justify-between"><p className="text-[11px] font-bold">Cuisines and specialties <span className="font-normal text-muted">(choose up to 5)</span></p><span className="text-[10px] text-muted">{draft.cuisines.length}/5 selected</span></div><div className="mt-2 flex flex-wrap gap-2">{draft.cuisines.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-1.5 text-[11px] font-semibold text-sage-dark">{item}<button type="button" onClick={() => removeCuisine(item)} aria-label={`Remove ${item}`} className="font-bold hover:text-rust">×</button></span>)}{!draft.cuisines.length && <span className="text-[11px] text-muted">No cuisines selected yet.</span>}</div><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="grid gap-2 sm:grid-cols-2"><select aria-label="Choose a cuisine or specialty" value={cuisineChoice} onChange={(event) => setCuisineChoice(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] outline-none focus:border-sage"><option value="">Choose a cuisine or specialty</option>{cuisines.map((item) => <option key={item} value={item}>{item}</option>)}<option value="Other">Other · add your own</option></select>{cuisineChoice === 'Other' && <input value={customCuisine} onChange={(event) => setCustomCuisine(event.target.value)} maxLength={40} placeholder="Type another cuisine" className="w-full rounded-lg border border-line px-3 py-2.5 text-[12px] outline-none focus:border-sage" />}</div><button type="button" onClick={addCuisine} disabled={draft.cuisines.length >= 5} className="rounded-lg border border-line px-4 py-2.5 text-[11px] font-bold hover:border-sage/50 disabled:opacity-50">Add cuisine</button></div><p className="mt-1.5 text-[10px] text-muted">Select from the dropdown or choose Other to add a cuisine that is not listed.</p></div>
                <label className="text-[11px] font-bold sm:col-span-2">Cooking bio<textarea required minLength={10} maxLength={300} rows={4} value={draft.bio} onChange={update('bio')} className="mt-1.5 block w-full resize-y rounded-lg border border-line px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage" /><span className="mt-1 block text-right text-[10px] font-normal text-muted">{draft.bio.length}/300</span></label>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="text-[10px] text-muted">Your phone is verified by our team. To change it, contact partner support.</p><button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-sage-dark px-5 py-2.5 text-[12px] font-bold text-white hover:bg-sage disabled:opacity-50">{updateMutation.isPending ? 'Saving…' : 'Save profile changes'}</button></div>
            </form>
        </Panel>
    </div>
}

const KitchenTimings = ({ profile }) => {
    const today = todayInPakistan()
    const [date, setDate] = useState(today)
    const dates = useMemo(() => Array.from({ length: 8 }, (_, index) => addDays(today, index)), [today])
    const availability = useQuery({ queryKey: ['chef-timing-availability', profile.id, date], queryFn: async () => (await api.get(`/chefs/${profile.id}/availability`, { params: { date } })).data.slots ?? [], enabled: !!profile.id })
    const queryClient = useQueryClient()
    const [notice, setNotice] = useState('')
    const saveAvailability = useMutation({
        mutationFn: (unavailableSlots) => api.patch('/chefs/me/availability', { date, unavailableSlots }),
        onSuccess: (response) => {
            setNotice(response.data.message)
            queryClient.invalidateQueries({ queryKey: ['chef-timing-availability', profile.id, date] })
            queryClient.invalidateQueries({ queryKey: ['availability'] })
            queryClient.invalidateQueries({ queryKey: ['chefs'] })
        },
        onError: (error) => setNotice(errorMessage(error))
    })
    const toggleUnavailable = (slotName) => {
        const slots = availability.data || []
        const busySlots = slots.filter((item) => item.status === 'chef_unavailable').map((item) => item.slot)
        const next = busySlots.includes(slotName) ? busySlots.filter((item) => item !== slotName) : [...busySlots, slotName]
        saveAvailability.mutate([...new Set(next)])
    }
    if (!profile.id) return <div><DashboardSections active="timings" /><SectionHeading eyebrow="Kitchen schedule" title="Kitchen timings" text="See which two-hour slots customers can request over the coming week." /><Panel className="mt-5 p-6 text-[12px] leading-relaxed text-muted">The chef availability calendar will appear after your backend deployment updates the profile response.</Panel></div>
    return <div>
        <DashboardSections active="timings" />
        <SectionHeading eyebrow="Availability" title="Chef schedule" text="Choose the days and 2-hour slots when customers can book you." />
        <div className="mt-5 rounded-lg border border-sage/20 bg-sage-soft/50 p-4 text-[12px] leading-relaxed text-sage-dark"><strong>Set your availability:</strong> select an open slot to mark yourself busy. Customers will no longer be able to request it. Confirmed bookings and active requests can’t be blocked until they’re resolved.</div>
        {notice && <div role="status" className="mt-4 rounded-lg bg-stone-100 px-4 py-3 text-[12px]">{notice}</div>}
        <Panel className="mt-5 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2 overflow-x-auto pb-2">{dates.map((value, index) => { const parts = dateParts(value); const active = date === value; return <button key={value} type="button" onClick={() => { setDate(value); setNotice('') }} className={`flex w-[64px] shrink-0 flex-col items-center rounded-lg border px-2 py-2 ${active ? 'border-sage-dark bg-sage-dark text-white' : 'border-line hover:border-sage/50'}`}><span className={`text-[9px] font-bold uppercase ${active ? 'text-white/70' : 'text-muted'}`}>{index === 0 ? 'Today' : parts.day}</span><span className="font-serif text-[19px] font-semibold">{parts.date}</span><span className={`text-[9px] ${active ? 'text-white/70' : 'text-muted'}`}>{parts.month}</span></button> })}</div><button type="button" disabled={!availability.data || saveAvailability.isPending} onClick={() => saveAvailability.mutate(availability.data.every((slot) => slot.status === 'chef_unavailable') ? [] : SLOTS)} className="rounded-lg border border-line px-3 py-2 text-[10px] font-bold hover:border-rust/40 disabled:opacity-50">{availability.data?.every((slot) => slot.status === 'chef_unavailable') ? 'Open full day' : 'Mark full day busy'}</button></div>
            {availability.isLoading ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{SLOTS.map((slot) => <div key={slot} className="h-14 animate-pulse rounded-lg bg-stone-100" />)}</div> : availability.isError ? <p className="mt-4 rounded-lg bg-rust-soft p-3 text-[12px] text-rust">{errorMessage(availability.error)} <button type="button" onClick={() => availability.refetch()} className="font-bold underline">Retry</button></p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{availability.data?.map((slot) => { const busy = slot.status === 'chef_unavailable'; const editable = ['available', 'chef_unavailable'].includes(slot.status); const status = { available: 'Available for booking', chef_unavailable: 'You marked busy · click to reopen', booked: 'Confirmed booking', too_late: 'Booking window closed', too_far: 'Outside booking window' }[slot.status]; return <button key={slot.slot} type="button" disabled={!editable || saveAvailability.isPending} onClick={() => toggleUnavailable(slot.slot)} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed ${busy ? 'border-rust/20 bg-rust-soft/50 text-rust' : slot.status === 'available' ? 'border-sage/20 bg-sage-soft/35 hover:border-sage' : 'border-line bg-stone-50 text-muted'}`}><span><span className="block text-[13px] font-bold">{slotLabel(slot.slot)}</span><span className="mt-0.5 block text-[10px]">{status}</span></span><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${busy ? 'bg-rust text-white' : slot.status === 'available' ? 'bg-white text-sage-dark' : 'bg-stone-200'}`}>{busy ? 'Busy' : slot.status === 'available' ? 'Open' : 'Unavailable'}</span></button> })}</div>}
            {saveAvailability.isPending && <p className="mt-4 text-[11px] text-muted">Saving schedule…</p>}
        </Panel>
    </div>
}

const LiveChefOverview = ({ profile, pendingCount }) => {
    const [selectedGroceryBooking, setSelectedGroceryBooking] = useState(null)
    const confirmed = useQuery({ queryKey: ['chef-bookings', 'confirmed'], queryFn: async () => (await api.get('/bookings/chef', { params: { status: 'confirmed', page: 1, limit: 5 } })).data, refetchInterval: 30_000, refetchOnWindowFocus: true })
    const completed = useQuery({ queryKey: ['chef-bookings', 'completed'], queryFn: async () => (await api.get('/bookings/chef', { params: { status: 'completed', page: 1, limit: 1 } })).data, refetchInterval: 30_000, refetchOnWindowFocus: true })
    const earnings = useQuery({ queryKey: ['chef-earnings'], queryFn: async () => (await api.get('/chefs/me/earnings')).data, refetchInterval: 30_000 })
    const grocery = useQuery({ queryKey: ['grocery', 'chef-overview', profile.city], queryFn: async () => (await api.get('/grocery/items', { params: { city: profile.city, page: 1, limit: 4 } })).data, enabled: !!profile.city })
    const items = grocery.data?.items || []
    const activeBookings = confirmed.data?.bookings || []
    return <div className="space-y-7">
        {earnings.data?.summary?.paymentBlocked && <div className="flex flex-col gap-4 rounded-xl border border-rust/15 bg-[#f4e5da] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rust text-white"><Icon name="wallet" size={19} /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-rust">Action required · Account hold</p><h2 className="mt-1 font-serif text-[21px]">Your account is paused for an overdue commission</h2><p className="mt-1 text-[12px] text-ink/75">Platform commission of <strong>{money(earnings.data.summary.totalDue)}</strong> is pending.</p></div></div><Link to="/chef/earnings" className="shrink-0 rounded-lg bg-rust px-5 py-3 text-center text-[12px] font-bold text-white">View earnings</Link></div>}
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="store" size={14} /> Chef Haazir · Partner Kitchen</p><h1 className="mt-2 font-serif text-[34px] font-semibold leading-tight sm:text-[42px]">{profile.name} <span className="text-rust">Kitchen</span></h1><p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted"><Icon name="pin" size={13} />{profile.city} <span>·</span><span>{profile.cuisines?.join(' · ') || 'Home chef'}</span><span>·</span><span className="font-semibold text-sage-dark">Verified chef · accepting requests</span></p></div><div className="flex gap-1 rounded-xl bg-stone-100 p-1"><Link to="/chef" className="rounded-lg bg-white px-4 py-2 text-[11px] font-bold text-rust shadow-sm">Overview</Link><Link to="/chef/bookings?status=pending" className="rounded-lg px-4 py-2 text-[11px] font-semibold">Requests <span className="ml-1 rounded-full bg-rust px-1.5 py-0.5 text-[9px] text-white">{pendingCount}</span></Link><Link to="/chef/bookings" className="rounded-lg px-4 py-2 text-[11px] font-semibold">Bookings</Link></div></div>
        <Panel className="flex flex-col gap-4 border-sage/20 bg-sage-soft/35 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="checkCircle" size={20} /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sage-dark">Kitchen verification complete</p><h2 className="mt-1 font-serif text-xl">Your chef profile is live</h2><p className="mt-1 text-[11px] text-muted">Customers can find your kitchen and send booking requests. New requests update here automatically.</p></div></div><Link to="/chef/profile" className="shrink-0 rounded-lg border border-line bg-white px-4 py-2.5 text-[11px] font-bold">Manage profile</Link></Panel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Panel className="p-5"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">New requests</p><div className="mt-3 flex items-end justify-between"><p className="font-serif text-[30px] font-semibold">{pendingCount}</p><Icon name="bell" size={20} className="text-rust" /></div><Link to="/chef/bookings?status=pending" className="mt-2 inline-block text-[10px] font-bold text-rust">Review requests →</Link></Panel><Panel className="p-5"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Active bookings</p><div className="mt-3 flex items-end justify-between"><p className="font-serif text-[30px] font-semibold">{confirmed.data?.pagination?.total ?? '—'}</p><Icon name="calendar" size={20} className="text-sage" /></div><Link to="/chef/bookings" className="mt-2 inline-block text-[10px] font-bold text-rust">View schedule →</Link></Panel><Panel className="p-5"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Completed visits</p><div className="mt-3 flex items-end justify-between"><p className="font-serif text-[30px] font-semibold">{completed.data?.pagination?.total ?? '—'}</p><Icon name="checkCircle" size={20} className="text-sage" /></div><span className="mt-2 inline-block text-[10px] text-muted">Since joining Chef Haazir</span></Panel><Panel className="p-5"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Commission due</p><div className="mt-3 flex items-end justify-between"><p className="font-serif text-[27px] font-semibold">{earnings.data ? money(earnings.data.summary.totalDue) : '—'}</p><Icon name="wallet" size={20} className="text-rust" /></div><Link to="/chef/earnings" className="mt-2 inline-block text-[10px] font-bold text-rust">Earnings details →</Link></Panel></div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Panel className="overflow-hidden"><div className="grid sm:grid-cols-[42%_1fr]"><SafeImage src={chefPhoto(profile)} alt={`${profile.name} cuisine`} className="h-64 sm:h-full" /><div className="p-5"><p className="text-[9px] font-bold uppercase tracking-wide text-rust">Your kitchen</p><h2 className="mt-1 font-serif text-[25px]">{profile.name}</h2><p className="mt-2 text-[12px] leading-relaxed text-muted">{profile.city} · serving local homes with {profile.cuisines?.join(', ') || 'home cooked meals'}.</p><blockquote className="mt-4 rounded-lg bg-stone-50 p-3 font-serif text-[14px] italic leading-relaxed text-ink/75">{profile.bio || 'Add a short introduction to tell customers about your cooking.'}</blockquote><Link to="/chef/profile" className="mt-4 inline-flex text-[11px] font-bold text-rust">Edit profile details →</Link></div></div></Panel>
            <section><div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wide text-rust">Local grocery supply</p><h2 className="font-serif text-[24px]">Pantry picks in {profile.city}</h2><p className="text-[11px] text-muted">Items customers can add to a chef booking.</p></div><Link to={`/grocery/${encodeURIComponent(profile.city || '')}`} className="shrink-0 text-[10px] font-bold text-rust">Browse store →</Link></div>{grocery.isLoading ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((x) => <div key={x} className="h-24 animate-pulse rounded-xl bg-stone-100" />)}</div> : items.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{items.map((item) => <Panel key={item._id} className="flex min-w-0 items-center gap-3 p-3"><SafeImage src={images.spices} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg" /><div className="min-w-0"><p className="truncate text-[9px] font-bold uppercase text-rust">{item.category}</p><p className="truncate text-[12px] font-semibold">{item.name}</p><p className="mt-1 text-[11px] font-bold text-sage-dark">{money(item.price)} / {item.unit}</p></div></Panel>)}</div> : <Panel className="mt-3 p-5 text-[11px] text-muted">No approved grocery store is serving {profile.city} yet. Customers can still book you without groceries.</Panel>}</section>
        </div>
        <section><div className="flex items-end justify-between gap-3"><div><h2 className="font-serif text-[25px]">Your upcoming kitchen bookings</h2><p className="text-[11px] text-muted">Confirmed visits and grocery delivery status.</p></div><Link to="/chef/bookings" className="text-[11px] font-bold text-rust">All bookings →</Link></div>{confirmed.isLoading ? <div className="mt-3 h-28 animate-pulse rounded-xl bg-stone-100" /> : activeBookings.length ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{activeBookings.slice(0, 4).map((booking) => {
            const hasGroceries = (booking.groceryItems || []).length > 0 || (booking.groceryStatus && booking.groceryStatus !== 'none')
            return (
                <article key={booking._id} className="rounded-xl border border-line bg-white p-4 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-serif text-lg font-semibold">{booking.customer?.name || 'Customer'}</h3>
                        <StatusPill status={booking.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{dateLabel(booking.date)} · {slotLabel(booking.slot)} · {booking.address?.city}</p>
                    {booking.note && <p className="mt-3 rounded-lg bg-stone-50 p-3 font-serif text-[13px] italic">{booking.note}</p>}
                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
                        <p className="text-[11px] text-muted">Groceries: <strong className="text-ink">{GROCERY_STEP_LABELS[booking.groceryStatus] || booking.groceryStatus?.replaceAll('_', ' ') || 'none'}</strong></p>
                        {hasGroceries && (
                            <button
                                type="button"
                                onClick={() => setSelectedGroceryBooking(booking)}
                                className="inline-flex items-center gap-1 rounded-md border border-sage/40 bg-sage-soft/70 px-2.5 py-1 text-[10.5px] font-bold text-sage-dark hover:bg-sage hover:text-white transition"
                            >
                                <Icon name="truck" size={12} /> Grocery Status
                            </button>
                        )}
                    </div>
                </article>
            )
        })}</div> : <Panel className="mt-3 p-5 text-[12px] text-muted">No confirmed bookings yet. New requests will appear in your Requests tab.</Panel>}
            {selectedGroceryBooking && <GroceryStatusModal booking={selectedGroceryBooking} onClose={() => setSelectedGroceryBooking(null)} />}
        </section>
        <div className="flex flex-col gap-4 rounded-xl bg-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-xl">Need help with your kitchen?</h2><p className="mt-1 text-[11px] text-muted">Your partner support team is ready to help.</p></div><Link to="/contact" className="rounded-lg bg-sage-dark px-4 py-2.5 text-center text-[11px] font-bold text-white">Contact partner support</Link></div>
    </div>
}

const ChefAnalyticsOverview = ({ pendingCount }) => {
    const dashboard = useQuery({ queryKey: ['chef-dashboard-analytics'], queryFn: fetchChefDashboard, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true })
    const analytics = dashboard.data?.analytics
    const counts = analytics?.statusCounts || {}
    const earnings = dashboard.data?.earnings
    const upcomingBookings = analytics?.upcomingBookings || []
    const total = analytics?.totalBookings || 0
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() + index)
        const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(date)
        const count = analytics?.schedule?.find((entry) => entry._id === key)?.count || 0
        return { key, label: new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', weekday: 'short' }).format(date), count }
    })
    const peak = Math.max(1, ...days.map((day) => day.count))
    const stats = [
        ['Total bookings', total, 'calendar', 'text-ink'],
        ['Awaiting response', counts.pending ?? pendingCount, 'bell', 'text-rust'],
        ['Confirmed', counts.confirmed || 0, 'checkCircle', 'text-sage-dark'],
        ['Completed', counts.completed || 0, 'sparkle', 'text-ink']
    ]
    const statusData = [
        ['Pending', counts.pending || 0, 'bg-rust'],
        ['Confirmed', counts.confirmed || 0, 'bg-sage'],
        ['Completed', counts.completed || 0, 'bg-ink/60'],
        ['Cancelled / other', (counts.cancelled || 0) + (counts.rejected || 0) + (counts.expired || 0) + (counts.disputed || 0), 'bg-stone-300']
    ]
    return <div className="space-y-6">
        <DashboardSections active="overview" />
        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rust">Chef analytics</p><h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight sm:text-[40px]">Kitchen dashboard</h1><p className="mt-1 text-[12px] text-muted">Booking activity and payout overview · updates automatically</p></div>
        {earnings?.paymentBlocked && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rust/15 bg-rust-soft/60 p-4"><p className="text-[12px] text-rust-dark">Your account has an overdue commission of <strong>{money(earnings.totalDue)}</strong>.</p><Link to="/chef/earnings" className="text-[11px] font-bold text-rust underline">View earnings</Link></div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, icon, color], index) => <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.07 }}><Panel className="p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p><Icon name={icon} size={18} className={color} /></div><p className="mt-4 font-serif text-[34px] font-semibold">{dashboard.isLoading ? '—' : <AnimatedNumber value={value} />}</p></Panel></motion.div>)}</div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <Panel className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-[21px] font-semibold">Scheduled bookings · next 7 days</h2><p className="mt-1 text-[11px] text-muted">Pending requests and confirmed service dates</p></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-semibold">Live data</span></div><div className="mt-6 grid h-48 grid-cols-7 items-end gap-2 border-b border-line pb-2">{days.map((day, index) => <div key={day.key} className="flex h-full flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-muted">{day.count || ''}</span><div className="flex h-full w-full max-w-10 items-end"><motion.div title={`${day.count} bookings`} initial={{ height: 0 }} animate={{ height: `${Math.max(day.count ? 10 : 3, day.count / peak * 100)}%` }} transition={{ duration: 0.75, delay: 0.12 + index * 0.06, ease: [0.22, 1, 0.36, 1] }} className="w-full rounded-t-md bg-sage" /></div><span className="text-[9px] text-muted">{day.label}</span></div>)}</div></Panel>
            <Panel className="p-5 sm:p-6"><h2 className="font-serif text-[21px] font-semibold">Booking status</h2><p className="mt-1 text-[11px] text-muted">All recorded bookings</p><div className="mt-5 flex h-2 overflow-hidden rounded-full bg-stone-100">{statusData.map(([label, value, color]) => <div key={label} className={color} style={{ width: `${total ? value / total * 100 : 0}%` }} title={`${label}: ${value}`} />)}</div><div className="mt-5 space-y-3">{statusData.map(([label, value, color]) => <div key={label} className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-2 text-muted"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span><strong>{value}</strong></div>)}</div></Panel>
        </div>
        <div className="grid gap-3 sm:grid-cols-2"><Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Commission currently due</p><p className="mt-2 font-serif text-[28px] font-semibold">{earnings ? money(earnings.totalDue) : '—'}</p><p className="mt-1 text-[10px] text-muted">From {earnings?.payableBookings || 0} payable bookings</p><Link to="/chef/earnings" className="mt-3 inline-flex text-[10px] font-bold text-rust">Open earnings →</Link></Panel><Panel className="p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Next confirmed bookings</p>{upcomingBookings.length ? <div className="mt-2 space-y-2">{upcomingBookings.map((booking, index) => <div key={`${booking.date}-${booking.slot}-${index}`} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[11px] last:border-0"><span className="truncate">{booking.customerName || 'Customer'} · {dateLabel(booking.date)}</span><span className="shrink-0 text-muted">{slotLabel(booking.slot)}</span></div>)}</div> : <p className="mt-3 text-[11px] text-muted">No confirmed bookings yet.</p>}<Link to="/chef/bookings" className="mt-2 inline-flex text-[10px] font-bold text-rust">Open bookings →</Link></Panel></div>
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="chat" size={20} /></span><div><h2 className="font-serif text-[19px]">Need help with your kitchen?</h2><p className="mt-1 text-[11px] text-muted">Contact the partner team about bookings, your schedule, or payouts.</p></div></div><Link to="/chef/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-4 py-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"><Icon name="chat" size={14} /> Help &amp; Concierge</Link></div>
    </div>
}

const Overview = ({ profile, queryClient, pendingCount, navigate }) => profile.approvalStatus === 'approved' ? <ChefAnalyticsOverview pendingCount={pendingCount} /> : (
    <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="shield" size={14} /> {profile.city} partner kitchen</p><span className="rounded-lg bg-stone-100 px-3 py-2 text-[10px] text-muted">Account stage · <strong className="text-ink">{profile.approvalStatus === 'approved' ? 'Live' : profile.phoneVerified ? profile.contractAccepted ? '3 · Review' : '2 · Agreement' : '1 · Verification'}</strong></span></div>
        <h1 className="font-serif text-[40px] font-semibold leading-[1.04] tracking-tight sm:text-[52px]">Salaam, {firstName(profile.name)}</h1>
        <p className="mt-2 max-w-2xl font-serif text-[15px] leading-relaxed text-ink/75">Welcome to your Chef Haazir Kitchen Portal. Complete your verification steps to activate your culinary profile and start receiving booking requests.</p>
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
            <Onboarding profile={profile} queryClient={queryClient} />
            <aside className="space-y-3"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-serif text-[17px]"><Icon name="eye" size={16} /> Customer view preview</h2><span className="rounded-full bg-rust-soft px-2.5 py-1 text-[9px] font-bold text-rust">{profile.approvalStatus === 'approved' ? 'Live' : 'Draft'}</span></div><p className="text-[11px] leading-relaxed text-muted">This is how your kitchen profile will appear to customers looking for a home chef.</p><ChefPreview profile={profile} /><div className="rounded-xl border border-line bg-stone-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Requests waiting</p><p className="mt-1 font-serif text-[25px] font-semibold">{pendingCount}</p><button type="button" onClick={() => navigate('/chef/bookings?status=pending')} className="mt-2 text-[11px] font-bold text-rust underline">Review requests</button></div></aside>
        </div>
        <div className="mt-7 flex flex-col gap-4 rounded-xl bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="chat" size={20} /></span><div><h2 className="font-serif text-[19px]">Need help setting up your kitchen?</h2><p className="mt-1 text-[11px] text-muted">Our partner team can help with verification, contracts and your profile.</p></div></div><Link to="/chef/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage"><Icon name="chat" size={14} /> Contact partner support</Link></div>
    </div>
)

const ChefDashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, isLoading: authLoading, logout } = useAuth()
    const profileQuery = useQuery({ queryKey: ['chef-profile'], queryFn: async () => (await api.get('/chefs/me/profile')).data.profile ?? null, enabled: user?.role === 'chef', retry: false, refetchInterval: 30_000 })
    const pendingQuery = useQuery({ queryKey: ['chef-dashboard-analytics'], queryFn: fetchChefDashboard, enabled: user?.role === 'chef', staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true, select: (data) => data.analytics?.statusCounts?.pending || 0 })
    const profile = profileQuery.data
    const pathname = location.pathname
    const current = pathname === '/chef' ? 'overview' : pathname.split('/')[2] || 'overview'

    if (authLoading) return <div className="min-h-screen bg-white p-8"><div className="h-9 w-64 animate-pulse rounded bg-stone-100" /></div>
    if (!user) return <Navigate to="/login?next=%2Fchef" replace />
    if (user.role !== 'chef') return <Navigate to={user.role === 'user' ? '/my-bookings' : '/'} replace />

    const page = current === 'bookings' ? <BookingWorkspace mode="bookings" pendingCount={pendingQuery.data || 0} /> : current === 'earnings' ? <Earnings /> : current === 'profile' ? profile && <ProfileEditor profile={profile} queryClient={queryClient} /> : current === 'timings' ? profile && <KitchenTimings profile={profile} /> : current === 'contact' ? <Contact portal /> : profile && <Overview profile={profile} queryClient={queryClient} pendingCount={pendingQuery.data || 0} navigate={navigate} />

    return (
        <div className="min-h-screen bg-[#fbfaf8] text-ink">
            <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-7">
                    <Link to="/chef" className="flex min-w-[205px] flex-col border-r border-line pr-5 leading-none"><span className="font-serif text-[22px] font-semibold tracking-tight text-rust">skillet <span className="text-ink">Chef Haazir</span></span><span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-muted">Chef portal / apna kitchen</span></Link>
                    <nav aria-label="Chef top navigation" className="hidden items-center gap-6 text-[13px] font-semibold sm:flex">
                        {TOP_NAV.map((item) => <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `transition ${isActive ? 'text-rust' : 'text-ink/65 hover:text-ink'}`}>{item.label}</NavLink>)}
                    </nav>
                    <div className="flex items-center gap-2">
                        {profile?.approvalStatus === 'approved' && <span className="hidden rounded-full bg-sage-soft px-3 py-1.5 text-[9px] font-bold text-sage-dark md:block">APPROVED CHEF</span>}
                        <Link to="/chef/contact" className="hidden items-center gap-2 rounded-lg bg-sage-dark px-3 py-2 text-[11px] font-bold text-white hover:bg-sage md:flex"><Icon name="chat" size={13} /> Help &amp; Concierge</Link>
                        <ChefNotificationsBell user={user} dark={false} />
                        <div className="hidden items-center gap-2 border-l border-line pl-2 text-right sm:flex"><div><p className="text-[11px] font-bold">{profile?.name || user.name}</p><p className="text-[9px] text-muted">Partner chef</p></div><button
                            type="button"
                            onClick={logout}
                            className="group flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[11px] font-bold text-ink transition-all hover:border-rust/30 hover:bg-rust-soft hover:text-rust hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust/20"
                        >
                            <Icon name="logout" size={14} className="transition-transform group-hover:-translate-x-0.5" />
                            Log out
                        </button></div>
                    </div>
                </div>
            </header>
            <div className="mx-auto flex max-w-[1600px]">
                <aside className="hidden w-[240px] shrink-0 border-r border-line bg-white px-4 py-6 lg:block">
                    <p className="mb-2 flex items-center gap-2 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted"><Icon name="pin" size={13} /> {profile?.city || 'Your city'} kitchen hub</p>
                    <p className="mb-3 px-3 text-[8px] font-bold uppercase tracking-[0.16em] text-muted/70">Workspace menu</p>
                    <nav aria-label="Chef dashboard" className="space-y-1">{NAV.map((item) => <PortalNavLink key={item.to} {...item} count={item.to === '/chef/bookings' ? pendingQuery.data : undefined} />)}</nav>
                    <div className="mt-6 rounded-xl border border-line bg-stone-50 p-4"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">Commission rate</p><p className="mt-1 font-serif text-[22px] font-semibold">10%</p><p className="mt-1 text-[10px] leading-relaxed text-muted">Platform commission is charged on completed bookings only. Groceries and delivery are billed at cost.</p></div>
                </aside>
                <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
                    {page}
                </main>
            </div>
        </div>
    )
}

export default ChefDashboard