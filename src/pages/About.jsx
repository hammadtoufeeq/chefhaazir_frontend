import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import { FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

// Live counts from the public API (no made-up numbers)
const useStats = () => {
    const chefs = useQuery({
        queryKey: ['stats', 'chefs'],
        queryFn: async () => (await api.get('/chefs', { params: { limit: 1 } })).data.pagination.total
    })
    const stores = useQuery({
        queryKey: ['grocery', 'stores'],
        queryFn: async () => (await api.get('/grocery/stores')).data.stores
    })
    return { chefs: chefs.data, stores: stores.data?.length }
}

const Stat = ({ value, label }) => (
    <div>
        <p className="font-serif text-[30px] font-semibold leading-none text-rust">{value ?? '–'}</p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
)

const Hero = () => {
    const { chefs, stores } = useStats()
    return (
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-10 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-14">
            <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70"><span className="h-1.5 w-1.5 rounded-full bg-rust" /> The Haazir manifesto</p>
                <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-4 font-serif text-[42px] leading-[1.05] tracking-tight sm:text-[54px]">
                    Every city has someone who <span className="italic text-rust">misses home food.</span>
                </motion.h1>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
                    In hostels, shared flats and long office days across Lahore, Karachi and Islamabad, students and working bachelors miss the comfort of <em className="text-ink">ammi ke haath ka khana</em>. Not restaurant oil. Not another delivery bag. Just honest, warm food, cooked at home with care.
                </p>
                <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                    <Stat value={chefs} label="Verified home chefs" />
                    <Stat value={stores} label="City grocery stores" />
                    <Stat value={cities.length} label="Cities served" />
                </div>
            </div>
            <motion.figure initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.8 }}>
                <div className="relative rotate-1 rounded-2xl bg-white p-3 shadow-lift">
                    <SafeImage src={images.rotiOnTawa} alt="Hands cooking fresh roti on a tawa" eager className="aspect-[4/3] rounded-xl" />
                    <div className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-2 text-[11px] font-semibold text-white">
                        <span className="rounded-full bg-ink/65 px-2.5 py-1 backdrop-blur-sm">Fresh off the tawa</span>
                        <span className="rounded-full bg-rust/90 px-2.5 py-1">Daal chawal & roti</span>
                    </div>
                </div>
                <figcaption className="mt-4 text-center font-serif text-[13px] italic text-muted">“A warm roti that feels like home.”</figcaption>
            </motion.figure>
        </section>
    )
}

const WhyWeExist = () => (
    <section className="bg-sand py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
            <Reveal className="text-center">
                <span className="rounded-full bg-rust-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rust">Genesis & purpose</span>
                <h2 className="mt-4 font-serif text-[36px] tracking-tight">Why Chef Haazir exists</h2>
            </Reveal>
            <Reveal className="mt-8 grid gap-6 text-[14px] leading-relaxed text-muted md:grid-cols-2 md:gap-10">
                <p>
                    Finding a trustworthy cook for a few hours in Pakistan happens through word of mouth: no fixed price, no record and no accountability. Restaurants and delivery are too expensive and too heavy to rely on every day, and families hosting guests or a dawat face the same problem.
                </p>
                <p>
                    Meanwhile, skilled home cooks in every city could earn from the craft they already have. Chef Haazir brings the two together: a verified chef, a fixed 2-hour slot, a fixed price, and groceries from our own city store, with every booking on record.
                </p>
            </Reveal>
            <Reveal className="relative mx-auto mt-12 max-w-xl rounded-xl border border-line bg-white px-8 py-9 text-center shadow-card">
                <span aria-hidden="true" className="absolute -left-2 -top-5 font-serif text-[72px] leading-none text-rust/20">“</span>
                <p className="font-serif text-[22px] italic leading-snug text-rust">Ghar ka khana is not just food. It is comfort, memory, and a mother’s silent prayer served warm.</p>
                <p className="mt-5 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/60"><span className="h-px w-6 bg-line" /> The Haazir philosophy <span className="h-px w-6 bg-line" /></p>
            </Reveal>
        </div>
    </section>
)

const verifySteps = [
    { label: 'Phone OTP', note: 'Number verified' },
    { label: 'Contract', note: 'Signed & declared' },
    { label: 'Admin review', note: 'Approved by us' }
]

const breakdown = [
    ['Chef fee (2 hours)', 'Rs 500'],
    ['Groceries from our store', 'Rs 650'],
    [`Delivery (free from Rs ${FREE_DELIVERY_FROM})`, 'Rs 0'],
    ['You pay the chef, in cash', 'Rs 1,150']
]

const safety = [
    { icon: 'undo', title: 'Free cancellation', text: 'Cancel until 1.5 hours before the slot, no charge.' },
    { icon: 'clock', title: '15-minute answer', text: 'The chef accepts or declines quickly, or the request expires.' },
    { icon: 'shield', title: 'Report an issue', text: 'Report a problem within 24 hours of the slot. Our team decides.' }
]

const OurPromise = () => (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <Reveal>
            <p className="eyebrow">Our uncompromising standard</p>
            <h2 className="mt-3 max-w-xl font-serif text-[38px] leading-tight tracking-tight">Our promise to every kitchen & home</h2>
            <p className="mt-2 max-w-xl text-[14px] text-muted">Trust is built through transparency, fair prices and accountability. We are not a faceless delivery app.</p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            {/* Verified chefs */}
            <Reveal>
                <article className="flex h-full flex-col rounded-xl border border-line bg-white p-4 shadow-card">
                    <div className="relative">
                        <SafeImage src={images.rollingPin} alt="A home cook rolling dough" className="h-64 rounded-lg sm:h-72" />
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-sage-dark px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"><Icon name="shield" size={12} /> Verified before first booking</span>
                    </div>
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="font-serif text-[22px]">1. Rigorously verified chefs</h3>
                            <span className="shrink-0 rounded bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage-dark">3-step check</span>
                        </div>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">A chef appears on Chef Haazir only after verifying their phone number, signing our contract and legal declaration, and being approved by our team. Any account can be suspended if reports are found genuine.</p>
                        <div className="mt-auto pt-5">
                            <div className="grid grid-cols-3 gap-3 border-t border-line pt-4">
                                {verifySteps.map((s) => (
                                    <div key={s.label}>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/70">{s.label}</p>
                                        <p className="text-[12px] text-muted">{s.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>
            </Reveal>

            {/* Fair prices */}
            <Reveal delay={0.08}>
                <article className="flex h-full flex-col rounded-xl border border-line bg-white p-4 shadow-card">
                    <div className="relative">
                        <SafeImage src={images.steelThali} alt="Home food on a steel tray" className="h-48 rounded-lg" />
                        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-white/95 px-2.5 py-1 text-[11px] font-bold"><Icon name="tag" size={13} className="text-rust" /> No hidden fees</span>
                    </div>
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                        <h3 className="font-serif text-[22px]">2. Fair, fixed prices</h3>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">Every chef sets one price for a 2-hour slot, shown before you book. Grocery prices are locked into your booking, so nothing changes later.</p>
                        <dl className="mt-5 space-y-1.5 rounded-lg bg-sand/70 p-4 text-[12.5px]">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Example booking</p>
                            {breakdown.map(([k, v], i) => (
                                <div key={k} className={`flex justify-between gap-3 ${i === breakdown.length - 1 ? 'border-t border-line pt-2 font-bold' : ''}`}>
                                    <dt className={i === breakdown.length - 1 ? '' : 'text-muted'}>{k}</dt>
                                    <dd className={i === breakdown.length - 1 ? 'text-rust' : ''}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </article>
            </Reveal>
        </div>

        {/* Safe bookings */}
        <Reveal className="mt-6">
            <article className="grid gap-6 rounded-xl border border-line bg-white p-4 shadow-card md:grid-cols-[1fr_1.5fr]">
                <div className="relative">
                    <SafeImage src={images.tableSpread} alt="A table full of home cooked dishes" className="h-56 rounded-lg md:h-full" />
                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"><Icon name="checkCircle" size={13} /> Every booking on record</span>
                </div>
                <div className="px-2 pb-2 md:py-3 md:pr-4">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="shield" size={13} /> Accountability built in</p>
                    <h3 className="mt-2 font-serif text-[22px]">3. Safe bookings, with a record of everything</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">The chef’s phone number is shared only after they accept your request, and a chef’s home address is never shown to customers. If something goes wrong, either side can report it and our team reviews every case.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {safety.map((s) => (
                            <div key={s.title} className="rounded-lg bg-sand/70 p-3.5">
                                <Icon name={s.icon} size={17} className="text-sage-dark" />
                                <p className="mt-2 text-[12.5px] font-bold">{s.title}</p>
                                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </article>
        </Reveal>
    </section>
)

const chefPerks = [
    { icon: 'heart', text: 'Medical insurance cover' },
    { icon: 'wallet', text: 'Keep 90% of every fee' },
    { icon: 'tag', text: 'Set your own rate' },
    { icon: 'clock', text: 'Accept only what suits you' }
]

const onboarding = [
    'Sign up as a chef with your city, cuisines, rate and bio',
    'Enter the 6-digit code our team sends to your phone',
    'Accept the chef contract and the legal declaration',
    'Our team approves you, and you appear to customers'
]

const ChefContract = () => (
    <section id="chef-contract" className="scroll-mt-20 bg-sand py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <Reveal>
                <figure className="rounded-xl bg-white p-3 shadow-lift">
                    <SafeImage src={images.biryaniClay} alt="Biryani cooked by a home chef" className="aspect-[5/4] rounded-lg" />
                    <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
                        <span>
                            <span className="block font-serif text-[17px]">The Chef Haazir contract</span>
                            <span className="text-[12px] text-muted">Signed by every chef before their first booking</span>
                        </span>
                        <span className="rounded bg-sage-soft px-2 py-1 text-[11px] font-bold text-sage-dark">10% commission</span>
                    </figcaption>
                </figure>
            </Reveal>
            <Reveal delay={0.08}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="chef" size={13} /> Dignity in labour</p>
                <h2 className="mt-3 font-serif text-[38px] leading-tight tracking-tight">Empowering the home chefs of Pakistan</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">
                    Chef Haazir is built around a contract that protects our chefs. Mothers, aunties and home cooks earn from the craft they already have, in respectable homes in their own city, at a rate they choose (Rs 500 to 20,000 per slot).
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                    In return, chefs agree to deal with customers only through Chef Haazir, and sign a legal declaration that the owner of the verified number is responsible for the account. The platform takes a 10% commission on completed bookings only.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                    {chefPerks.map((p) => (
                        <span key={p.text} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink/80"><Icon name={p.icon} size={14} className="text-rust" /> {p.text}</span>
                    ))}
                </div>
                <div className="mt-7 rounded-xl border border-line bg-white p-5">
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/70">How verification works</p>
                    <ol className="mt-3 space-y-2.5">
                        {onboarding.map((s, i) => (
                            <li key={s} className="flex items-start gap-3 text-[13.5px]">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-bold text-sage-dark">{i + 1}</span>
                                {s}
                            </li>
                        ))}
                    </ol>
                </div>
            </Reveal>
        </div>
    </section>
)

const Hungry = () => (
    <section className="px-4 py-20 md:px-8">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-sage-dark px-6 py-12 text-white shadow-lift sm:px-12 lg:py-16">
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-36 right-48 h-80 w-80 rounded-full bg-white/5" />
            <span className="relative rounded bg-white/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Dinner is ready</span>
            <h2 className="relative mt-5 font-serif text-[40px] tracking-tight sm:text-5xl">Hungry for home?</h2>
            <p className="relative mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">Meet verified home chefs in your city today. Slow-cooked salan, fluffy rotis off the tawa, and the warmth of family dining, in your own kitchen.</p>
            <div className="relative mt-7 flex flex-wrap gap-3">
                <Link to="/chefs" className="flex items-center gap-2 rounded-lg bg-rust px-5 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-rust-dark">Find a chef <Icon name="arrowRight" size={15} /></Link>
                <Link to="/signup?role=chef" className="flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-white/10">Join as a chef</Link>
            </div>
            <p className="relative mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-white/75">
                <span className="flex items-center gap-1.5"><Icon name="clock" size={14} /> 7 slots a day, 8 AM – 10 PM</span>
                <span className="flex items-center gap-1.5"><Icon name="wallet" size={14} /> Pay in cash after the meal</span>
                <span className="flex items-center gap-1.5"><Icon name="truck" size={14} /> Groceries Rs {DELIVERY_FEE} delivery, free from Rs {FREE_DELIVERY_FROM}</span>
            </p>
        </Reveal>
    </section>
)

const About = () => (
    <>
        <Hero />
        <WhyWeExist />
        <OurPromise />
        <ChefContract />
        <Hungry />
    </>
)

export default About
