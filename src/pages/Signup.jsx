import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import { images } from '../constants/images'
import { homeFor } from '../context/AuthContext'
import { useCity } from '../context/CityContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import AuthShell from '../components/AuthShell'

// ---------------- Roles ----------------
const roles = {
    user: {
        title: 'Customer', tag: 'Dining & dawats', line: 'Book home chefs for your home', photo: images.foodTable,
        formTitle: 'Customer profile', formLine: 'For students, families and anyone missing home food.',
        accent: 'border-t-sage', pill: 'bg-sage-soft text-sage-dark', icon: 'user',
        points: [
            { icon: 'chef', text: 'Book a verified chef for a 2-hour slot' },
            { icon: 'basket', text: 'Add groceries from your city store' },
            { icon: 'wallet', text: 'Pay in cash after the meal' }
        ],
        next: ['Find a chef in your city', 'Pick a date and a 2-hour slot', 'The chef accepts within 15 minutes']
    },
    chef: {
        title: 'Chef', tag: 'Culinary artisan', line: 'Cook from your experience and earn', photo: images.rotiOnTawa,
        formTitle: 'Chef partner profile', formLine: 'For home cooks who cook from their own recipes.',
        accent: 'border-t-rust', pill: 'bg-rust-soft text-rust', icon: 'chef',
        points: [
            { icon: 'wallet', text: 'Set your own rate, keep 90% of every fee' },
            { icon: 'heart', text: 'Medical insurance and perks' },
            { icon: 'clock', text: 'Accept only the requests that suit you' }
        ],
        next: ['Enter the 6-digit code our team sends to your phone', 'Accept the chef contract and declaration', 'Our team approves you, then customers can book you']
    },
    grocery_owner: {
        title: 'Grocery owner', tag: 'Kiryana partner', line: 'Run Chef Haazir’s store in your city', photo: images.groceryShelves,
        formTitle: 'Grocery partner profile', formLine: 'For shopkeepers who will run our store in their city.',
        accent: 'border-t-rust-dark', pill: 'bg-rust-soft text-rust-dark', icon: 'store',
        points: [
            { icon: 'basket', text: 'Orders come from confirmed bookings' },
            { icon: 'truck', text: 'Deliver to the chef’s home before the slot' },
            { icon: 'shield', text: 'One approved store per city' }
        ],
        next: ['Our team reviews your store', 'Once approved, add items and prices', 'Pack and deliver orders to chefs']
    }
}
const roleKeys = Object.keys(roles)

// ---------------- Validation (same rules as the backend) ----------------
const PHONE = /^(03\d{9}|\+923\d{9})$/
const cuisineOptions = [...cuisines, 'Other']
const check = {
    name: (v) => (v.trim().length < 2 ? 'Name must be at least 2 characters' : v.trim().length > 50 ? 'Name cannot be more than 50 characters' : ''),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email'),
    password: (v) => (v.length < 8 ? 'At least 8 characters' : !/[a-zA-Z]/.test(v) ? 'Add at least one letter' : !/[0-9]/.test(v) ? 'Add at least one number' : ''),
    phone: (v) => (PHONE.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a Pakistani mobile number, e.g. 03001234567'),
    city: (v) => (cities.includes(v) ? '' : 'Please choose your city'),
    address: (v) => (v.trim().length < 10 ? 'Address must be at least 10 characters' : v.trim().length > 200 ? 'Address cannot be more than 200 characters' : ''),
    storeName: (v) => (v.trim().length < 2 ? 'Store name must be at least 2 characters' : v.trim().length > 60 ? 'Store name cannot be more than 60 characters' : ''),
    cuisines: (v) => (v.length < 1 ? 'Select at least 1 cuisine' : v.length > 5 ? 'You can select up to 5' : ''),
    ratePerSlot: (v) => {
        const n = Number(v)
        if (!v) return 'Enter your rate for a 2-hour slot'
        if (!Number.isInteger(n)) return 'Use a whole number'
        return n < 500 || n > 20000 ? 'Rate must be between Rs 500 and Rs 20,000' : ''
    },
    bio: (v) => (v.trim().length < 10 ? 'Write at least 10 characters about your cooking' : v.trim().length > 300 ? 'Bio cannot be more than 300 characters' : '')
}
const fieldsFor = {
    user: ['name', 'email', 'password', 'phone', 'city', 'address'],
    chef: ['name', 'email', 'password', 'phone', 'city', 'address', 'cuisines', 'ratePerSlot', 'bio'],
    grocery_owner: ['name', 'email', 'password', 'phone', 'storeName', 'city', 'address']
}
const endpoint = { user: '/auth/register/user', chef: '/auth/register/chef', grocery_owner: '/auth/register/grocery-owner' }

const strength = (pw) => [pw.length >= 8, /[a-zA-Z]/.test(pw), /[0-9]/.test(pw), pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length

// ---------------- Small form parts ----------------
const Field = ({ id, label, hint, error, children, aside }) => (
    <div>
        <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={id} className="text-[12.5px] font-bold text-ink/85">{label}</label>
            {aside}
        </div>
        {children}
        {error ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-rust"><Icon name="xCircle" size={14} className="mt-px shrink-0" /> {error}</p>
        ) : hint ? (
            <p className="mt-1.5 text-[11.5px] text-muted">{hint}</p>
        ) : null}
    </div>
)

const inputCls = (bad, extra = '') => `mt-1.5 w-full rounded-lg border px-3.5 py-3 text-[14px] outline-none transition placeholder:text-muted/70 focus:bg-white focus:ring-2 ${bad ? 'border-rust/70 bg-rust-soft/30 focus:ring-rust/20' : 'border-line bg-cream/50 focus:border-sage focus:ring-sage/20'} ${extra}`

const WithIcon = ({ icon, children, right }) => (
    <span className="relative block">
        <Icon name={icon} size={16} className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-muted" />
        {children}
        {right}
    </span>
)

// ---------------- Step 1: choose a role ----------------
const RoleStep = ({ initial, onContinue }) => {
    const [picked, setPicked] = useState(initial || 'user')

    return (
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:px-8">
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3.5 py-1.5 text-[11px] font-bold text-sage-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" /> STEP 1 OF 2 <span className="text-sage/50">•</span> <span className="font-semibold">Role selection</span>
                </span>
                <h1 className="mt-5 font-serif text-[40px] leading-tight tracking-tight sm:text-[54px]">Join Chef Haazir as…</h1>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                    Choose how you want to be part of Pakistan’s <em className="font-serif text-rust">ghar ka khana</em> community.
                </p>
            </div>

            <div role="radiogroup" aria-label="Account type" className="mt-10 grid gap-5 md:grid-cols-3">
                {roleKeys.map((key, i) => {
                    const r = roles[key]
                    const active = picked === key
                    return (
                        <motion.button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setPicked(key)}
                            onDoubleClick={() => onContinue(key)}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`group flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left transition ${active ? 'border-sage-dark shadow-lift' : 'border-transparent shadow-card ring-1 ring-line hover:-translate-y-1 hover:shadow-lift'}`}
                        >
                            <div className="relative w-full">
                                <SafeImage src={r.photo} alt="" eager className="h-48" imgClassName={`transition duration-700 group-hover:scale-105 ${active ? '' : 'grayscale-[35%]'}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                                <span className="absolute bottom-3 left-3 rounded bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">{r.tag}</span>
                                <span className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition ${active ? 'bg-sage-dark text-white' : 'bg-white/90 text-transparent'}`}>
                                    <Icon name="check" size={17} strokeWidth={2.6} />
                                </span>
                            </div>
                            <div className="flex w-full flex-1 flex-col p-5">
                                <p className="font-serif text-[26px] leading-tight">{r.title}</p>
                                <p className="mt-1 font-serif text-[15px] text-rust">{r.line}</p>
                                <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                                    {r.points.map((pt) => (
                                        <li key={pt.text} className="flex items-start gap-2.5 text-[13px] text-ink/80">
                                            <Icon name={pt.icon} size={16} className="mt-px shrink-0 text-sage" /> {pt.text}
                                        </li>
                                    ))}
                                </ul>
                                <p className={`mt-auto flex items-center justify-between pt-5 text-[12px] font-bold ${active ? 'text-sage-dark' : 'text-ink/60'}`}>
                                    {active ? 'Selected role' : 'Select role'}
                                    <Icon name={active ? 'arrowRight' : 'plus'} size={17} />
                                </p>
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            <div className="mx-auto mt-10 max-w-md text-center">
                <button type="button" onClick={() => onContinue(picked)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-4 text-[15px] font-bold text-white shadow-lift transition hover:bg-sage">
                    Continue as {roles[picked].title.toLowerCase()} <Icon name="arrowRight" size={17} />
                </button>
                <p className="mt-5 text-[14px] text-muted">Already have an account? <Link to="/login" className="font-bold text-rust underline-offset-4 hover:underline">Log in</Link></p>
                <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted">
                    <span className="flex items-center gap-1.5"><Icon name="lock" size={13} /> Passwords stored encrypted</span>
                    <span className="flex items-center gap-1.5"><Icon name="shield" size={13} /> Chefs verified before going live</span>
                </p>
            </div>
        </div>
    )
}

// ---------------- Step 2: the chosen role's form ----------------
const FormStep = ({ role, onBack }) => {
    const r = roles[role]
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [params] = useSearchParams()
    const { city: browsingCity, setCity } = useCity()

    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '', city: browsingCity || '', address: '',
        storeName: '', cuisines: [], customCuisine: '', ratePerSlot: '', bio: ''
    })
    const [touched, setTouched] = useState({})
    const [showPw, setShowPw] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [serverError, setServerError] = useState('')

    const fields = fieldsFor[role]
    const errors = useMemo(() => {
        const result = Object.fromEntries(fields.map((f) => [f, check[f](form[f])]))
        if (role === 'chef' && form.cuisines.includes('Other')) {
            const custom = form.customCuisine.trim()
            result.cuisines = custom.length < 2
                ? 'Enter an additional cuisine (at least 2 characters)'
                : custom.length > 40
                    ? 'Cuisine names can be up to 40 characters'
                    : form.cuisines.some((c) => c !== 'Other' && c.toLowerCase() === custom.toLowerCase())
                        ? 'This cuisine is already selected'
                        : result.cuisines
        }
        return result
    }, [form, fields, role])
    const show = (f) => (touched[f] ? errors[f] : '')
    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
    const blur = (f) => () => setTouched((t) => ({ ...t, [f]: true }))
    const done = fields.filter((f) => !errors[f] && (Array.isArray(form[f]) ? form[f].length : form[f])).length
    const progress = Math.round((done / fields.length) * 100)

    // Grocery owners: warn when the city already has an approved store
    const { data: stores = [] } = useQuery({
        queryKey: ['grocery', 'stores'],
        queryFn: async () => (await api.get('/grocery/stores')).data.stores ?? [],
        enabled: role === 'grocery_owner'
    })
    const cityTaken = role === 'grocery_owner' && stores.find((s) => s.city === form.city)

    const toggleCuisine = (c) => {
        const has = form.cuisines.includes(c)
        if (!has && form.cuisines.length >= 5) return
        setForm({ ...form, cuisines: has ? form.cuisines.filter((x) => x !== c) : [...form.cuisines, c], ...(c === 'Other' && has ? { customCuisine: '' } : {}) })
        setTouched((t) => ({ ...t, cuisines: true }))
    }

    const submit = async (e) => {
        e.preventDefault()
        setTouched(Object.fromEntries(fields.map((f) => [f, true])))
        setServerError('')
        const firstBad = fields.find((f) => errors[f])
        if (firstBad) {
            const target = firstBad === 'cuisines' && form.cuisines.includes('Other') ? 'su-customCuisine' : `su-${firstBad}`
            document.getElementById(target)?.focus()
            return
        }
        const body = Object.fromEntries(fields.map((f) => [f, typeof form[f] === 'string' ? form[f].trim() : form[f]]))
        body.phone = body.phone.replace(/[\s-]/g, '')
        if (role === 'chef') {
            body.ratePerSlot = Number(body.ratePerSlot)
            body.cuisines = body.cuisines.map((c) => c === 'Other' ? form.customCuisine.trim() : c)
        }
        setSubmitting(true)
        try {
            await api.post(endpoint[role], body)
            // Registering does not log in, so log in right away with the same details
            await api.post('/auth/login', { email: body.email, password: body.password })
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            if (role === 'user') setCity(body.city)
            const next = params.get('next')
            // Customers go to Home (or back to the booking they started); partners go to their dashboard
            const customerTarget = next?.startsWith('/') ? next : '/'
            navigate(role === 'user' ? customerTarget : homeFor[role].to, { replace: true })
        } catch (err) {
            setServerError(err.response?.status === 409 ? 'An account with this email already exists. Try logging in instead.' : errorMessage(err))
            setSubmitting(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const pw = strength(form.password)
    const pwLabel = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'][pw]

    return (
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:px-8">
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3.5 py-1.5 text-[11px] font-bold text-ink/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-rust" /> STEP 2 OF 2 <span className="text-ink/30">•</span> <span className="font-semibold">Account details</span>
                </span>
                <h1 className="mt-5 font-serif text-[36px] leading-tight tracking-tight sm:text-[46px]">Complete your account registration</h1>
                <p className="mx-auto mt-2 max-w-lg text-[14px] text-muted">Signing up as a <strong className="text-ink">{r.title.toLowerCase()}</strong>. <button type="button" onClick={onBack} className="font-semibold text-rust underline-offset-4 hover:underline">Change role</button></p>
                <div className="mx-auto mt-5 flex max-w-sm items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-sage-dark" />
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <motion.span className="absolute inset-y-0 left-0 rounded-full bg-rust" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                    </span>
                    <span className="w-16 text-left text-[11px] font-bold text-rust">{progress}% ready</span>
                </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
                <form onSubmit={submit} noValidate className={`rounded-xl border border-line border-t-4 bg-white p-6 shadow-card sm:p-8 ${r.accent}`}>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${r.pill}`}>
                        <Icon name={r.icon} size={14} /> Role: {r.title} · {r.tag}
                    </span>
                    <h2 className="mt-4 font-serif text-[28px]">{r.formTitle}</h2>
                    <p className="text-[13px] text-muted">{r.formLine}</p>

                    <AnimatePresence>
                        {serverError && (
                            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-rust/30 bg-rust-soft px-4 py-3 text-[13px] text-rust-dark">
                                <Icon name="xCircle" size={17} className="mt-px shrink-0" />
                                <span>{serverError} {serverError.includes('logging in') && <Link to="/login" className="font-bold underline">Log in</Link>}</span>
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Field id="su-name" label={role === 'grocery_owner' ? 'Store owner name' : 'Full name'} error={show('name')}>
                            <WithIcon icon="user"><input id="su-name" value={form.name} onChange={set('name')} onBlur={blur('name')} maxLength={50} autoComplete="name" placeholder="e.g. Fatima Tariq" className={inputCls(show('name'), 'pl-10')} /></WithIcon>
                        </Field>
                        <Field id="su-email" label="Email address" error={show('email')}>
                            <WithIcon icon="mail"><input id="su-email" type="email" value={form.email} onChange={set('email')} onBlur={blur('email')} autoComplete="email" placeholder="you@example.com" className={inputCls(show('email'), 'pl-10')} /></WithIcon>
                        </Field>

                        <Field id="su-password" label="Password" error={show('password')} aside={form.password && <span className={`text-[11px] font-bold ${pw >= 3 ? 'text-sage' : 'text-rust'}`}>{pwLabel}</span>}>
                            <WithIcon icon="lock" right={
                                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-muted hover:text-ink">
                                    <Icon name={showPw ? 'eyeOff' : 'eye'} size={17} />
                                </button>
                            }>
                                <input id="su-password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} onBlur={blur('password')} autoComplete="new-password" placeholder="8+ characters" className={inputCls(show('password'), 'pl-10 pr-10')} />
                            </WithIcon>
                            <div className="mt-2 grid grid-cols-4 gap-1">
                                {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 rounded-full transition ${i < pw ? (pw >= 3 ? 'bg-sage' : 'bg-rust') : 'bg-line'}`} />)}
                            </div>
                            {!show('password') && <p className="mt-1.5 text-[11.5px] text-muted">8+ characters, with a letter and a number</p>}
                        </Field>
                        <Field id="su-phone" label="Pakistani mobile number" error={show('phone')} hint={role === 'chef' ? 'Your verification code is sent to this number' : ''}>
                            <WithIcon icon="phone" right={!errors.phone && form.phone && <Icon name="checkCircle" size={17} className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-sage" />}>
                                <input id="su-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} onBlur={blur('phone')} autoComplete="tel" placeholder="03001234567" className={inputCls(show('phone'), 'pl-10 pr-10')} />
                            </WithIcon>
                        </Field>

                        {role === 'grocery_owner' && (
                            <div className="sm:col-span-2">
                                <Field id="su-storeName" label="Store name" error={show('storeName')}>
                                    <WithIcon icon="store"><input id="su-storeName" value={form.storeName} onChange={set('storeName')} onBlur={blur('storeName')} maxLength={60} placeholder="e.g. Lahore Mart" className={inputCls(show('storeName'), 'pl-10')} /></WithIcon>
                                </Field>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <Field id="su-city" label={role === 'user' ? 'City of residence' : role === 'chef' ? 'Your city' : 'Store city'} error={show('city')}
                                hint={role === 'chef' ? 'You will cook for customers in this city' : ''}>
                                <WithIcon icon="pin" right={<Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-muted" />}>
                                    <select id="su-city" value={form.city} onChange={set('city')} onBlur={blur('city')} className={inputCls(show('city'), 'appearance-none pl-10 pr-10')}>
                                        <option value="">Choose a city</option>
                                        {cities.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </WithIcon>
                            </Field>
                            {cityTaken && (
                                <p className="mt-2 flex items-start gap-2 rounded-lg bg-rust-soft/70 px-3 py-2.5 text-[12px] text-rust-dark">
                                    <Icon name="shield" size={15} className="mt-px shrink-0" />
                                    {form.city} already has an approved store ({cityTaken.name}). You can still apply, but only one store per city can be approved.
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <Field id="su-address" label={role === 'user' ? 'Home address for bookings' : role === 'chef' ? 'Kitchen address' : 'Store address'} error={show('address')}
                                hint={role === 'chef' ? 'Groceries for your bookings are delivered here. Customers never see it.' : role === 'user' ? 'Used as the default address for bookings. You can change it per booking.' : 'Returned groceries come back here'}>
                                <textarea id="su-address" rows={2} value={form.address} onChange={set('address')} onBlur={blur('address')} maxLength={200} placeholder="House, street, area" className={inputCls(show('address'), 'resize-none')} />
                            </Field>
                        </div>

                        {role === 'chef' && (
                            <>
                                <div className="sm:col-span-2">
                                    <div className="flex items-baseline justify-between">
                                        <p id="su-cuisines-label" className="text-[12.5px] font-bold text-ink/85">Signature cuisines</p>
                                        <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${form.cuisines.length ? 'bg-rust-soft text-rust' : 'text-muted'}`}>{form.cuisines.length}/5 selected</span>
                                    </div>
                                    <div id="su-cuisines" tabIndex={-1} role="group" aria-labelledby="su-cuisines-label" className="mt-2 flex flex-wrap gap-2 outline-none">
                                        {cuisineOptions.map((c) => {
                                            const on = form.cuisines.includes(c)
                                            const full = !on && form.cuisines.length >= 5
                                            return (
                                                <button key={c} type="button" aria-pressed={on} disabled={full} onClick={() => toggleCuisine(c)}
                                                    className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12.5px] font-semibold transition ${on ? 'border-sage-dark bg-sage-dark text-white' : full ? 'border-line text-muted/60' : 'border-line bg-white text-ink/75 hover:border-sage/50'}`}>
                                                    <Icon name={on ? 'check' : 'plus'} size={13} strokeWidth={2.4} /> {c}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {form.cuisines.includes('Other') && (
                                        <Field id="su-customCuisine" label="Add your cuisine" error={show('cuisines')} hint="Type one cuisine or cooking style we haven’t listed (up to 40 characters).">
                                            <input id="su-customCuisine" value={form.customCuisine} onChange={set('customCuisine')} onBlur={blur('cuisines')} maxLength={40} placeholder="e.g. Afghan, Kashmiri, or Mughlai" className={inputCls(show('cuisines'))} />
                                        </Field>
                                    )}
                                    {show('cuisines') && !form.cuisines.includes('Other') && <p className="mt-1.5 text-[12px] text-rust">{errors.cuisines}</p>}
                                </div>
                                <Field id="su-ratePerSlot" label="Rate per 2-hour slot" error={show('ratePerSlot')} hint="Allowed range: Rs 500 – Rs 20,000. You keep 90%.">
                                    <span className="relative block">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-[13px] font-bold text-muted">Rs</span>
                                        <input id="su-ratePerSlot" type="number" inputMode="numeric" min={500} max={20000} step={100} value={form.ratePerSlot} onChange={set('ratePerSlot')} onBlur={blur('ratePerSlot')} placeholder="1500" className={inputCls(show('ratePerSlot'), 'pl-10 font-bold')} />
                                    </span>
                                </Field>
                                <div className="hidden sm:block" />
                                <div className="sm:col-span-2">
                                    <Field id="su-bio" label="Cooking bio (required)" error={show('bio')} aside={<span className={`text-[11px] font-bold ${form.bio.length > 300 ? 'text-rust' : 'text-muted'}`}>{form.bio.length}/300</span>}
                                        hint="Required. Tell customers about your cooking experience, specialties, or signature dishes.">
                                        <textarea id="su-bio" required minLength={10} maxLength={300} rows={3} value={form.bio} onChange={set('bio')} onBlur={blur('bio')} placeholder="e.g. I make Punjabi handi, tawa roti and family-recipe biryani…" className={inputCls(show('bio'), 'resize-none')} />
                                    </Field>
                                </div>
                            </>
                        )}
                    </div>

                    <button disabled={submitting} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-4 text-[15px] font-bold text-white shadow-sm transition hover:bg-sage disabled:opacity-60">
                        {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating your account…</> : <>Create {r.title.toLowerCase()} account <Icon name="arrowRight" size={17} /></>}
                    </button>
                    <p className="mt-4 text-center text-[12px] text-muted">
                        By creating an account you agree to Chef Haazir’s terms{role === 'chef' ? ' and the chef contract you will accept next' : ''}.
                    </p>
                </form>

                {/* Side panel: what happens next */}
                <aside className="space-y-5 lg:sticky lg:top-6">
                    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                        <div className="relative">
                            <SafeImage src={r.photo} alt="" className="h-44" />
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
                            <p className="absolute bottom-3 left-5 right-5 font-serif text-[22px] leading-tight text-white">{r.line}</p>
                        </div>
                        <div className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rust">{role === 'user' ? 'After you sign up' : 'Verification pipeline'}</p>
                            <ol className="mt-3 space-y-3">
                                {r.next.map((step, i) => (
                                    <li key={step} className="flex items-start gap-3 text-[13px] text-ink/80">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-bold text-sage-dark">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                    {role !== 'user' && (
                        <p className="flex items-start gap-3 rounded-xl border border-rust/20 bg-rust-soft/50 p-4 text-[12.5px] leading-relaxed text-rust-dark">
                            <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
                            {role === 'chef'
                                ? 'Customers can see and book you only after phone verification, the signed contract and our approval.'
                                : 'Territory rule: one approved store per city. Our team reviews every application before the store goes live.'}
                        </p>
                    )}
                </aside>
            </div>
        </div>
    )
}

const HelpStrip = () => (
    <div className="mx-auto max-w-6xl px-4 pb-6 md:px-8">
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-sand/70 p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage-dark"><Icon name="question" size={22} /></span>
            <div className="flex-1">
                <p className="font-serif text-[19px]">Unsure which account fits you?</p>
                <p className="text-[13px] text-muted">Read how chef verification works, or ask our team.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Link to="/about#chef-contract" className="text-[13px] font-bold text-rust underline-offset-4 hover:underline">Chef contract & perks</Link>
                <Link to="/contact" className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold hover:border-sage/50"><Icon name="chat" size={15} /> Contact us</Link>
            </div>
        </div>
    </div>
)

const Signup = () => {
    const [params, setParams] = useSearchParams()
    const role = roleKeys.includes(params.get('role')) ? params.get('role') : null
    // A link like /signup?role=chef opens the chef form directly
    const [step, setStep] = useState(role ? 2 : 1)

    useEffect(() => { window.scrollTo(0, 0) }, [step])

    const go = (key) => {
        const p = new URLSearchParams(params)
        p.set('role', key)
        setParams(p, { replace: true })
        setStep(2)
    }

    return (
        <AuthShell>
            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: step === 2 ? 24 : -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {step === 1 || !role ? <RoleStep initial={role} onContinue={go} /> : <FormStep key={role} role={role} onBack={() => setStep(1)} />}
                </motion.div>
            </AnimatePresence>
            <HelpStrip />
        </AuthShell>
    )
}

export default Signup
