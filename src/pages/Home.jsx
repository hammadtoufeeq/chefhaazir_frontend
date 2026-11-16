import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import ChefCard, { ChefCardSkeleton } from '../components/ChefCard'

// Hero search: the chef list filters the backend supports (city, cuisine, price)
const popularCuisines = ['Desi', 'Karahi', 'Biryani & Rice', 'BBQ']
const budgets = [
    { label: 'Any budget', min: '', max: '' },
    { label: 'Up to Rs 1,500', min: '', max: '1500' },
    { label: 'Rs 1,500 – 3,000', min: '1500', max: '3000' },
    { label: 'Rs 3,000 and above', min: '3000', max: '' }
]

const Field = ({ label, icon, children }) => (
    <label className="block">
        <span className="text-[11px] font-semibold text-muted">{label}</span>
        <span className="relative mt-1.5 flex items-center">
            <Icon name={icon} size={16} className="pointer-events-none absolute left-3 text-muted" />
            {children}
            <Icon name="chevronDown" size={15} className="pointer-events-none absolute right-3 text-muted" />
        </span>
    </label>
)

const selectClass = 'w-full appearance-none rounded-lg border border-line bg-cream py-2.5 pl-9 pr-9 text-[13px] font-medium text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20'

const SearchCard = () => {
    const { city, setCity } = useCity()
    const [cuisine, setCuisine] = useState('')
    const [budget, setBudget] = useState(0)
    const navigate = useNavigate()

    const submit = (e) => {
        e.preventDefault()
        const params = new URLSearchParams({ city })
        if (cuisine) params.set('cuisine', cuisine)
        if (budgets[budget].min) params.set('minPrice', budgets[budget].min)
        if (budgets[budget].max) params.set('maxPrice', budgets[budget].max)
        navigate(`/chefs?${params}`)
    }

    return (
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">What are you craving?</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {[{ value: '', label: 'Any cuisine' }, ...popularCuisines.map((c) => ({ value: c, label: c }))].map((c) => (
                    <button
                        key={c.label}
                        type="button"
                        onClick={() => setCuisine(c.value)}
                        aria-pressed={cuisine === c.value}
                        className={`rounded-md border px-3 py-1.5 text-[12px] font-semibold transition ${cuisine === c.value ? 'border-sage bg-sage text-white' : 'border-line bg-cream text-ink/75 hover:border-sage/50'}`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Your city" icon="pin">
                    <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
                        {cities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Budget per 2-hour slot" icon="wallet">
                    <select value={budget} onChange={(e) => setBudget(Number(e.target.value))} className={selectClass}>
                        {budgets.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
                    </select>
                </Field>
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sage px-5 py-3.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-sage-dark active:scale-[0.99]">
                <Icon name="search" size={16} strokeWidth={2.2} />
                Find chefs in {city}
            </button>

            <div className="mt-5 grid grid-cols-1 gap-2 border-t border-line pt-4 text-[11.5px] text-muted sm:grid-cols-3">
                <span className="flex items-center gap-1.5"><Icon name="checkCircle" size={14} className="text-sage" /> Verified home chefs</span>
                <span className="flex items-center gap-1.5 sm:justify-center"><Icon name="tag" size={14} className="text-sage" /> Fixed price per slot</span>
                <span className="flex items-center gap-1.5 sm:justify-end"><Icon name="wallet" size={14} className="text-sage" /> Pay after the meal</span>
            </div>
        </form>
    )
}

const Hero = () => (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-14">
        <div>
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-[11px] font-semibold text-sage">
                <Icon name="shield" size={13} /> For students, bachelors & families away from home
            </motion.span>
            <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 font-serif text-[48px] leading-[1.02] tracking-tight sm:text-6xl lg:text-[68px]"
            >
                Ghar se door,
                <span className="block italic text-rust">Ghar ka khana.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
                Book a verified home chef for a 2-hour slot. They cook in your kitchen, and can bring the groceries along.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
                <SearchCard />
            </motion.div>
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
        >
            <SafeImage src={images.heroKarahi} alt="Chicken karahi cooking on a home stove" eager className="aspect-[4/5] rounded-2xl shadow-lift sm:aspect-[5/5] lg:aspect-[4/5]" />
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold shadow-card">
                <Icon name="clock" size={14} className="text-rust" /> 7 slots daily · 8 AM – 10 PM
            </span>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lift backdrop-blur sm:inset-x-6 sm:bottom-6"
            >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rust-soft text-rust"><Icon name="pot" size={22} /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">Dinner slot · 6:00 – 8:00 PM</p>
                    <p className="truncate text-[12px] text-muted">Chef arrives with your groceries, cooks, you pay after</p>
                </div>
                <span className="hidden items-center gap-1 rounded-md bg-sage-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sage sm:flex">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" /> 2 hrs
                </span>
            </motion.div>
        </motion.div>
    </section>
)

const steps = [
    {
        icon: 'pin',
        tone: 'bg-sage-soft text-sage',
        title: 'Choose a home chef near you',
        text: 'Filter verified chefs in your city by cuisine and price. Pick a date up to 7 days ahead and a free 2-hour slot.',
        foot: { icon: 'shield', text: 'Phone verified & admin approved' }
    },
    {
        icon: 'basket',
        tone: 'bg-rust-soft text-rust',
        title: 'Add groceries, or use your own',
        text: 'Pick items from our city grocery store and they reach the chef before the slot. Or cook with what is already in your kitchen.',
        foot: { icon: 'tag', text: 'Free delivery on Rs 500 and above' }
    },
    {
        icon: 'pot',
        tone: 'bg-sage-soft text-sage',
        title: 'Enjoy fresh, hot ghar ka khana',
        text: 'Tell the chef what to cook and for how many people. They cook in your kitchen, and you pay in cash after the meal.',
        foot: { icon: 'wallet', text: 'Cash on service, no advance' }
    }
]

const HowItWorks = () => (
    <section id="how-it-works" className="scroll-mt-20 bg-sand py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="text-center">
                <p className="eyebrow">Simple & accountable</p>
                <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-[44px]">How Chef Haazir works</h2>
                <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted">A fixed price, a fixed 2-hour slot, and a record of every booking.</p>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
                {steps.map((s, i) => (
                    <Reveal key={s.title} delay={i * 0.1}>
                        <article className="flex h-full flex-col rounded-xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                            <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.tone}`}><Icon name={s.icon} size={21} /></span>
                            <p className="mt-6 text-[11px] font-bold tracking-[0.14em] text-rust">STEP 0{i + 1}</p>
                            <h3 className="mt-2 font-serif text-[23px] leading-tight">{s.title}</h3>
                            <p className="mt-3 text-[14px] leading-relaxed text-muted">{s.text}</p>
                            <div className="mt-auto pt-6">
                                <p className="flex items-center gap-1.5 border-t border-line pt-4 text-[12px] font-medium text-ink/70">
                                    <Icon name={s.foot.icon} size={14} className="text-sage" /> {s.foot.text}
                                </p>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

// Three newest chefs in the visitor's city; falls back to all of Pakistan if the city has none yet
const FeaturedChefs = () => {
    const { city } = useCity()

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['chefs', 'featured', city],
        queryFn: async () => {
            const { data: local } = await api.get('/chefs', { params: { city, limit: 3 } })
            if (local.chefs.length) return { ...local, scope: city }
            const { data: all } = await api.get('/chefs', { params: { limit: 3 } })
            return { ...all, scope: null }
        }
    })

    const scope = data?.scope
    const total = data?.pagination?.total ?? 0

    return (
        <section className="py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <p className="eyebrow">{scope ? `${scope} home chefs` : 'Home chefs across Pakistan'}</p>
                        <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-[44px]">
                            Meet the <span className="italic text-rust">chefs</span> {scope ? 'near you' : 'on Chef Haazir'}
                        </h2>
                        <p className="mt-2 text-[15px] text-muted">
                            {isLoading ? 'Finding chefs…' : scope ? `Taking 2-hour slots in ${scope} this week.` : `No chefs in ${city} yet, so here are chefs from other cities.`}
                        </p>
                    </div>
                    {total > 0 && (
                        <Link to={scope ? `/chefs?city=${encodeURIComponent(scope)}` : '/chefs'} className="group flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-ink transition hover:text-rust">
                            View all {total} {total === 1 ? 'chef' : 'chefs'}{scope ? ` in ${scope}` : ''}
                            <Icon name="arrowRight" size={16} className="transition group-hover:translate-x-1" />
                        </Link>
                    )}
                </Reveal>

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading && [0, 1, 2].map((i) => <ChefCardSkeleton key={i} />)}
                    {data?.chefs.map((chef, i) => (
                        <Reveal key={chef.id} delay={i * 0.08}><ChefCard chef={chef} /></Reveal>
                    ))}
                </div>

                {isError && (
                    <div className="rounded-xl border border-line bg-white p-10 text-center shadow-card">
                        <p className="font-serif text-2xl">Couldn’t load chefs right now</p>
                        <p className="mt-2 text-sm text-muted">Please check your connection and try again.</p>
                        <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Try again</button>
                    </div>
                )}

                {data && data.chefs.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rust-soft text-rust"><Icon name="chef" size={24} /></span>
                        <p className="mt-4 font-serif text-2xl">Our first chefs are joining soon</p>
                        <p className="mt-2 text-sm text-muted">Love to cook? Be one of the first home chefs on Chef Haazir.</p>
                        <Link to="/signup?role=chef" className="mt-5 inline-flex rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Join as a chef</Link>
                    </div>
                )}
            </div>
        </section>
    )
}

const promises = [
    'Cooked fresh in your own kitchen',
    'Your recipe, your spice level',
    'Groceries from our city store',
    'Fixed price, agreed before you book'
]

const GharKaZaiqa = () => (
    <section className="px-4 pb-20 md:px-8 lg:pb-24">
        <Reveal className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-line bg-sand shadow-card lg:grid-cols-2">
            <SafeImage src={images.biryaniClay} alt="Biryani served in a clay bowl" className="min-h-72 lg:min-h-[460px]" />
            <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="eyebrow">Pure ghar ka zaiqa</p>
                <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-[42px]">
                    Real home food, <span className="italic text-rust">not another</span> takeaway
                </h2>
                <p className="mt-5 text-[15px] leading-relaxed text-muted">
                    Restaurant food every day gets heavy on the stomach and the wallet. A Chef Haazir chef cooks daal chawal, karahi or a full dawat menu in your kitchen, the way it is made at home. Add a note with what to cook and for how many people.
                </p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {promises.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[14px] text-ink/85">
                            <Icon name="check" size={17} strokeWidth={2.2} className="mt-0.5 shrink-0 text-sage" /> {p}
                        </li>
                    ))}
                </ul>
                <Link to="/chefs" className="group mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-rust px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-rust-dark">
                    Browse home chefs
                    <Icon name="arrowRight" size={16} className="transition group-hover:translate-x-1" />
                </Link>
            </div>
        </Reveal>
    </section>
)

const perks = [
    { icon: 'clock', text: 'You choose which requests to accept' },
    { icon: 'shield', text: 'Phone verified & admin approved' },
    { icon: 'heart', text: 'Medical insurance & perks under the chef contract' }
]

const PartnerBand = () => {
    const { user } = useAuth()
    if (user && user.role !== 'user') return null

    return (
        <section className="px-4 pb-20 md:px-8 lg:pb-24">
            <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-band px-6 py-12 text-white shadow-lift sm:px-12 lg:py-16">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-white/5" />
                <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
                            <Icon name="chef" size={13} /> Chef partner network
                        </span>
                        <h2 className="mt-5 font-serif text-4xl tracking-tight md:text-5xl">
                            Cook like <span className="italic text-[#F2B98F]">ammi?</span> Earn from it.
                        </h2>
                        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85">
                            Set your own rate for a 2-hour slot, between <strong className="text-white">Rs 500 and Rs 20,000</strong>, and cook in respectable homes in your city. The platform takes a <strong className="text-white">10% commission</strong> on completed bookings only.
                        </p>
                        <ul className="mt-6 flex flex-col gap-3 text-[14px] text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-6">
                            {perks.map((p) => (
                                <li key={p.text} className="flex items-center gap-2"><Icon name={p.icon} size={16} className="text-white/70" /> {p.text}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex flex-col gap-3 lg:pl-8">
                        <Link to="/signup?role=chef" className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-[14px] font-semibold text-sage-dark shadow-sm transition hover:bg-cream">
                            <Icon name="chef" size={17} /> Join as a chef
                        </Link>
                        <Link to="/signup?role=grocery_owner" className="flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3.5 text-[14px] font-semibold text-white transition hover:bg-white/20">
                            <Icon name="store" size={17} /> Run our grocery store in your city
                        </Link>
                        <Link to="/about#chef-contract" className="text-center text-[13px] text-white/75 underline-offset-4 hover:text-white hover:underline">
                            How verification works
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    )
}

const Home = () => (
    <>
        <Hero />
        <HowItWorks />
        <FeaturedChefs />
        <GharKaZaiqa />
        <PartnerBand />
    </>
)

export default Home
