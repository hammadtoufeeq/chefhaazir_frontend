import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './Logo'

const links = [
    { to: '/', label: 'Home' },
    { to: '/chefs', label: 'Chefs' },
    { to: '/grocery', label: 'Grocery Store' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
]

const linkClass = ({ isActive }) =>
    `relative py-1 text-[15px] font-medium transition-colors hover:text-dhania ${isActive ? 'text-dhania' : 'text-ink'}`

const Navbar = () => {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
                <Logo />

                <ul className="hidden items-center gap-8 md:flex">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink to={link.to} end className={linkClass}>
                                {({ isActive }) => (
                                    <>
                                        {link.label}
                                        {isActive && (
                                            <motion.span layoutId="nav-underline" className="absolute -bottom-0.5 left-0 h-[3px] w-full rounded-full bg-haldi" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="hidden items-center gap-3 md:flex">
                    <Link to="/login" className="rounded-xl px-4 py-2.5 text-[15px] font-semibold text-dhania transition hover:bg-dhania-soft">
                        Login
                    </Link>
                    <Link to="/signup" className="rounded-xl bg-dhania px-5 py-2.5 text-[15px] font-semibold text-cream shadow-sm transition hover:-translate-y-0.5 hover:bg-dhania-dark hover:shadow-md">
                        Sign up
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="rounded-lg p-2 text-ink md:hidden"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
                    </svg>
                </button>
            </nav>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-line bg-cream md:hidden"
                    >
                        <ul className="flex flex-col gap-1 px-5 py-4">
                            {links.map((link) => (
                                <li key={link.to}>
                                    <NavLink to={link.to} end onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2.5 font-medium ${isActive ? 'bg-dhania-soft text-dhania' : 'text-ink'}`}>
                                        {link.label}
                                    </NavLink>
                                </li>
                            ))}
                            <li className="mt-2 flex gap-3">
                                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-dhania py-2.5 text-center font-semibold text-dhania">Login</Link>
                                <Link to="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-dhania py-2.5 text-center font-semibold text-cream">Sign up</Link>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

export default Navbar
