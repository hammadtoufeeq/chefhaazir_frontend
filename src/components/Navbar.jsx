import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
            <button type="button" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open} className="flex h-9 w-9 items-center justify-center rounded-full bg-rust text-[13px] font-bold text-white shadow-sm transition hover:bg-rust-dark">
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

                <ul className="hidden items-center gap-7 lg:flex">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink to={link.to} end={link.to === '/'} className={({ isActive }) => `relative block py-2 text-[14px] font-semibold transition-colors hover:text-rust ${isActive ? 'text-rust' : 'text-ink/80'}`}>
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

                <div className="hidden items-center gap-3 lg:flex">
                    {isLoading ? (
                        <span className="h-9 w-40 animate-pulse rounded-lg bg-sand" />
                    ) : user ? (
                        <>
                            <Link to={homeFor[user.role]?.to || '/'} className="rounded-lg bg-sage-soft px-4 py-2 text-[13px] font-semibold text-sage transition hover:bg-sage hover:text-white">
                                {homeFor[user.role]?.label}
                            </Link>
                            <AccountMenu user={user} logout={logout} />
                        </>
                    ) : (
                        <>
                            <Link to="/signup?role=chef" className="rounded-lg bg-sage-soft px-4 py-2 text-[13px] font-semibold text-sage transition hover:bg-sage hover:text-white">
                                Become a Chef
                            </Link>
                            <Link to="/login" className="flex items-center gap-1.5 rounded-lg bg-rust px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-rust-dark">
                                <Icon name="user" size={15} /> Login
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
