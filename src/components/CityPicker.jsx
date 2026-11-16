import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import cities from '../constants/cities'
import { useCity } from '../context/CityContext'
import Icon from './Icon'

// Navbar pill: which city the visitor is browsing
const CityPicker = ({ onPick }) => {
    const { city, setCity } = useCity()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
        const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', esc)
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition hover:border-rust/40"
            >
                <Icon name="pin" size={14} className="text-rust" />
                {city}
                <Icon name="chevronDown" size={14} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-2 grid w-64 grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-2 shadow-lift"
                    >
                        {cities.map((c) => (
                            <li key={c}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={c === city}
                                    onClick={() => { setCity(c); setOpen(false); onPick?.() }}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${c === city ? 'bg-sage-soft font-semibold text-sage' : 'hover:bg-sand'}`}
                                >
                                    {c}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CityPicker
