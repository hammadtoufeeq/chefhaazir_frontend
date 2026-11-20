import { Link } from 'react-router-dom'

// light: on a dark background (footer) · dark: on the dark green navbar
const Logo = ({ light = false, dark = false }) => (
    <Link to="/" className="group flex flex-col leading-none" aria-label="Chef Haazir home">
        <span className={`font-serif text-[22px] font-semibold tracking-tight ${dark ? 'text-[#F2C08F]' : light ? 'text-cream' : 'text-rust'}`}>Chef Haazir</span>
        <span className={`mt-1 text-[8.5px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-white/55' : light ? 'text-cream/70' : 'text-muted'}`}>Authentic ghar ka khana</span>
    </Link>
)

export default Logo
