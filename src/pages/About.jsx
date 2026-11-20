import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import { FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import GreenHero, { Accent, heroHeading } from '../components/GreenHero'

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

const Hero = () => {
    const { chefs, stores } = useStats()
    const numbers = [[chefs, 'Verified chefs'], [stores, 'City stores'], [cities.length, 'Cities']]
    return (
        <GreenHero
            pill="The Haazir manifesto"
            title={<>Every city has someone who misses <Accent>home food.</Accent></>}
            text={<>In hostels, shared flats and long office days, students and working bachelors miss <em className="text-white">ammi ke haath ka khana</em>. Not restaurant oil, not another delivery bag. Just honest, warm food cooked in your own kitchen by a verified home chef.</>}
            chips={[['chef', 'Home chefs, not restaurants'], ['tag', 'One fixed price per 2-hour slot'], ['heart', 'Fair pay for every chef']]}
            photo={{ src: images.rotiThali, alt: 'Roti, daal and salan on a steel plate' }}
            card={
                <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">Chef Haazir today</p>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                        {numbers.map(([value, label]) => (
                            <div key={label}>
                                <p style={heroHeading} className="text-[24px] text-[#17392C]">{value ?? '–'}</p>
                                <p className="text-[10.5px] font-semibold text-[#5E6B63]">{label}</p>
                            </div>
                        ))}
                    </div>
                </>
            }
        />
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

const priceRows = [
    ['Chef booking slot (2 hours)', 'Set by the chef'],
    ['Groceries', 'Locked at booking'],
    [`Delivery under Rs ${FREE_DELIVERY_FROM}`, `Rs ${DELIVERY_FEE}, else free`],
    ['Chef’s direct share', '90% of the fee', true]
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
            <h2 className="mt-3 max-w-xl font-serif text-[38px] leading-tight tracking-tight sm:text-[42px]">Our promise to every kitchen & home</h2>
            <p className="mt-2 max-w-xl text-[14px] text-muted">Trust is built through transparency, fair prices and total accountability. We are not a faceless delivery app.</p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            {/* 1. Verified chefs */}
            <Reveal>
                <article className="rounded-xl border border-line bg-white p-3 shadow-card">
                    <div className="relative">
                        <SafeImage src={images.rotiOnTawa} alt="A home cook making fresh roti on a tawa" className="h-72 rounded-lg sm:h-[330px]" />
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-sage-dark px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"><Icon name="shield" size={12} /> Phone & admin verified</span>
                    </div>
                    <div className="px-3 pb-3 pt-5">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="font-serif text-[22px]">1. Rigorously verified chefs</h3>
                            <span className="shrink-0 rounded bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage-dark">3-step check</span>
                        </div>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">A chef appears on Chef Haazir only after verifying their phone number, signing our contract and legal declaration, and being approved by our team. Accounts with genuine reports can be suspended at once.</p>
                        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                            {verifySteps.map((s) => (
                                <div key={s.label}>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/70">{s.label}</p>
                                    <p className="text-[12px] text-muted">{s.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            </Reveal>

            {/* 2. Fair prices */}
            <Reveal delay={0.08}>
                <article className="rounded-xl border border-line bg-white p-3 shadow-card">
                    <div className="relative">
                        <SafeImage src={images.spices} alt="Whole spices laid out on a board" className="h-52 rounded-lg" />
                        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-white/95 px-2.5 py-1 text-[11px] font-bold"><Icon name="tag" size={13} className="text-rust" /> Zero hidden fees</span>
                    </div>
                    <div className="px-3 pb-3 pt-5">
                        <div className="flex items-baseline justify-between gap-3">
                            <h3 className="font-serif text-[22px]">2. Fair fixed prices</h3>
                            <span className="shrink-0 font-serif text-[15px] font-semibold text-rust">from Rs 500 / 2h</span>
                        </div>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">Every chef sets one price for a 2-hour slot, shown before you book. Grocery prices are locked into your booking, so nothing changes later.</p>
                        <dl className="mt-5 space-y-2 rounded-lg bg-sand/70 p-4 text-[12.5px]">
                            {priceRows.map(([k, v, strong]) => (
                                <div key={k} className="flex justify-between gap-3">
                                    <dt className="text-muted">{k}</dt>
                                    <dd className={strong ? 'font-bold text-rust' : 'font-semibold'}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </article>
            </Reveal>
        </div>

        {/* 3. Safe bookings */}
        <Reveal className="mt-6">
            <article className="grid gap-6 rounded-xl border border-line bg-white p-3 shadow-card md:grid-cols-[0.9fr_1.5fr]">
                <div className="relative">
                    <SafeImage src={images.foodTable} alt="Plates of home cooked food on a table" className="h-56 rounded-lg md:h-full md:min-h-64" />
                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"><Icon name="checkCircle" size={13} /> Every booking on record</span>
                </div>
                <div className="px-3 pb-3 md:py-4 md:pr-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="shield" size={13} /> Accountability built in</p>
                    <h3 className="mt-2 font-serif text-[22px]">3. Safe bookings, with a record of everything</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">The chef’s phone number is shared only after they accept your request, and a chef’s home address is never shown to customers. If something goes wrong, either side can report it and our team reviews every case.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {safety.map((s) => (
                            <div key={s.title} className="rounded-lg border border-line bg-sand/50 p-3.5">
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
    { icon: 'wallet', text: '90% of every fee to the chef' },
    { icon: 'pin', text: 'Cook in your own city' },
    { icon: 'tag', text: 'Zero commission on cancellations' }
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
                    <SafeImage src={images.choppingVeg} alt="Hands chopping fresh vegetables in a home kitchen" className="aspect-[4/3.2] rounded-lg" />
                    <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
                        <span>
                            <span className="block font-serif text-[18px]">The Chef Haazir contract</span>
                            <span className="text-[12px] text-muted">Signed by every chef · {cities.length} cities</span>
                        </span>
                        <span className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-bold text-sage-dark"><Icon name="shield" size={12} /> Verified</span>
                    </figcaption>
                </figure>
            </Reveal>
            <Reveal delay={0.08}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rust"><Icon name="chef" size={13} /> Dignity in labour</p>
                <h2 className="mt-3 font-serif text-[38px] leading-tight tracking-tight sm:text-[42px]">Empowering the home chefs of Pakistan</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">
                    Chef Haazir is built around a contract that protects our chefs. For too long, the skill of keeping households fed was taken for granted. We give mothers, aunties and home cooks a dignified way to earn from it, in respectable homes in their own city, at a rate they choose.
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                    Every chef sets their own price (Rs 500 to 20,000 a slot) and accepts only the requests that suit them. In return, chefs deal with customers only through Chef Haazir and sign a declaration that the owner of the verified number is responsible for the account.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {chefPerks.map((p) => (
                        <span key={p.text} className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink/80"><Icon name={p.icon} size={15} className="text-rust" /> {p.text}</span>
                    ))}
                </div>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70">How verification works</p>
                <ul className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {onboarding.map((step, i) => (
                        <li key={step} className="flex items-start gap-2 text-[13px] text-muted">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[10px] font-bold text-sage-dark">{i + 1}</span>
                            {step}
                        </li>
                    ))}
                </ul>
            </Reveal>
        </div>
    </section>
)

const Hungry = () => (
    <section className="px-4 py-20 md:px-8">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-sage-dark px-6 py-12 text-white shadow-lift sm:px-12 lg:py-16">
            <SafeImage src={images.pulao} alt="" className="!absolute inset-y-0 right-0 hidden w-1/2 !bg-none opacity-40 md:block" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sage-dark via-sage-dark/95 to-sage-dark/30" />
            <span className="relative rounded bg-white/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Dinner is ready</span>
            <h2 className="relative mt-5 font-serif text-[40px] tracking-tight sm:text-5xl">Hungry for home?</h2>
            <p className="relative mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">Meet verified home chefs in your city today. Slow-cooked salan, fluffy rotis off the tawa, and the warmth of family dining, in your own kitchen.</p>
            <div className="relative mt-7 flex flex-wrap gap-3">
                <Link to="/chefs" className="flex items-center gap-2 rounded-lg bg-rust px-5 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-rust-dark">Find a chef <Icon name="arrowRight" size={15} /></Link>
                <Link to="/signup?role=chef" className="flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-white/10">Join as a kitchen partner</Link>
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
