import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import { FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import GreenHero, { Accent } from '../components/GreenHero'

// ---------------------------------------------------------------------------
// About page. Every number comes from the API and every promise matches a real
// rule in the app (verification, fixed slot price, cash after the meal,
// 1.5-hour free cancellation, issue reports reviewed by the team).
// Colours: cream #FAF6EE and sand #F3EEE6 alternate; rust #A3410F labels.
// ---------------------------------------------------------------------------

const CREAM = 'bg-[#FAF6EE]'
const SAND = 'bg-[#F3EEE6]'
const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`

const useStats = () => {
    const stores = useQuery({ queryKey: ['grocery', 'stores'], queryFn: async () => (await api.get('/grocery/stores')).data.stores ?? [] })
    const filters = useQuery({ queryKey: ['chefs', 'filters', null], queryFn: async () => (await api.get('/chefs/filters')).data })
    return {
        chefs: filters.data?.totalChefs,
        cuisines: filters.data?.cuisines?.length,
        minPrice: filters.data?.price?.min,
        stores: stores.data?.length
    }
}

const Eyebrow = ({ children, className = '' }) => <p className={`text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#A3410F] ${className}`}>{children}</p>
const Tag = ({ children, tone = 'beige' }) => {
    const tones = { beige: 'bg-[#EFE7D8] text-[#5B4A2F]', rust: 'bg-[#F9E1CF] text-[#A3410F]', mint: 'bg-[#D3F0DE] text-[#17392C]' }
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${tones[tone]}`}>{children}</span>
}
const Title = ({ children, className = '' }) => <h2 className={`font-serif text-[34px] leading-[1.1] tracking-tight text-[#1E1B16] sm:text-[40px] ${className}`}>{children}</h2>
const Photo = ({ src, alt, className = '', label, labelDark = true, corner }) => (
    <div className="relative">
        <SafeImage src={src} alt={alt} className={`rounded-xl ${className}`} />
        {label && <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${labelDark ? 'bg-[#17392C] text-white' : 'bg-white/95 text-[#17392C]'}`}>{label}</span>}
        {corner && <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#17392C]">{corner}</span>}
    </div>
)

// ---------------- 1. Hero ----------------
const Hero = ({ stats }) => (
    <GreenHero
        pill="The Haazir manifesto"
        title={<>Every city has someone who <Accent>misses home food.</Accent></>}
        text={<>In busy hostels, long office shifts and newly rented flats across Pakistan, students and working bachelors miss the comfort of <strong className="font-semibold text-white">ammi ke haath ka khana</strong>. Not restaurant oil, not another delivery bag. Just honest, warm food cooked in your own kitchen by a verified home chef.</>}
        stats={[[stats.chefs, 'Verified home chefs'], [stats.stores, 'City grocery stores'], [cities.length, 'Cities served']]}
        checks={[['phone', 'Phone verified'], ['shield', 'Contract signed & admin approved'], ['wallet', 'Cash after the meal']]}
        photo={{ src: images.rotiThali, alt: 'Roti, daal and salan on a steel plate', tag: 'Lunch slot · 12 – 2 PM', badge: ['pot', 'Daal, roti & salan'], time: '2-hr slot', caption: ['A warm meal that feels like home.', 'Your kitchen'] }}
    />
)

// ---------------- 2. Why we exist ----------------
const WhyWeExist = () => (
    <section className={`${SAND} py-20`}>
        <div className="mx-auto max-w-5xl px-4 md:px-8">
            <Reveal className="text-center">
                <Tag tone="rust">Genesis & purpose</Tag>
                <Title className="mt-4">Why Chef Haazir exists</Title>
            </Reveal>
            <Reveal className="mt-8 grid gap-6 text-[14px] leading-relaxed text-[#5E5A52] md:grid-cols-2 md:gap-10">
                <p>In Pakistan, the best cooking doesn’t happen in restaurants. It happens in homes, where mothers, aunties and home cooks have spent years perfecting slow bhunai, balanced masalas and soft tawa rotis. Yet finding a trustworthy cook for a few hours still happens through word of mouth: no fixed price, no record and no accountability.</p>
                <p>At the same time, students and young professionals who move to Lahore, Karachi or Islamabad are stuck between greasy takeaway and expensive delivery. Chef Haazir brings the two together: a verified home chef, a fixed 2-hour slot, a fixed price, and groceries from our own city store, with every booking on record.</p>
            </Reveal>
            <Reveal className="relative mx-auto mt-12 max-w-xl rounded-2xl bg-white px-8 py-9 text-center shadow-card">
                <span aria-hidden="true" className="absolute left-5 top-2 font-serif text-[70px] leading-none text-[#A3410F]/20">“</span>
                <p className="font-serif text-[22px] italic leading-snug text-[#A3410F]">Ghar ka khana is not just food. It is comfort, memory, and a mother’s silent prayer served warm.</p>
                <p className="mt-5 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8275]"><span className="h-px w-7 bg-[#E2D8C6]" /> The Haazir philosophy <span className="h-px w-7 bg-[#E2D8C6]" /></p>
            </Reveal>
        </div>
    </section>
)

// ---------------- 3. Four promises ----------------
const PillarCard = ({ children, delay = 0 }) => (
    <Reveal delay={delay}><article className="flex h-full flex-col rounded-2xl bg-white p-3 shadow-card">{children}</article></Reveal>
)

const FourPillars = ({ stats }) => (
    <section className={`${CREAM} py-20`}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal>
                <Eyebrow>Our uncompromising standard</Eyebrow>
                <Title className="mt-3 max-w-xl">Our 4 pillar promise to every kitchen & home</Title>
                <p className="mt-3 max-w-xl text-[14px] text-[#5E5A52]">Trust is built through transparency, fair prices and accountability. We are not a faceless delivery app; every chef and every booking is on record.</p>
            </Reveal>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
                <PillarCard>
                    <Photo src={images.rotiOnTawa} alt="A home chef making fresh roti on a tawa" className="h-60" label={<><Icon name="shield" size={12} /> Phone & admin verified</>} />
                    <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                        <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-[21px]">1. Rigorously verified chefs</h3><span className="shrink-0 rounded bg-[#D3F0DE] px-2 py-0.5 text-[10px] font-bold text-[#17392C]">3-step check</span></div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#5E5A52]">A chef appears to customers only after verifying their phone number, signing our contract and legal declaration, and being approved by our team.</p>
                        <div className="h-5 shrink-0" /><div className="mt-auto grid grid-cols-3 gap-3 border-t border-[#EFE7D8] pt-4">
                            {[['Phone check', 'Code sent by our team'], ['Contract', 'Signed & declared'], ['Admin review', 'Approved by us']].map(([a, b]) => (
                                <div key={a}><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1E1B16]/75">{a}</p><p className="text-[11.5px] text-[#8A8275]">{b}</p></div>
                            ))}
                        </div>
                    </div>
                </PillarCard>

                <PillarCard delay={0.06}>
                    <Photo src={images.spices} alt="Whole spices on a board" className="h-60" corner={<><Icon name="tag" size={13} className="text-[#A3410F]" /> Zero hidden fees</>} />
                    <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                        <div className="flex items-baseline justify-between gap-3"><h3 className="font-serif text-[21px]">2. Fair fixed pricing</h3>{stats.minPrice ? <span className="shrink-0 font-serif text-[17px] font-semibold text-[#A3410F]">from {money(stats.minPrice)} / 2h</span> : null}</div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#5E5A52]">Every chef sets one price for a 2-hour slot, shown before you book. No surge pricing, no extras added later. Grocery prices are locked into your booking.</p>
                        <dl className="mt-4 space-y-2 rounded-lg bg-[#FAF6EE] p-3.5 text-[12px]">
                            {[['Chef booking slot (2 hours)', 'Set by the chef'], ['Groceries', 'Locked at booking'], [`Delivery under ${money(FREE_DELIVERY_FROM)}`, `${money(DELIVERY_FEE)}, else free`], ['Chef’s direct share', '90% of the fee']].map(([k, v], i) => (
                                <div key={k} className="flex justify-between gap-3"><dt className="text-[#8A8275]">{k}</dt><dd className={i === 3 ? 'font-bold text-[#A3410F]' : 'font-semibold'}>{v}</dd></div>
                            ))}
                        </dl>
                    </div>
                </PillarCard>

                <PillarCard delay={0.1}>
                    <Photo src={images.foodTable} alt="Plates of home-cooked food on a table" className="h-60" label={<><span className="h-1.5 w-1.5 rounded-full bg-[#C2E35A]" /> Support desk active</>} />
                    <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                        <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-[21px]">3. Real human support</h3><span className="shrink-0 rounded bg-[#F9E1CF] px-2 py-0.5 text-[10px] font-bold text-[#A3410F]">Reply within a day</span></div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#5E5A52]">No chatbots. Messages from the contact form go straight to the Chef Haazir team, and a real person replies. For a booking, the chef’s phone is shared as soon as they accept.</p>
                        <div className="h-5 shrink-0" /><div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-[#EFE7D8] pt-4 text-[12px] font-semibold text-[#1E1B16]/80">
                            <span className="flex items-center gap-1.5"><Icon name="chat" size={15} className="text-[#A3410F]" /> Real person replies</span>
                            <span className="flex items-center gap-1.5"><Icon name="undo" size={15} className="text-[#A3410F]" /> Free cancel until 1.5 hrs before</span>
                        </div>
                    </div>
                </PillarCard>

                <PillarCard delay={0.14}>
                    <Photo src={images.choppingVeg} alt="Hands chopping fresh vegetables" className="h-60" label={<><Icon name="checkCircle" size={12} /> Every booking on record</>} />
                    <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                        <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-[21px]">4. Accountability guarantee</h3><span className="shrink-0 rounded bg-[#D3F0DE] px-2 py-0.5 text-[10px] font-bold text-[#17392C]">Reviewed by our team</span></div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#5E5A52]">If something goes wrong, the customer or the chef can report it. Our team reviews every report and decides, and accounts with genuine problems can be suspended at once.</p>
                        <dl className="mt-4 space-y-2 rounded-lg bg-[#FAF6EE] p-3.5 text-[12px]">
                            {[['Report window', 'Slot start to 24 hrs after'], ['Decision', 'Genuine or dismissed'], ['Repeat problems', 'Account suspended']].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-3"><dt className="text-[#8A8275]">{k}</dt><dd className="flex items-center gap-1 font-semibold text-[#17392C]"><Icon name="check" size={12} strokeWidth={2.6} /> {v}</dd></div>
                            ))}
                        </dl>
                    </div>
                </PillarCard>
            </div>
        </div>
    </section>
)

// ---------------- 4. Vetting steps ----------------
const vetting = [
    { k: 'Identity', t: 'Chef profile', d: 'Name, mobile number, city, kitchen address, cuisines, rate and a short bio, all checked on sign-up.', f: ['user', 'Real details only'] },
    { k: 'Phone', t: 'Verification code', d: 'Our team sends a 6-digit code to the chef’s mobile. The owner of that number is responsible for the account.', f: ['phone', 'Number verified'] },
    { k: 'Contract', t: 'Chef contract', d: 'Every chef signs the Chef Haazir contract and a legal declaration: no direct dealing with customers outside the app.', f: ['lock', 'Signed & declared'] },
    { k: 'Approval', t: 'Admin review', d: 'Our team reviews the profile before approving it. Only approved chefs appear on Find Chefs.', f: ['shield', 'Approved by us'] },
    { k: 'Accountability', t: 'Live feedback loop', d: 'Customers can report any problem after a booking. Genuine reports and unpaid commission pause the chef’s account.', f: ['undo', 'Always on'] }
]

const Vetting = () => (
    <section className={`${SAND} py-20`}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
                <Tag>Rigorous quality control</Tag>
                <Title className="mt-4">The 5-step chef vetting standard</Title>
                <p className="mt-3 text-[14px] text-[#5E5A52]">This is how every chef is checked before anyone books them, and how they stay accountable after.</p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {vetting.map((v, i) => (
                    <Reveal key={v.k} delay={i * 0.06}>
                        <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F9E1CF] font-serif text-[15px] font-semibold text-[#A3410F]">{i + 1}</span>
                            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A3410F]">{v.k}</p>
                            <h3 className="mt-1 font-serif text-[19px] leading-tight">{v.t}</h3>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-[#5E5A52]">{v.d}</p>
                            <div className="h-5 shrink-0" /><p className="mt-auto flex items-center gap-1.5 border-t border-[#EFE7D8] pt-3 text-[11px] font-semibold text-[#17392C]"><Icon name={v.f[0]} size={13} className="text-[#5E8A2E]" /> {v.f[1]}</p>
                        </article>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

// ---------------- 5. Groceries ----------------
const Groceries = () => (
    <section className={`${CREAM} py-20`}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-14">
            <Reveal>
                <div className="relative overflow-hidden rounded-2xl shadow-lift">
                    <SafeImage src={images.vegMarket} alt="Fresh vegetables at a market" className="h-80 lg:h-[420px]" />
                    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-md bg-[#17392C] px-3 py-1.5 text-[11px] font-semibold text-white"><Icon name="truck" size={13} className="text-[#C2E35A]" /> Delivered to your chef before the slot</span>
                </div>
            </Reveal>
            <Reveal delay={0.08}>
                <Eyebrow className="flex items-center gap-1.5"><Icon name="basket" size={13} /> Zero grocery hassle</Eyebrow>
                <Title className="mt-3">Fresh groceries & our city kiryana</Title>
                <p className="mt-4 text-[14px] leading-relaxed text-[#5E5A52]">No more late trips to the market or running out of zeera and adrak halfway through cooking. When you book a chef, pick atta, meat, sabzi and masalas from our own store in your city. The store packs them once the chef accepts and delivers them to the chef’s home, and the chef brings everything to your kitchen.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[['lock', 'Prices locked at booking', 'The price you see is the price on your bill.'], ['truck', `Free delivery from ${money(FREE_DELIVERY_FROM)}`, `Below that, delivery is a flat ${money(DELIVERY_FEE)}.`]].map(([icon, t, d]) => (
                        <div key={t} className="rounded-xl bg-[#F3EEE6] p-4">
                            <p className="flex items-center gap-2 text-[13px] font-bold text-[#1E1B16]"><Icon name={icon} size={15} className="text-[#A3410F]" /> {t}</p>
                            <p className="mt-1 text-[12px] text-[#5E5A52]">{d}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-semibold text-[#1E1B16]/80">
                    <span className="flex items-center gap-1.5"><Icon name="checkCircle" size={14} className="text-[#5E8A2E]" /> Packed after the chef accepts</span>
                    <span className="flex items-center gap-1.5"><Icon name="checkCircle" size={14} className="text-[#5E8A2E]" /> Or cook with what’s at home</span>
                </div>
                <Link to="/grocery" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#17392C] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#0F2A20]">Browse city stores <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" /></Link>
            </Reveal>
        </div>
    </section>
)

// ---------------- 6. Chef contract ----------------
const perks = [['heart', 'Medical insurance cover'], ['wallet', '90% of every fee to the chef'], ['pin', 'Cook in your own city'], ['tag', 'No commission on cancellations']]
const promises = ['Set your own rate: Rs 500 – 20,000', 'Mark the slots you can’t cook', 'Accept only requests that suit you', 'Commission only on completed bookings']

const ChefContract = () => (
    <section id="chef-contract" className={`scroll-mt-20 ${SAND} py-20`}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <Reveal>
                <figure className="rounded-2xl bg-white p-3 shadow-lift">
                    <SafeImage src={images.panCooking} alt="A home chef stirring a pan on the stove" className="aspect-[5/4] rounded-xl" />
                    <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
                        <span><span className="block font-serif text-[18px]">The Chef Haazir contract</span><span className="text-[12px] text-[#8A8275]">Signed by every chef before their first booking</span></span>
                        <span className="rounded-md bg-[#17392C] px-2.5 py-1 text-[11px] font-bold text-white">10% commission</span>
                    </figcaption>
                </figure>
            </Reveal>
            <Reveal delay={0.08}>
                <Eyebrow className="flex items-center gap-1.5"><Icon name="chef" size={13} /> Dignity in labour</Eyebrow>
                <Title className="mt-3">Empowering the home chefs of Pakistan</Title>
                <p className="mt-4 text-[14px] leading-relaxed text-[#5E5A52]">Chef Haazir is built around a contract that protects our chefs. For too long, the skill of keeping a household fed was taken for granted. We give mothers, aunties and home cooks a dignified way to earn from it, in respectable homes in their own city.</p>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5E5A52]">Every chef sets their own price and their own availability. Chefs collect cash from the customer after the meal and settle the 10% commission with us later. In return, they deal with customers only through Chef Haazir.</p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {perks.map(([icon, t]) => <span key={t} className="flex items-center gap-2 rounded-full bg-[#EFE7D8] px-3.5 py-2 text-[12.5px] font-semibold text-[#1E1B16]/85"><Icon name={icon} size={14} className="text-[#A3410F]" /> {t}</span>)}
                </div>
                <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {promises.map((t) => <li key={t} className="flex items-start gap-2 text-[12.5px] text-[#5E5A52]"><Icon name="checkCircle" size={14} className="mt-0.5 shrink-0 text-[#5E8A2E]" /> {t}</li>)}
                </ul>
            </Reveal>
        </div>
    </section>
)

// ---------------- 7. Numbers ----------------
const Impact = ({ stats }) => {
    const tiles = [
        [stats.chefs, 'Verified home chefs', 'Phone-verified and approved by our team'],
        [stats.stores, 'City grocery stores', 'Our own kiryana, one per city'],
        [stats.cuisines, 'Cuisines on offer', 'From desi and karahi to continental'],
        [cities.length, 'Cities served', cities.slice(0, 3).join(', ') + ' and more']
    ]
    return (
        <section className={`${CREAM} py-20`}>
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <Reveal className="mx-auto max-w-2xl text-center">
                    <Eyebrow>Chef Haazir today</Eyebrow>
                    <Title className="mt-3">Cooking across Pakistan</Title>
                    <p className="mt-3 text-[14px] text-[#5E5A52]">Live numbers from the app, updated as new chefs and stores join.</p>
                </Reveal>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {tiles.map(([value, label, sub], i) => (
                        <Reveal key={label} delay={i * 0.06} className="rounded-2xl bg-white p-6 text-center shadow-card">
                            <p className={`font-serif text-[40px] font-semibold leading-none ${i % 2 ? 'text-[#17392C]' : 'text-[#A3410F]'}`}>{value ?? '–'}</p>
                            <p className="mt-3 text-[13px] font-bold text-[#1E1B16]">{label}</p>
                            <p className="mt-1 text-[11.5px] text-[#8A8275]">{sub}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ---------------- 8. The teams behind every booking ----------------
const teams = [
    { icon: 'chef', tone: 'bg-[#D3F0DE] text-[#17392C]', t: 'Chef partner team', r: 'Onboarding & approvals', d: 'Sends verification codes, reviews every chef profile and approves chefs before they go live.' },
    { icon: 'store', tone: 'bg-[#F9E1CF] text-[#A3410F]', t: 'City grocery partners', r: 'One store per city', d: 'Run our kiryana in each city: pack orders once a chef accepts and deliver them before the slot.' },
    { icon: 'shield', tone: 'bg-[#F9E1CF] text-[#A3410F]', t: 'Trust & support desk', r: 'Issues & messages', d: 'Reviews every reported issue, verifies chef payments and replies to messages from the contact form.' }
]

const Teams = () => (
    <section className={`${SAND} py-20`}>
        <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
                <Tag tone="rust">Custodians of taste</Tag>
                <Title className="mt-4">The people behind every booking</Title>
                <p className="mt-3 text-[14px] text-[#5E5A52]">Three teams keep Chef Haazir safe, fair and on time.</p>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
                {teams.map((m, i) => (
                    <Reveal key={m.t} delay={i * 0.08} className="rounded-2xl bg-white p-7 text-center shadow-card">
                        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${m.tone}`}><Icon name={m.icon} size={24} /></span>
                        <h3 className="mt-4 font-serif text-[20px]">{m.t}</h3>
                        <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A3410F]">{m.r}</p>
                        <p className="mt-3 text-[12.5px] leading-relaxed text-[#5E5A52]">{m.d}</p>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
)

// ---------------- 9. FAQ ----------------
const faqs = [
    { q: 'How does the chef get ingredients?', a: `Your choice. Add groceries from our city store when you book and they reach the chef before the slot (free delivery from ${money(FREE_DELIVERY_FROM)}, otherwise ${money(DELIVERY_FEE)}), or the chef cooks with what is already in your kitchen.` },
    { q: 'Are your chefs checked?', a: 'Yes. Every chef verifies their phone number, signs our contract and legal declaration, and is approved by our team before customers can book them.' },
    { q: 'What if I need to cancel my booking?', a: 'Cancel for free from My Bookings until 1.5 hours before the slot. To change the time, cancel and send a request for another slot.' },
    { q: 'Do I pay in advance?', a: 'No. You pay the chef in cash after the meal: the fixed fee for the 2-hour slot plus any groceries and delivery you added.' }
]

const Faq = () => {
    const [open, setOpen] = useState(0)
    return (
        <section className={`${CREAM} py-20`}>
            <div className="mx-auto max-w-5xl px-4 md:px-8">
                <Reveal className="text-center">
                    <Eyebrow>Everything you need to know</Eyebrow>
                    <Title className="mt-3">Frequently asked questions</Title>
                    <p className="mt-3 text-[14px] text-[#5E5A52]">Straight answers about our chefs, groceries and bookings.</p>
                </Reveal>
                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    {faqs.map((f, i) => (
                        <Reveal key={f.q} delay={i * 0.05}>
                            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="w-full rounded-2xl bg-white p-5 text-left shadow-card transition hover:shadow-lift">
                                <span className="flex items-start gap-3">
                                    <Icon name="question" size={18} className="mt-1 shrink-0 text-[#A3410F]" />
                                    <span className="flex-1 font-serif text-[18px] leading-snug">{f.q}</span>
                                    <Icon name="chevronDown" size={16} className={`mt-1.5 shrink-0 text-[#8A8275] transition ${open === i ? 'rotate-180' : ''}`} />
                                </span>
                                <AnimatePresence initial={false}>
                                    {open === i && (
                                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                                            <span className="block pl-[30px] pt-3 text-[13px] leading-relaxed text-[#5E5A52]">{f.a}</span>
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ---------------- 10. Closing call to action ----------------
const Hungry = () => (
    <section className={`${CREAM} px-4 pb-20 md:px-8`}>
        <Reveal className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[24px] px-6 py-12 text-white shadow-lift sm:px-12 lg:py-16"
                style={{ backgroundColor: '#13342A', backgroundImage: 'radial-gradient(circle at 75% 30%, rgba(196,142,62,0.28) 0%, transparent 45%), linear-gradient(135deg, #17392C 0%, #10291F 100%)' }}>
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Dinner is ready</span>
            <h2 className="mt-5 font-serif text-[38px] text-white sm:text-[48px]">Hungry for home?</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">Meet verified home chefs cooking in your city today. Slow-cooked salan, fluffy rotis off the tawa, and the warmth of family dining, in your own kitchen.</p>
            <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/chefs" className="group flex items-center gap-2 rounded-lg bg-[#A3410F] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#84340B]">Find a home chef <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-1" /></Link>
                <Link to="/signup?role=chef" className="rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-[14px] font-bold text-white transition hover:bg-white/10">Join as a kitchen partner</Link>
            </div>
            <p className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-white/70">
                <span className="flex items-center gap-1.5"><Icon name="clock" size={14} /> 7 slots a day, 8 AM – 10 PM</span>
                <span className="flex items-center gap-1.5"><Icon name="wallet" size={14} /> Cash after the meal</span>
                <span className="flex items-center gap-1.5"><Icon name="tag" size={14} /> Fixed price per 2-hour slot</span>
            </p>
            </div>
        </Reveal>
    </section>
)

const About = () => {
    const stats = useStats()
    return (
        <>
            <Hero stats={stats} />
            <WhyWeExist />
            <FourPillars stats={stats} />
            <Vetting />
            <Groceries />
            <ChefContract />
            <Impact stats={stats} />
            <Teams />
            <Faq />
            <Hungry />
        </>
    )
}

export default About
