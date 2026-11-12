import { Link } from 'react-router-dom'
import { Steam } from './Doodles'

const Logo = ({ light = false }) => (
    <Link to="/" className="flex items-end gap-1.5" aria-label="Chef Haazir home">
        <span className={`font-serif text-2xl font-semibold tracking-tight ${light ? 'text-cream' : 'text-ink'}`}>
            Chef <span className={light ? 'text-haldi' : 'text-dhania'}>Haazir</span>
        </span>
        <Steam className="mb-3 h-4 w-5 text-haldi" />
    </Link>
)

export default Logo
