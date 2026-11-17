import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Logo from './Logo'
import Icon from './Icon'
import CityPicker from './CityPicker'
import { useAuth, homeFor } from '../context/AuthContext'

const links = [
    { to: '/', label: 'Home' },
    { to: '/chefs', label: 'Find Chefs' },
    { to: '/grocery', label: 'Grocery Store' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
]

const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// Search icon that opens a small name search, sending the visitor to /chefs?search=
const SearchButton = () => {
    const [open, setOpen] = useState(false)
    const [term, setTerm] = useState('')
    const navigate = useNavigate()
    const inputRef = useRef(null)

    useEffect(() => { if (open) inputRef.current?.focus() }, [open])

    const submit = (e) => {
        e.preventDefault()
        const q = term.trim()
        navigate(q ? `/chefs?search=${encodeURIComponent(q)}` : '/chefs')
        setOpen(false)
        setTerm('')
    }

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-label="Search chefs" className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-rust/40">
                <Icon name="search" size={15} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.form
                        onSubmit={submit}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-2 flex w-72 items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-lift"
                    >
                        <input
                            ref={inputRef}
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                            placeholder="Search a chef by name"
                            className="min-w-0 flex-1 rounded-lg bg-sand px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-sage/30"
                        />
                        <button className="rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white">Go</button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    )
}

// showToast: only one bell on the page shows the pop-up (the navbar is rendered twice: desktop and mobile)
const CustomerNotificationsBell = ({ user, showToast = true }) => {
    const userKey = user?.id || user?.email || 'customer'
    const storageKey = `chefhaazir-read-notifications:${userKey}`
    const [open, setOpen] = useState(false)
    const [toast, setToast] = useState(null)
    const containerRef = useRef(null)
    const seenRef = useRef(null)
    const [unreadIds, setUnreadIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
    })
    const { data: count = 0 } = useQuery({
        queryKey: ['booking-notifications', userKey],
        queryFn: async () => (await api.get('/bookings/notifications')).data.notifications ?? [],
        enabled: !!user,
        staleTime: 10_000,
        refetchInterval: 20_000,
        refetchOnWindowFocus: true
    })
    const notifications = count || []

    useEffect(() => {
        if (!containerRef.current) return
        const close = (event) => { if (!containerRef.current?.contains(event.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    useEffect(() => {
        if (!count) return
        const ids = new Set(count.map((notification) => String(notification.bookingId)))
        if (seenRef.current === null) {
            seenRef.current = ids
            return
        }
        const fresh = count.filter((notification) => !seenRef.current.has(String(notification.bookingId)))
        ids.forEach((id) => seenRef.current.add(id))
        if (fresh.length) {
            setUnreadIds((previous) => {
                const next = [...new Set([...previous, ...fresh.map((notification) => String(notification.bookingId))])]
                try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* storage can be disabled */ }
                return next
            })
            if (showToast) setToast(fresh[0])
        }
    }, [count, storageKey, showToast])

    useEffect(() => {
        if (!toast) return
        const timeout = setTimeout(() => setToast(null), 8_000)
        return () => clearTimeout(timeout)
    }, [toast])

    const markRead = (bookingId) => {
        const next = unreadIds.filter((id) => id !== String(bookingId))
        setUnreadIds(next)
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* storage can be disabled */ }
    }
    const markAllRead = () => {
        setUnreadIds([])
        try { localStorage.setItem(storageKey, '[]') } catch { /* storage can be disabled */ }
    }

    return (
        <>
            <div ref={containerRef} className="relative">
                <button type="button" onClick={() => { setOpen((value) => !value); markAllRead() }} aria-label={`${unreadIds.length} new booking notifications`} aria-expanded={open} className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"><Icon name="bell" size={19}/>{unreadIds.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-cream">{unreadIds.length > 9 ? '9+' : unreadIds.length}</span>}</button>
                <AnimatePresence>{open && <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} role="dialog" aria-label="Booking notifications" className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-line bg-white shadow-lift"><div className="flex items-center justify-between border-b border-line px-4 py-3"><div><p className="font-serif text-lg font-semibold">Notifications</p><p className="text-[10px] text-muted">Chef booking updates</p></div><Link to="/my-bookings" onClick={() => setOpen(false)} className="text-[10px] font-bold text-rust hover:underline">My bookings</Link></div>{notifications.length ? <ul className="max-h-80 divide-y divide-line overflow-y-auto">{notifications.map((notification) => { const unread = unreadIds.includes(String(notification.bookingId)); return <li key={notification.bookingId}><Link to={`/my-bookings/${notification.bookingId}`} onClick={() => { markRead(notification.bookingId); setOpen(false) }} className="flex gap-3 px-4 py-3 transition hover:bg-stone-50"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-sage-soft text-sage-dark' : 'bg-stone-100 text-muted'}`}><Icon name="checkCircle" size={16}/></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="text-[11px]">Chef accepted</strong>{unread && <span className="h-1.5 w-1.5 rounded-full bg-rust"/>}</span><span className="mt-0.5 block text-[11px] text-muted">{notification.chefName} accepted your request for {notification.date} · {notification.slot}</span></span></Link></li> })}</ul> : <p className="px-4 py-8 text-center text-[12px] text-muted">When a chef accepts a booking, the update will appear here.</p>}</motion.section>}</AnimatePresence>
            </div>
            {createPortal(<AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} role="status" aria-live="polite" className="fixed right-4 top-20 z-[70] w-[min(380px,calc(100vw-32px))] rounded-xl border border-sage/25 bg-white p-4 shadow-lift sm:right-6"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage-dark"><Icon name="checkCircle" size={18}/></span><div className="min-w-0 flex-1"><p className="text-[12px] font-bold">Chef accepted your booking</p><p className="mt-1 text-[11px] text-muted">{toast.chefName} · {toast.date} · {toast.slot}</p><Link to={`/my-bookings/${toast.bookingId}`} onClick={() => setToast(null)} className="mt-2 inline-flex text-[10px] font-bold text-rust hover:underline">View booking details →</Link></div><button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="rounded p-1 text-muted hover:bg-stone-100"><Icon name="close" size={14}/></button></div></motion.div>}</AnimatePresence>, document.body)}
        </>
    )
}

// Chef bell: booking requests waiting for the chef.
const ChefBell = () => {
    const source = { url: '/bookings/chef', to: '/chef', label: 'new booking requests' }
    const { data: count = 0 } = useQuery({
        queryKey: ['pending-count', 'chef'],
        queryFn: async () => (await api.get(source.url, { params: { status: 'pending', limit: 1 } })).data.pagination?.total ?? 0,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true
    })
    return <Link to={source.to} aria-label={`${count} ${source.label}`} title={`${count} ${source.label}`} className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-sand"><Icon name="bell" size={19}/>{count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-cream">{count > 9 ? '9+' : count}</span>}</Link>
}

// Picks the right bell for the role. Separate components keep React's hook order stable
// when the user logs in or out.
const Bell = ({ role, user, showToast }) => {
    if (role === 'user') return <CustomerNotificationsBell user={user} showToast={showToast} />
    if (role === 'chef') return <ChefBell />
    return null
}

// Logged-in avatar with a small menu
const AccountMenu = ({ user, logout }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!open) return
        const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open} className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-dark text-[12px] font-bold text-white shadow-sm ring-2 ring-sage-soft transition hover:bg-sage">
                {initials(user.name)}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-lift"
                    >
                        <div className="border-b border-line px-3 pb-2.5 pt-1.5">
                            <p className="truncate text-sm font-semibold">{user.name}</p>
                            <p className="truncate text-xs text-muted">{user.email}</p>
                        </div>
                        <Link to={homeFor[user.role]?.to || '/'} onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sand">
                            <Icon name={user.role === 'user' ? 'calendar' : 'chef'} size={16} />
                            {homeFor[user.role]?.label}
                        </Link>
                        <button type="button" onClick={() => { logout(); setOpen(false); navigate('/') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rust hover:bg-rust-soft">
                            <Icon name="logout" size={16} /> Log out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const Navbar = () => {
    const [open, setOpen] = useState(false)
    const { user, isLoading, logout } = useAuth()
    const location = useLocation()

    useEffect(() => setOpen(false), [location.pathname])

    return (
        <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
                <div className="flex items-center gap-5">
                    <Logo />
                    <div className="hidden items-center gap-2 lg:flex">
                        <CityPicker />
                        <SearchButton />
                    </div>
                </div>

                <ul className="hidden items-center gap-6 xl:gap-8 lg:flex">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink to={link.to} end={link.to === '/'} className={({ isActive }) => `relative block py-2 text-[14px] transition-colors hover:text-rust ${isActive ? 'font-bold text-rust' : 'font-medium text-ink/75'}`}>
                                {({ isActive }) => (
                                    <>
                                        {link.label}
                                        {isActive && <motion.span layoutId="nav-underline" className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-rust" />}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="hidden items-center gap-2 lg:flex">
                    {isLoading ? (
                        <span className="h-10 w-40 animate-pulse rounded-lg bg-sand" />
                    ) : user ? (
                        <>
                            <Link to={homeFor[user.role]?.to || '/'} className="rounded-lg bg-sage-soft px-4 py-2.5 text-[13px] font-bold text-sage-dark transition hover:bg-sage hover:text-white">
                                {homeFor[user.role]?.label}
                            </Link>
                            <Bell role={user.role} user={user} />
                            <AccountMenu user={user} logout={logout} />
                        </>
                    ) : (
                        <>
                            <Link to="/signup?role=chef" className="rounded-lg bg-sage-soft px-4 py-2.5 text-[13px] font-bold text-sage-dark transition hover:bg-sage hover:text-white">
                                Become a Chef
                            </Link>
                            <Link to="/login" className="ml-1 flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-[13px] font-semibold text-ink transition hover:bg-sand">
                                Log in
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-dark text-white ring-2 ring-sage-soft">
                                    <Icon name="user" size={17} />
                                </span>
                            </Link>
                        </>
                    )}
                </div>

                <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-ink lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
                    <Icon name={open ? 'close' : 'menu'} size={24} strokeWidth={2} />
                </button>
            </nav>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-line bg-cream lg:hidden">
                        <div className="flex flex-col gap-1 px-4 py-4">
                            <div className="mb-2 flex items-center gap-2">
                                <CityPicker />
                                <SearchButton />
                            </div>
                            {links.map((link) => (
                                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `rounded-lg px-3 py-2.5 font-semibold ${isActive ? 'bg-rust-soft text-rust' : 'text-ink'}`}>
                                    {link.label}
                                </NavLink>
                            ))}
                            <div className="mt-3 flex gap-3">
                                {user ? (
                                    <>
                                        {user.role === 'user' && <Bell role={user.role} user={user} showToast={false} />}
                                        <Link to={homeFor[user.role]?.to || '/'} className="flex-1 rounded-lg bg-sage py-2.5 text-center font-semibold text-white">{homeFor[user.role]?.label}</Link>
                                        <button type="button" onClick={() => logout()} className="flex-1 rounded-lg border border-rust py-2.5 font-semibold text-rust">Log out</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/signup?role=chef" className="flex-1 rounded-lg bg-sage-soft py-2.5 text-center font-semibold text-sage">Become a Chef</Link>
                                        <Link to="/login" className="flex-1 rounded-lg bg-rust py-2.5 text-center font-semibold text-white">Login</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

export default Navbar
