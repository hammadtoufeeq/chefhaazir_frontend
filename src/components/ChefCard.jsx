import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SafeImage from './SafeImage'
import Icon from './Icon'
import { chefPhoto } from '../constants/images'

// "Book Uncle Tariq" when the name is short, else "Book Shabana"
const buttonName = (name) => (name.length <= 16 ? name : name.split(' ')[0])

// One chef from GET /api/chefs: { id, name, city, cuisines, ratePerSlot, bio }
const ChefCard = ({ chef }) => (
    <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-lift"
    >
        <div className="relative">
            <SafeImage src={chefPhoto(chef)} alt={`${chef.cuisines[0] || 'Home'} food`} className="h-48" imgClassName="transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-sage px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                <Icon name="shield" size={12} strokeWidth={2.2} /> Verified
            </span>
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-ink/75 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Icon name="pin" size={12} /> {chef.city}
            </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-[22px] leading-tight">{chef.name}</h3>
                <div className="shrink-0 text-right">
                    <p className="text-[15px] font-bold text-rust">Rs {chef.ratePerSlot.toLocaleString()}</p>
                    <p className="text-[11px] text-muted">/ 2-hr slot</p>
                </div>
            </div>

            {chef.bio && <p className="mt-3 line-clamp-2 font-serif text-[14px] italic leading-snug text-muted">“{chef.bio}”</p>}

            <div className="mb-auto mt-4 flex flex-wrap gap-1.5">
                {chef.cuisines.slice(0, 4).map((c, i) => (
                    <span key={c} className={`rounded px-2 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-rust-soft text-rust' : 'bg-sand text-ink/75'}`}>{c}</span>
                ))}
            </div>

            <Link
                to={`/chefs/${chef.id}`}
                className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-sage px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-sage-dark"
            >
                Book {buttonName(chef.name)}
                <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
            </Link>
        </div>
    </motion.article>
)

export const ChefCardSkeleton = () => (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="h-48 animate-pulse bg-sand" />
        <div className="space-y-3 p-5">
            <div className="h-6 w-2/3 animate-pulse rounded bg-sand" />
            <div className="h-4 w-full animate-pulse rounded bg-sand" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
            <div className="h-11 animate-pulse rounded-lg bg-sand" />
        </div>
    </div>
)

export default ChefCard
