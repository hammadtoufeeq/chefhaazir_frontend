import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { images } from '../constants/images'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import ChefCard, { ChefCardSkeleton } from '../components/ChefCard'

// ---------------------------------------------------------------------------
// Home page. Every line of copy that makes a promise (verification, prices,
// delivery) lives in the lists below, so it is easy to edit in one place.
// ---------------------------------------------------------------------------

// ---------------- Hero ----------------
const trustPoints = [
    { icon: 'shield', text: 'Phone verified & admin approved' },
    { icon: 'wallet', text: 'No advance payment' },
    { icon: 'tag', text: 'Fixed price per slot' }
]

const heroStats = [
    { value: '7', title: 'Daily 2-hour slots', text: 'From 8 AM to 10 PM, every day' },
    { value: '7 days', title: 'Book up to a week ahead', text: 'Pick any free slot that suits you' },
    { value: 'Rs 0', title: 'Advance payment', text: 'Pay in cash after the meal' },
    { value: '2 hrs', title: 'Notice to add groceries', text: 'Your chef brings them along' }
]

// Chef with a flaming pan, by Hemant Latawa (free under the Unsplash License)
const heroImage = 'https://images.unsplash.com/flagged/photo-1561350117-501b4661f8d4?auto=format&fit=crop&w=2000&q=70'
const heroCredit = 'https://unsplash.com/photos/chef-holding-fry-pan-RKdkETvcYn4'

const Hero = () => {
    const [photoLoaded, setPhotoLoaded] = useState(false)
    const [photoFailed, setPhotoFailed] = useState(false)

    return (
        <section className="relative isolate overflow-hidden bg-[#16291F] text-white">
            {/* Photo covering the whole hero. If it fails to load, the dark green below still looks right. */}
            {!photoFailed && (
                <img
                    src={heroImage}
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    onLoad={() => setPhotoLoaded(true)}
                    onError={() => setPhotoFailed(true)}
                    className={`absolute inset-0 -z-20 h-full w-full object-cover object-center transition-opacity duration-1000 ${photoLoaded ? 'opacity-50' : 'opacity-0'}`}
                />
            )}
            {/* Green tint: darker on the left where the text sits, lighter on the right so the chef shows */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#16291F]/95 via-[#1F3A2D]/80 to-[#1F3A2D]/45" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#16291F]/90 to-transparent" />

            <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 md:px-8 lg:pb-16 lg:pt-16">
                <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                    <Icon name="shield" size={13} /> Verified home chefs across Pakistan
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 font-serif text-[48px] leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[72px]"
                >
                    Ghar se door,
                    <span className="block italic text-[#E98A4B]">Ghar ka khana.</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85">
                    Book a verified home chef for a 2-hour slot. They cook fresh in your kitchen, with the groceries you choose, at a price fixed before you book.
                </motion.p>
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-medium text-white/90">
                    {trustPoints.map((p) => (
                        <li key={p.text} className="flex items-center gap-1.5"><Icon name={p.icon} size={14} className="text-[#E7B65C]" /> {p.text}</li>
                    ))}
                </motion.ul>

                <dl className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    {heroStats.map((st, i) => (
                        <motion.div key={st.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07, duration: 0.5 }} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                            <dt className="font-serif text-[30px] leading-none text-[#E7B65C] sm:text-[34px]">{st.value}</dt>
                            <dd className="mt-3 text-[12.5px] font-semibold text-white">{st.title}</dd>
                            <dd className="mt-1 text-[11px] leading-snug text-white/70">{st.text}</dd>
                        </motion.div>
                    ))}
                </dl>
            </div>

            {photoLoaded && (
                <a href={heroCredit} target="_blank" rel="noreferrer" className="absolute bottom-2 right-4 text-[10px] text-white/40 transition hover:text-white/80">
                    Photo: Hemant Latawa / Unsplash
                </a>
            )}
        </section>
    )
}

// ---------------- How it works ----------------
const steps = [
    {
        icon: 'pin',
        tone: 'bg-sage-soft text-sage',
        title: 'Choose your home chef',
        text: 'Filter verified chefs in your city by cuisine and price. Pick a date up to 7 days ahead and a free 2-hour slot.',
        foot: { icon: 'shield', text: 'Phone verified & admin approved' }
    },
    {
        icon: 'basket',
        tone: 'bg-rust-soft text-rust',
        title: 'Add fresh kiryana groceries',
        text: 'Pick items from our city grocery store, or cook with what is already in your kitchen. The choice is yours.',
        foot: { icon: 'tag', text: 'Free delivery on Rs 500 and above' }
    },
    {
        icon: 'truck',
        tone: 'bg-sage-soft text-sage',
        title: 'Chef arrives with groceries',
        text: 'Once your chef accepts, the groceries reach them before the slot and they arrive ready to cook for your family.',
        foot: { icon: 'clock', text: 'Chef accepts every request first' }
    },
    {
        icon: 'pot',
        tone: 'bg-rust-soft text-rust',
        title: 'Enjoy fresh, hot ghar ka khana',
        text: 'Tell the chef what to cook and for how many people. Enjoy the meal, then pay in cash after it.',
        foot: { icon: 'wallet', text: 'Cash on service, no advance' }
    }
]

const HowItWorks = () => (
    <section id="how-it-works" className="scroll-mt-20 bg-[#F8F5EF] pt-20 lg:pt-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="text-center">
                <p className="eyebrow">Effortless comfort</p>
                <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-[44px]">How Chef Haazir works</h2>
                <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted">A fixed price, a fixed 2-hour slot, and a record of every booking.</p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                    <Reveal key={s.title} delay={i * 0.08}>
                        <article className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                            <div className="flex items-start justify-between">
                                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}><Icon name={s.icon} size={20} /></span>
                                <p className="rounded bg-rust-soft px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-rust">STEP 0{i + 1}</p>
                            </div>
                            <h3 className="mt-5 font-serif text-[21px] leading-tight">{s.title}</h3>
                            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{s.text}</p>
                            <div className="mt-auto pt-6">
                                <p className="flex items-center gap-1.5 border-t border-line pt-4 text-[11.5px] font-medium text-ink/70">
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

// ---------------- Groceries ----------------
const pantryPoints = [
    { icon: 'basket', title: 'Everything for the kitchen', text: 'Atta and rice, meat and chicken, vegetables, daal, spices, dairy and oil, all in one city catalog.' },
    { icon: 'scale', title: 'Exact quantities', text: 'Order the exact amount each dish needs, priced per kg, litre or pack, so nothing goes to waste.' },
    { icon: 'tag', title: 'Prices locked in', text: 'The price you see when you book is the price you pay. It never changes after the booking.' },
    { icon: 'truck', title: 'Free delivery above Rs 500', text: 'Grocery orders of Rs 500 and above are delivered free to your chef.' }
]

const Groceries = () => {
    const { city } = useCity()
    return (
        <section className="bg-[#F8F5EF] px-4 pb-20 pt-10 md:px-8 lg:pb-24 lg:pt-14">
            <Reveal className="mx-auto grid max-w-7xl gap-8 rounded-2xl bg-[#F0EADF] p-6 shadow-card sm:p-10 lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:p-14">
                <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rust/20 bg-rust-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rust">
                        <Icon name="basket" size={13} /> Fresh pantry from our city store
                    </span>
                    <h2 className="mt-5 font-serif text-[34px] leading-[1.12] tracking-tight md:text-[42px]">
                        Pure kiryana & groceries, delivered right to your chef
                        <span className="mt-1 block italic text-rust">Vegetables, meat & pure spices.</span>
                    </h2>
                    <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-muted">
                        Skip the last-minute trips to the bazaar. Choose what you need from your city’s grocery store when you book, and it is delivered to your chef before the slot, so they arrive ready to cook.
                    </p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        {pantryPoints.map((p) => (
                            <div key={p.title} className="rounded-xl border border-line bg-white p-4">
                                <p className="flex items-center gap-2 text-[13px] font-bold"><Icon name={p.icon} size={16} className="text-rust" /> {p.title}</p>
                                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{p.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/grocery" className="group inline-flex items-center gap-2 rounded-lg bg-rust px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-rust-dark">
                            <Icon name="store" size={16} /> Explore grocery store
                        </Link>
                        <Link to={`/grocery/${encodeURIComponent(city)}`} className="group inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-[13.5px] font-semibold text-ink transition hover:border-sage/50">
                            View pantry catalog <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden rounded-2xl lg:min-h-0">
                    <SafeImage src={images.vegMarket} alt="Fresh vegetables and groceries" className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2B98F]">Fresh pantry basket</p>
                        <p className="mt-1.5 font-serif text-[24px] leading-tight">Picked for your family’s dinner</p>
                        <p className="mt-1.5 text-[12px] text-white/80">Delivered to your chef before the slot starts.</p>
                    </div>
                </div>
            </Reveal>
        </section>
    )
}

// ---------------- Featured chefs ----------------
// Four newest chefs in the visitor's city; falls back to all of Pakistan if the city has none yet
const FeaturedChefs = () => {
    const { city } = useCity()

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['chefs', 'featured', city],
        queryFn: async () => {
            const { data: local } = await api.get('/chefs', { params: { city, limit: 4 } })
            if (local.chefs.length) return { ...local, scope: city }
            const { data: all } = await api.get('/chefs', { params: { limit: 4 } })
            return { ...all, scope: null }
        }
    })

    const scope = data?.scope
    const total = data?.pagination?.total ?? 0

    return (
        <section className="bg-white py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <p className="eyebrow">{scope ? `${scope} culinary masters` : 'Home chefs across Pakistan'}</p>
                        <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-[42px]">
                            Featured <span className="italic text-rust">home chefs</span> {scope ? `in ${scope}` : 'on Chef Haazir'}
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

                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {isLoading && [0, 1, 2, 3].map((i) => <ChefCardSkeleton key={i} />)}
                    {data?.chefs.map((chef, i) => (
                        <Reveal key={chef.id} delay={i * 0.07}><ChefCard chef={chef} /></Reveal>
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

// ---------------- Real home cooking ----------------
const promises = [
    'Your recipe, your spice and oil level',
    'Groceries from our city store, or your own',
    'Cooked fresh in your own kitchen',
    'Fixed price, agreed before you book'
]

const HomeCooking = () => {
    const { city } = useCity()
    return (
        <section className="bg-white px-4 pb-20 md:px-8 lg:pb-24">
            <Reveal className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <SafeImage src={images.panCooking} alt="A home chef stirring a pan on the stove" className="min-h-72 rounded-2xl shadow-card lg:min-h-[480px]" />
                <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="pot" size={14} /> Pure homestyle experience</span>
                    <h2 className="mt-4 font-serif text-4xl leading-[1.1] tracking-tight md:text-[44px]">
                        The comfort of real home cooking,
                        <span className="block italic text-rust">prepared in your own kitchen</span>
                    </h2>
                    <p className="mt-5 text-[15px] leading-relaxed text-muted">
                        Restaurant takeaway and delivery food gets heavy on the stomach and the wallet. A Chef Haazir chef cooks daal chawal, karahi or a full dawat menu right in your home, the way it is made at home. Add a note with what to cook and for how many people.
                    </p>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {promises.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-[14px] text-ink/85">
                                <Icon name="check" size={17} strokeWidth={2.2} className="mt-0.5 shrink-0 text-sage" /> {p}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/chefs" className="group inline-flex items-center gap-2 rounded-lg bg-rust px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-rust-dark">
                            <Icon name="pot" size={16} /> Browse home chefs
                        </Link>
                        <Link to={`/chefs?city=${encodeURIComponent(city)}`} className="group inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-[14px] font-semibold text-ink transition hover:border-sage/50">
                            Book a home chef <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    )
}

// ---------------- Chef partner band ----------------
const perks = [
    { icon: 'clock', text: 'You choose which requests to accept' },
    { icon: 'shield', text: 'Phone verified & admin approved' },
    { icon: 'heart', text: 'Medical insurance & perks under the chef contract' }
]

const PartnerBand = () => {
    const { user } = useAuth()
    if (user && user.role !== 'user') return null

    return (
        <section className="bg-white px-4 pb-20 md:px-8 lg:pb-24">
            <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-band px-6 py-12 text-white shadow-lift sm:px-12 lg:py-16">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-white/5" />
                <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
                            <Icon name="chef" size={13} /> Partner with Chef Haazir
                        </span>
                        <h2 className="mt-5 font-serif text-4xl tracking-tight md:text-5xl">
                            Are you a passionate <span className="italic text-[#F2B98F]">home cook?</span>
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
                            <Icon name="plus" size={17} /> Apply to become a chef
                        </Link>
                        <Link to="/about#chef-contract" className="flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3.5 text-[14px] font-semibold text-white transition hover:bg-white/20">
                            <Icon name="shield" size={16} /> Learn about verification
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
        <Groceries />
        <FeaturedChefs />
        <HomeCooking />
        <PartnerBand />
    </>
)

export default Home