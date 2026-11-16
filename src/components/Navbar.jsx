import { useEffect, useRef, useState } from 'react'
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

// Bell: pending booking requests (customer: waiting for the chef, chef: waiting for you)
const bellSource = {
    user: { url: '/bookings/mine', to: '/my-bookings', label: 'requests waiting for the chef' },
    chef: { url: '/bookings/chef', to: '/chef', label: 'new booking requests' }
}

const Bell = ({ role }) => {
    const source = bellSource[role]
    const { data: count = 0 } = useQuery({
        queryKey: ['pending-count', role],
        queryFn: async () => (await api.get(source.url, { params: { status: 'pending', limit: 1 } })).data.pagination.total,
        enabled: !!source,
        refetchInterval: 10 * 1000,
        refetchOnWindowFocus: true
    })
    if (!source) return null

    return (
        <Link to={source.to} aria-label={`${count} ${source.label}`} title={`${count} ${source.label}`} className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-sand">
            <Icon name="bell" size={19} />
            {count > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-cream">{count > 9 ? '9+' : count}</span>
            )}
        </Link>
    )
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
                            <Bell role={user.role} />
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
