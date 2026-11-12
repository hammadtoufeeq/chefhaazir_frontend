import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// Card for one chef from GET /api/chefs
const ChefCard = ({ chef, featured = false }) => (
    <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(60,45,20,0.06)] transition-shadow hover:shadow-[0_16px_34px_rgba(60,45,20,0.14)] ${featured ? 'md:flex-row' : ''}`}
    >
        <div className={`relative flex items-center justify-center bg-gradient-to-br from-haldi-soft via-surface to-dhania-soft ${featured ? 'h-48 md:h-auto md:w-2/5' : 'h-36'}`}>
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-dhania font-serif text-3xl text-cream shadow-md transition-transform duration-500 group-hover:scale-110">
                {initials(chef.name)}
            </span>
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-dhania">✓ Verified</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
            <h3 className="font-serif text-xl font-semibold">{chef.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{chef.city}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
                {chef.cuisines.slice(0, 3).map((c) => (
                    <span key={c} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium">{c}</span>
                ))}
            </div>
            {chef.bio && <p className="mt-3 line-clamp-2 text-sm text-muted">{chef.bio}</p>}
            <div className="mt-auto flex items-end justify-between pt-4">
                <p className="text-sm text-muted">
                    <span className="font-serif text-xl font-semibold text-ink">Rs {chef.ratePerSlot.toLocaleString()}</span> / 2 hrs
                </p>
                <Link to={`/chefs/${chef.id}`} className="text-sm font-semibold text-dhania transition group-hover:translate-x-1">
                    View →
                </Link>
            </div>
        </div>
    </motion.article>
)

export default ChefCard
