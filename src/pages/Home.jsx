import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import SafeImage from '../components/SafeImage'
import Reveal from '../components/Reveal'
import ChefCard from '../components/ChefCard'
import { Underline, Steam, DashedArrow } from '../components/Doodles'

const dishes = ['Chicken karahi', 'Biryani', 'Daal chawal', 'Nihari', 'Aloo gosht', 'Haleem', 'Qorma', 'Saag', 'Pulao', 'Kheer', 'Chapli kabab', 'Bhindi']

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] } })
}

// ---------------- Hero ----------------
const Hero = () => {
    const [city, setCity] = useState('Lahore')
    const navigate = useNavigate()

    const handleSearch = (e) => {
        e.preventDefault()
        navigate(`/chefs?city=${encodeURIComponent(city)}`)
    }

    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
                <div>
                    <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="inline-flex items-center gap-2 rounded-full bg-dhania-soft px-3.5 py-1.5 text-sm font-semibold text-dhania">
                        <span className="h-2 w-2 rounded-full bg-dhania" /> Home chefs in your city
                    </motion.p>

                    <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show" className="mt-6 font-serif text-[2.9rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.4rem]">
                        Ghar se door,
                        <br />
                        <span className="relative inline-block">
                            ghar ka khana.
                            <Underline className="absolute -bottom-3 left-0 h-4 w-full" />
                        </span>
                    </motion.h1>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
                        Book a verified home chef for two hours. They cook in your kitchen, the way it's made at home, and our store delivers the groceries to them.
                    </motion.p>

                    <motion.form custom={3} variants={fadeUp} initial="hidden" animate="show" onSubmit={handleSearch} className="mt-8 flex w-full max-w-md flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_10px_30px_rgba(60,45,20,0.10)] sm:flex-row">
                        <label className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-4">
                            <span className="text-sm text-muted">City</span>
                            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full cursor-pointer bg-transparent py-3 font-semibold outline-none" aria-label="Choose your city">
                                {cities.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                        <button type="submit" className="rounded-xl bg-dhania px-6 py-3 font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-dhania-dark hover:shadow-lg active:scale-[0.98]">
                            Find chefs
                        </button>
                    </motion.form>

                    <motion.ul custom={4} variants={fadeUp} initial="hidden" animate="show" className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                        {['Verified chefs', 'Fixed price per slot', 'Pay in cash after the meal'].map((t) => (
                            <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-haldi" />{t}</li>
                        ))}
                    </motion.ul>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, rotate: 1.5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto w-full max-w-xl"
                >
                    <div className="absolute -right-4 -top-4 h-full w-full rounded-[2rem] bg-haldi md:-right-6 md:-top-6" aria-hidden="true" />
                    <SafeImage
                        src={images.heroKarahi}
                        alt="Chicken karahi cooking on the stove"
                        className="relative aspect-[4/5] rounded-[2rem] shadow-2xl sm:aspect-[5/5]"
                        imgClassName="animate-ken-burns"
                    />
                    <Steam className="absolute left-[38%] top-[12%] h-16 w-24 text-cream/90 drop-shadow" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        className="absolute -bottom-6 -left-2 max-w-[16rem] rounded-2xl border border-line bg-white p-4 shadow-xl sm:-left-8"
                    >
                        <p className="font-serif text-lg font-semibold leading-tight">Cooked in your kitchen</p>
                        <p className="mt-1 text-sm text-muted">2-hour slots from 8 am to 10 pm. Book 2 hours ahead.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
                        className="absolute -right-2 top-10 rotate-6 rounded-full bg-mirch px-4 py-2 text-sm font-bold text-white shadow-lg sm:-right-6"
                    >
                        from Rs 500 / slot
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

// ---------------- Dish ribbon ----------------
const DishRibbon = () => (
    <div className="relative -rotate-1 overflow-hidden border-y border-dhania-dark/20 bg-dhania py-4 text-cream" aria-hidden="true">
        <motion.div
            className="flex w-max gap-10 whitespace-nowrap font-serif text-2xl"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        >
            {[...dishes, ...dishes].map((d, i) => (
                <span key={i} className="flex items-center gap-10">
                    {d} <span className="text-haldi">✦</span>
                </span>
            ))}
        </motion.div>
    </div>
)

// ---------------- How it works ----------------
const steps = [
    { n: '1', title: 'Pick a chef and a slot', text: 'Filter by city, cuisine and price. Tell the chef what to cook and for how many people.', img: images.tableSpread, alt: 'A table full of home-cooked dishes', tall: false },
    { n: '2', title: 'Add groceries if you like', text: 'Choose atta, chicken, masala and more from our city store. We deliver them to the chef.', img: images.rollingPin, alt: 'Dough and a rolling pin', tall: true },
    { n: '3', title: 'The chef cooks at your place', text: 'Fresh food in your own kitchen. Pay the chef in cash after the meal.', img: images.rotiOnTawa, alt: 'Hands cooking roti on a tawa', tall: false }
]

const HowItWorks = () => (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <Reveal className="max-w-2xl">
            <p className="font-semibold text-mirch">How it works</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">Three steps from craving to dastarkhwan.</h2>
        </Reveal>

        <div className="mt-14 grid items-end gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.15} className="relative">
                    {i < steps.length - 1 && <DashedArrow className="absolute -right-10 top-6 z-10 hidden h-10 w-28 md:block" />}
                    <div className="group">
                        <SafeImage src={step.img} alt={step.alt} className={`rounded-2xl ${step.tall ? 'aspect-[4/5]' : 'aspect-[4/3]'}`} imgClassName="transition-transform duration-700 group-hover:scale-105" />
                        <div className="mt-5 flex gap-4">
                            <span className="font-serif text-5xl font-semibold leading-none text-haldi">{step.n}</span>
                            <div>
                                <h3 className="font-serif text-xl font-semibold">{step.title}</h3>
                                <p className="mt-1.5 text-muted">{step.text}</p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            ))}
        </div>
    </section>
)

// ---------------- Featured chefs (live from the API) ----------------
const FeaturedChefs = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['chefs', 'featured'],
        queryFn: async () => (await api.get('/chefs', { params: { limit: 4 } })).data.chefs,
        retry: 1
    })

    const chefs = data || []

    return (
        <section className="bg-surface py-24">
            <div className="mx-auto max-w-7xl px-5 md:px-8">
                <Reveal className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-xl">
                        <p className="font-semibold text-mirch">Our chefs</p>
                        <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">Real home cooks, checked by us.</h2>
                        <p className="mt-3 text-muted">Every chef verifies their phone, signs our contract and is approved by our team before you can book them.</p>
                    </div>
                    <Link to="/chefs" className="rounded-xl border border-dhania px-5 py-2.5 font-semibold text-dhania transition hover:bg-dhania hover:text-cream">
                        See all chefs →
                    </Link>
                </Reveal>

                <div className="mt-12">
                    {isLoading && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/70" />)}
                        </div>
                    )}

                    {!isLoading && (isError || chefs.length === 0) && (
                        <Reveal className="grid items-center gap-8 overflow-hidden rounded-3xl bg-white md:grid-cols-2">
                            <SafeImage src={images.biryaniClay} alt="Biryani in a clay bowl" className="aspect-[16/10] md:aspect-auto md:h-full" />
                            <div className="p-8 md:p-10">
                                <h3 className="font-serif text-3xl font-semibold">Our first chefs are joining.</h3>
                                <p className="mt-3 text-muted">We are verifying home chefs in Lahore, Karachi and Islamabad right now. If you cook the way your family loves, be one of the first.</p>
                                <Link to="/signup?role=chef" className="mt-6 inline-block rounded-xl bg-mirch px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                                    Join as a chef
                                </Link>
                            </div>
                        </Reveal>
                    )}

                    {!isLoading && chefs.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {chefs.map((chef, i) => (
                                <Reveal key={chef.id} delay={i * 0.1} className={i === 0 && chefs.length > 2 ? 'md:col-span-2' : ''}>
                                    <ChefCard chef={chef} featured={i === 0 && chefs.length > 2} />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

// ---------------- For students and flatmates ----------------
const MissingHome = () => (
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 md:px-8 lg:grid-cols-2">
        <Reveal className="relative order-2 lg:order-1">
            <SafeImage src={images.steelThali} alt="Home food served on a steel tray" className="aspect-[5/4] rounded-[2rem]" />
            <div className="absolute -bottom-8 right-4 w-56 rotate-[-3deg] rounded-2xl bg-haldi p-5 shadow-xl sm:right-10">
                <p className="text-sm font-semibold text-ink/70">4 flatmates, 1 chef</p>
                <p className="mt-1 font-serif text-3xl font-semibold">Rs 375</p>
                <p className="text-sm text-ink/70">each, for a Rs 1,500 slot</p>
            </div>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
            <p className="font-semibold text-mirch">For students and working bachelors</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">
                Ammi ka khana <span className="relative inline-block">yaad aa raha hai?<Underline className="absolute -bottom-2 left-0 h-3 w-full" color="var(--color-mirch)" /></span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
                New city, hostel mess, the same fast food every night. Get your flatmates together, book one chef for two hours and stock the fridge with two or three days of real home food.
            </p>
            <ul className="mt-8 space-y-4">
                {[
                    ['Split the cost', 'One booking, shared by the whole flat.'],
                    ['No shopping trips', 'Groceries go straight from our store to the chef.'],
                    ['Your recipe, your spice level', 'Write exactly what you want in the note.']
                ].map(([title, text]) => (
                    <li key={title} className="flex gap-4">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dhania-soft text-dhania">✓</span>
                        <div>
                            <p className="font-semibold">{title}</p>
                            <p className="text-muted">{text}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Reveal>
    </section>
)

// ---------------- Price example ----------------
const PriceExample = () => (
    <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <Reveal className="grid gap-10 rounded-[2rem] border border-line bg-white p-8 md:grid-cols-[1fr_1.1fr] md:p-12">
            <div>
                <p className="font-semibold text-mirch">No surprises</p>
                <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">You see the full price before you book.</h2>
                <p className="mt-4 text-muted">The chef's rate is fixed per two-hour slot. Groceries are charged at our store price, and delivery is free on orders of Rs 500 or more.</p>
            </div>
            <div className="rounded-2xl bg-surface p-6 md:p-8">
                <p className="text-sm font-semibold text-muted">Example: karahi for 6, Saturday 6–8 pm</p>
                <dl className="mt-5 space-y-3">
                    {[['Chef fee', 'Rs 1,500'], ['Groceries (chicken, tomatoes, masala)', 'Rs 650'], ['Delivery to the chef', 'Free']].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-dashed border-line pb-3">
                            <dt className="text-muted">{k}</dt>
                            <dd className="font-semibold">{v}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-5 flex items-end justify-between">
                    <span className="font-semibold">Pay the chef in cash</span>
                    <span className="font-serif text-4xl font-semibold text-dhania">Rs 2,150</span>
                </div>
            </div>
        </Reveal>
    </section>
)

// ---------------- Join as a chef ----------------
const CookWithUs = () => (
    <section className="relative overflow-hidden bg-dhania-dark text-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2">
            <Reveal>
                <p className="font-semibold text-haldi">For home chefs</p>
                <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">Your cooking already has fans. Let it earn.</h2>
                <p className="mt-5 max-w-lg text-lg text-cream/75">Set your own rate, choose the requests you accept, and cook close to home. Chefs on our contract get medical insurance and other perks.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link to="/signup?role=chef" className="rounded-xl bg-haldi px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-lg">Join as a chef</Link>
                    <Link to="/about" className="rounded-xl border border-cream/30 px-6 py-3 font-semibold transition hover:bg-cream/10">How it works for chefs</Link>
                </div>
            </Reveal>
            <Reveal delay={0.15} className="grid grid-cols-2 gap-4">
                <SafeImage src={images.biryaniBowl} alt="A bowl of biryani" className="aspect-[3/4] rounded-2xl" />
                <SafeImage src={images.bbq} alt="Grilled meat and vegetables" className="mt-10 aspect-[3/4] rounded-2xl" />
            </Reveal>
        </div>
    </section>
)

const Home = () => (
    <>
        <Hero />
        <DishRibbon />
        <HowItWorks />
        <FeaturedChefs />
        <MissingHome />
        <PriceExample />
        <CookWithUs />
    </>
)

export default Home
