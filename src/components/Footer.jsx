import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import cities from '../constants/cities'
import { useCity } from '../context/CityContext'

const columns = [
    {
        title: 'Explore',
        links: [
            { to: '/chefs', label: 'Find home chefs' },
            { to: '/grocery', label: 'Grocery store' },
            { to: '/#how-it-works', label: 'How it works' },
            { to: '/my-bookings', label: 'My bookings' }
        ]
    },
    {
        title: 'Partners',
        links: [
            { to: '/signup?role=chef', label: 'Join as a chef' },
            { to: '/signup?role=grocery_owner', label: 'Grocery partner access' },
            { to: '/about#chef-contract', label: 'Chef contract & perks' },
            { to: '/login', label: 'Partner login' }
        ]
    },
    {
        title: 'Company',
        links: [
            { to: '/about', label: 'About us' },
            { to: '/contact', label: 'Contact' }
        ]
    }
]

const badges = [
    { icon: 'phone', label: 'Phone verified' },
    { icon: 'shield', label: 'Admin approved' },
    { icon: 'wallet', label: 'Cash on service' }
]

const Footer = () => {
    const { setCity } = useCity()

    return (
        <footer className="border-t border-sage/30 bg-sage-dark text-cream">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_1.2fr]">
                <div>
                    <Logo light />
                    <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-cream/75">
                        Book a verified home chef for a 2-hour slot in your own kitchen. Groceries come from our city store and arrive with the chef.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {badges.map((b) => (
                            <span key={b.label} className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-cream/90">
                                <Icon name={b.icon} size={13} className="text-sage-soft" /> {b.label}
                            </span>
                        ))}
                    </div>
                </div>

                {columns.map((col) => (
                    <div key={col.title}>
                        <h3 className="text-[13px] font-bold text-white">{col.title}</h3>
                        <ul className="mt-4 space-y-2.5">
                            {col.links.map((l) => (
                                <li key={l.label}>
                                    <Link to={l.to} className="text-[13px] text-cream/75 transition hover:text-white">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div>
                    <h3 className="text-[13px] font-bold text-white">Our cities</h3>
                    <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                        {cities.map((c) => (
                            <li key={c}>
                                <Link to={`/chefs?city=${encodeURIComponent(c)}`} onClick={() => setCity(c)} className="text-[13px] text-cream/75 transition hover:text-white">{c}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/15">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[12px] text-cream/70 md:flex-row md:items-center md:justify-between md:px-8">
                    <p>© {new Date().getFullYear()} Chef Haazir. Ghar se door, ghar ka khana.</p>
                    <p>All prices in PKR · Pay the chef in cash after the meal</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
