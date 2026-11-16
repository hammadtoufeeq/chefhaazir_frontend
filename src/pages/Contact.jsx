import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/api'
import { contact, WEB3FORMS_KEY } from '../constants/contact'
import { FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const subjects = [
    'Help with a booking',
    'Groceries & delivery',
    'Dawat or event booking',
    'Become a chef',
    'Run a city grocery store',
    'Payments & settlements',
    'Something else'
]

const MESSAGE_MAX = 1000
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const faqs = [
    { q: 'How do I pay?', a: 'In cash, to the chef, after the meal. You pay the chef’s fee plus any groceries and delivery you added. There is no advance payment.' },
    { q: 'Can I cancel or reschedule?', a: 'You can cancel for free until 1.5 hours before the slot from My Bookings. To change the time, cancel and send a new request for another slot.' },
    { q: 'Who buys the groceries?', a: `Our own store in your city. Add items on the booking form; once the chef accepts, the store delivers them to the chef, who brings them along. Delivery is free from Rs ${FREE_DELIVERY_FROM}, otherwise Rs ${DELIVERY_FEE}.` },
    { q: 'How fast does a chef reply?', a: 'Within 15 minutes. If the chef doesn’t answer in time, the request expires and you can book someone else.' },
    { q: 'What if something goes wrong?', a: 'Report an issue on the booking from the slot start until 24 hours after it ends. Our team reviews every report and decides.' }
]

const Label = ({ htmlFor, children, hint }) => (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-ink/70">
        {children} {hint && <span className="font-medium normal-case tracking-normal text-muted">{hint}</span>}
    </label>
)
const fieldClass = (bad) => `mt-2 w-full rounded-lg border bg-cream/60 px-3.5 py-3 text-[14px] outline-none transition placeholder:text-muted/80 focus:bg-white focus:ring-2 ${bad ? 'border-rust focus:ring-rust/20' : 'border-line focus:border-sage focus:ring-sage/20'}`

const ContactForm = ({ onSent }) => {
    const { user } = useAuth()
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: subjects[0], message: '', botcheck: false })
    const [touched, setTouched] = useState({})
    const [status, setStatus] = useState({ state: 'idle', error: '' })

    const errors = {
        name: form.name.trim().length < 2 ? 'Please enter your name' : '',
        email: !emailOk(form.email.trim()) ? 'Please enter a valid email' : '',
        message: form.message.trim().length < 10 ? 'Please write at least 10 characters' : ''
    }
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
    const blur = (k) => () => setTouched({ ...touched, [k]: true })
    const show = (k) => touched[k] && errors[k]

    const submit = async (e) => {
        e.preventDefault()
        setTouched({ name: true, email: true, message: true })
        if (errors.name || errors.email || errors.message) return
        if (!WEB3FORMS_KEY) {
            setStatus({ state: 'error', error: 'The contact form is not set up yet. Please try again later.' })
            return
        }
        setStatus({ state: 'sending', error: '' })
        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: `Chef Haazir: ${form.subject}`,
                    from_name: 'Chef Haazir website',
                    name: form.name.trim(),
                    email: form.email.trim(),
                    topic: form.subject,
                    message: form.message.trim(),
                    botcheck: form.botcheck
                })
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.message)
            setStatus({ state: 'idle', error: '' })
            onSent(form.name.trim().split(' ')[0])
            setForm({ ...form, message: '' })
            setTouched({})
        } catch {
            setStatus({ state: 'error', error: 'Your message could not be sent. Please check your connection and try again.' })
        }
    }

    return (
        <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <Label htmlFor="c-name">Aap ka naam / Full name</Label>
                    <input id="c-name" value={form.name} onChange={set('name')} onBlur={blur('name')} maxLength={50} autoComplete="name" placeholder="e.g. Fatima Tariq" aria-invalid={!!show('name')} className={fieldClass(show('name'))} />
                    {show('name') && <p className="mt-1.5 text-[12px] text-rust">{errors.name}</p>}
                </div>
                <div>
                    <Label htmlFor="c-email">Email address</Label>
                    <input id="c-email" type="email" value={form.email} onChange={set('email')} onBlur={blur('email')} autoComplete="email" placeholder="you@example.com" aria-invalid={!!show('email')} className={fieldClass(show('email'))} />
                    {show('email') && <p className="mt-1.5 text-[12px] text-rust">{errors.email}</p>}
                </div>
            </div>

            <div className="mt-5">
                <Label htmlFor="c-subject">Mauzoo / Subject</Label>
                <span className="relative block">
                    <select id="c-subject" value={form.subject} onChange={set('subject')} className={`${fieldClass(false)} appearance-none pr-10`}>
                        {subjects.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3.5 top-1/2 mt-1 -translate-y-1/2 text-muted" />
                </span>
            </div>

            <div className="mt-5">
                <Label htmlFor="c-message" hint={`${form.message.length} / ${MESSAGE_MAX}`}>Paigham / Message</Label>
                <textarea id="c-message" rows={6} value={form.message} onChange={set('message')} onBlur={blur('message')} maxLength={MESSAGE_MAX}
                    placeholder="Tell us how we can help. For a booking, add the chef’s name, date and slot." aria-invalid={!!show('message')} className={`${fieldClass(show('message'))} resize-y`} />
                {show('message') && <p className="mt-1.5 text-[12px] text-rust">{errors.message}</p>}
            </div>

            {/* Spam trap for bots, hidden from people */}
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" checked={form.botcheck} onChange={(e) => setForm({ ...form, botcheck: e.target.checked })} className="hidden" />

            {status.state === 'error' && <p role="alert" className="mt-4 rounded-lg bg-rust-soft px-4 py-3 text-[13px] text-rust-dark">{status.error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[12px] text-muted"><Icon name="checkCircle" size={15} className="text-sage" /> Goes straight to the Chef Haazir team</p>
                <button disabled={status.state === 'sending'} className="flex items-center justify-center gap-2 rounded-lg bg-sage-dark px-6 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-sage disabled:opacity-60">
                    {status.state === 'sending' ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending…</> : <>Send message <Icon name="arrowRight" size={16} /></>}
                </button>
            </div>
        </form>
    )
}

const SentCard = ({ name, onAgain }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="rounded-xl border border-sage/30 bg-sage-soft/70 p-6">
        <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="check" size={22} strokeWidth={2.4} /></span>
            <div>
                <p className="flex flex-wrap items-center gap-2 font-serif text-[22px] leading-tight">
                    Shukriya{name ? `, ${name}` : ''}! We’ll get back to you soon.
                    <span className="rounded bg-white px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-sage-dark">Sent</span>
                </p>
                <p className="mt-1.5 text-[13px] text-muted">Your message reached our team. We usually reply by email within a day.</p>
            </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sage/20 pt-4">
            <ol className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] font-semibold text-sage-dark">
                <li className="flex items-center gap-1.5"><Icon name="checkCircle" size={14} /> Received</li>
                <li className="flex items-center gap-1.5 text-ink/50"><Icon name="clock" size={14} /> Team reviews</li>
                <li className="flex items-center gap-1.5 text-ink/50"><Icon name="mail" size={14} /> Reply by email</li>
            </ol>
            <button type="button" onClick={onAgain} className="text-[12px] font-bold text-sage-dark underline-offset-4 hover:underline">Send another message</button>
        </div>
    </motion.div>
)

const Faq = () => {
    const [open, setOpen] = useState(0)
    return (
        <div className="mt-7">
            <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-[22px]">Frequently asked</h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-rust">Instant answers</span>
            </div>
            <ul className="mt-3 space-y-2">
                {faqs.map((f, i) => {
                    const isOpen = open === i
                    return (
                        <li key={f.q} className="overflow-hidden rounded-lg border border-line bg-white">
                            <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13.5px] font-bold">
                                {f.q}
                                <Icon name="chevronDown" size={16} className={`shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 text-[13px] leading-relaxed text-muted">
                                        <span className="block pb-4">{f.a}</span>
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

const Assist = () => {
    const items = [
        contact.whatsapp && { icon: 'chat', label: 'WhatsApp', value: contact.whatsapp, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` },
        contact.email && { icon: 'mail', label: 'Official inquiries', value: contact.email, href: `mailto:${contact.email}` },
        contact.hours && { icon: 'clock', label: 'Support hours', value: contact.hours }
    ].filter(Boolean)

    // Shortcuts to the parts of the app that already handle common requests
    const shortcuts = [
        { icon: 'calendar', label: 'Booking status or cancel', value: 'Open My Bookings', to: '/my-bookings' },
        { icon: 'chef', label: 'Cook with Chef Haazir', value: 'Sign up as a chef', to: '/signup?role=chef' },
        { icon: 'store', label: 'Browse grocery prices', value: 'City grocery stores', to: '/grocery' }
    ]

    const Row = ({ icon, label, value, href, to }) => {
        const inner = (
            <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-soft text-sage-dark"><Icon name={icon} size={18} /></span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
                    <span className="block truncate text-[13.5px] font-bold text-ink">{value}</span>
                </span>
                {(href || to) && <Icon name="arrowUpRight" size={16} className="shrink-0 text-muted transition group-hover:text-rust" />}
            </>
        )
        const cls = 'group flex items-center gap-3 rounded-lg border border-line bg-white p-3.5 transition hover:border-sage/50'
        if (to) return <Link to={to} className={cls}>{inner}</Link>
        if (href) return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls}>{inner}</a>
        return <div className={cls}>{inner}</div>
    }

    return (
        <aside className="rounded-xl border border-line bg-sand/70 p-5 sm:p-6 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rust">Direct assistance</p>
            <h2 className="mt-1.5 font-serif text-[24px]">Concierge desk</h2>
            <p className="mt-1 text-[13px] text-muted">Help for home food lovers, chefs and grocery partners across Pakistan.</p>
            <div className="mt-5 space-y-2.5">
                {[...items, ...shortcuts].map((r) => <Row key={r.label} {...r} />)}
            </div>
            <Faq />
            <p className="mt-6 flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-[12px] leading-relaxed text-muted">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-sage" />
                Every chef on Chef Haazir has a verified phone number, has signed our contract, and is approved by our team before their first booking.
            </p>
        </aside>
    )
}

// One card per open city store, with its live number of chefs
const CityStrip = () => {
    const { data: stores = [] } = useQuery({
        queryKey: ['grocery', 'stores'],
        queryFn: async () => (await api.get('/grocery/stores')).data.stores
    })
    const counts = useQueries({
        queries: stores.map((s) => ({
            queryKey: ['stats', 'chefs', s.city],
            queryFn: async () => (await api.get('/chefs', { params: { city: s.city, limit: 1 } })).data.pagination.total
        }))
    })
    if (!stores.length) return null

    return (
        <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((s, i) => (
                    <Reveal key={s._id} delay={i * 0.06}>
                        <Link to={`/chefs?city=${encodeURIComponent(s.city)}`} className="group block h-full rounded-xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="font-serif text-[24px]">{s.city}</h3>
                                <span className="rounded bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage-dark">City store</span>
                            </div>
                            <p className="mt-1 text-[13px] text-muted">{s.name} · groceries delivered to your chef</p>
                            <p className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-rust">
                                {counts[i]?.data !== undefined ? `${counts[i].data} verified ${counts[i].data === 1 ? 'chef' : 'chefs'}` : 'Verified chefs'}
                                <Icon name="arrowRight" size={14} className="transition group-hover:translate-x-1" />
                            </p>
                        </Link>
                    </Reveal>
                ))}
            </div>
        </section>
    )
}

const Contact = () => {
    const [sentTo, setSentTo] = useState(null)

    return (
        <div className="pb-20 pt-10">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <header>
                    <p className="eyebrow">Rabta & concierge</p>
                    <h1 className="mt-3 font-serif text-[46px] leading-none tracking-tight sm:text-[58px]">Baat karein<span className="text-rust">.</span></h1>
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">We usually reply within a day. Whether you are planning a dawat, need help with a booking, or want to cook with us as a chef, our door is open.</p>
                </header>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start">
                    <div className="space-y-5">
                        <ContactForm onSent={setSentTo} />
                        <AnimatePresence>{sentTo !== null && <SentCard name={sentTo} onAgain={() => setSentTo(null)} />}</AnimatePresence>
                    </div>
                    <Assist />
                </div>
            </div>
            <CityStrip />
        </div>
    )
}

export default Contact
