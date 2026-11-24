import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/api'
import toast from '../lib/toast'
import { images } from '../constants/images'
import { useAuth, homeFor } from '../context/AuthContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import AuthShell from '../components/AuthShell'

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

// Where to go after logging in: back to the page that sent them here, otherwise
// customers go Home and partners go to their dashboard
const targetFor = (role, next) => {
    // Only customers can return to a requested customer page or booking flow.
    if (role === 'user' && next?.startsWith('/') && !next.startsWith('//')) return next
    return role === 'user' ? '/' : homeFor[role]?.to || '/'
}

const Login = () => {
    const [params] = useSearchParams()
    const next = params.get('next')
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, isLoading } = useAuth()

    const [email, setEmail] = useState(params.get('email') || '')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [touched, setTouched] = useState({})
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => { setError(null) }, [email, password])

    // Already logged in: skip the form
    if (!isLoading && user && !submitting) return <Navigate to={targetFor(user.role, next)} replace />

    const errors = {
        email: emailOk(email) ? '' : 'Please enter a valid email',
        password: password ? '' : 'Please enter your password'
    }

    const submit = async (e) => {
        e.preventDefault()
        const formEl = e.currentTarget
        const activeEmail = (email || formEl.elements['li-email']?.value || formEl.elements['email']?.value || '').trim()
        const activePassword = password || formEl.elements['li-password']?.value || formEl.elements['password']?.value || ''

        if (activeEmail !== email) setEmail(activeEmail)
        if (activePassword !== password) setPassword(activePassword)

        setTouched({ email: true, password: true })
        if (!emailOk(activeEmail) || !activePassword) return
        setSubmitting(true)
        try {
            const { data } = await api.post('/auth/login', { email: activeEmail, password: activePassword })
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            toast.success(`Welcome back${data.user?.name ? `, ${data.user.name}` : ''}!`, 'Login successful')
            navigate(targetFor(data.user.role, next), { replace: true })
        } catch (err) {
            const status = err.response?.status
            setError(status === 401
                ? { title: 'Invalid email or password', text: 'Please check your details and try again.' }
                : status === 403
                    ? { title: 'Account suspended', text: 'This account has been suspended. Please contact our team for help.' }
                    : { title: 'Could not log in', text: err.response?.data?.message || 'Please check your connection and try again.' })
            setSubmitting(false)
        }
    }

    const inputCls = (bad) => `w-full rounded-lg border px-11 py-3.5 text-[14px] outline-none transition placeholder:text-muted/70 focus:bg-white focus:ring-2 ${bad ? 'border-rust/60 bg-rust-soft/30 focus:ring-rust/20' : 'border-transparent bg-sand focus:border-sage focus:ring-sage/20'}`

    return (
        <AuthShell>
            <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="grid overflow-hidden rounded-2xl shadow-lift ring-1 ring-line md:grid-cols-[1.1fr_1fr]">

                    {/* Photo side */}
                    <div className="relative min-h-[320px] md:min-h-[640px]">
                        <SafeImage src={images.rotiOnTawa} alt="Fresh roti being made on a tawa" eager className="!absolute inset-0 h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a20] via-[#0f2a20]/55 to-[#0f2a20]/10" />
                        <span className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink shadow-sm sm:left-8 sm:top-8">
                            Chef Haazir · Authentic ghar ka khana
                        </span>
                        <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"><Icon name="pot" size={14} /> Taza phulka · dastarkhwan traditions</p>
                            <p className="mt-3 font-serif text-[30px] italic leading-[1.1] sm:text-[38px]">“Ghar ka zaiqa, ammi ke haath ka ehsaas.”</p>
                            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/80">Home-style warmth in every bite, cooked fresh in your own kitchen by a verified home chef.</p>
                            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-semibold text-white/90">
                                <span className="flex items-center gap-1.5"><Icon name="shield" size={15} /> Verified home chefs</span>
                                <span className="flex items-center gap-1.5"><Icon name="wallet" size={15} /> Pay after the meal</span>
                            </div>
                        </div>
                    </div>

                    {/* Form side */}
                    <div className="flex items-center bg-sand/60 p-4 sm:p-8 lg:p-10">
                        <form onSubmit={submit} noValidate className="w-full rounded-xl bg-white p-6 shadow-card sm:p-8">
                            <div className="flex items-center justify-between gap-3">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/80"><span className="h-2 w-2 rounded-full bg-rust" /> Portal access</p>
                                <p className="flex items-center gap-1 text-[10px] font-semibold text-rust"><Icon name="lock" size={12} /> Secure session</p>
                            </div>
                            <h1 className="mt-3 font-serif text-[40px] leading-none tracking-tight">Welcome back</h1>
                            <p className="mt-3 text-[14px] leading-relaxed text-muted">
                                {next?.startsWith('/book/') ? 'Log in to finish your booking. Your chef and slot are saved.' : 'Log in to see your bookings and book your favourite home chefs.'}
                            </p>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div role="alert" className="mt-5 flex gap-3 rounded-lg bg-rust-soft px-4 py-3.5">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rust text-[13px] font-bold text-white">!</span>
                                            <div>
                                                <p className="text-[13.5px] font-bold text-rust-dark">{error.title}</p>
                                                <p className="mt-0.5 text-[12.5px] text-ink/75">{error.text}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-6">
                                <label htmlFor="li-email" className="text-[13px] font-bold">Email</label>
                                <span className="relative mt-2 block">
                                    <Icon name="mail" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                    <input id="li-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                                        autoComplete="email" autoFocus placeholder="you@example.com" className={inputCls(touched.email && errors.email)} />
                                </span>
                                {touched.email && errors.email && <p className="mt-1.5 text-[12px] text-rust">{errors.email}</p>}
                            </div>

                            <div className="mt-5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="li-password" className="text-[13px] font-bold">Password</label>
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="flex items-center gap-1 text-[12px] font-semibold text-rust">
                                        <Icon name={showPw ? 'eyeOff' : 'eye'} size={14} /> {showPw ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <span className="relative mt-2 block">
                                    <Icon name="lock" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                    <input id="li-password" name="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                                        autoComplete="current-password" placeholder="Your password" className={inputCls(touched.password && errors.password)} />
                                </span>
                                {touched.password && errors.password && <p className="mt-1.5 text-[12px] text-rust">{errors.password}</p>}
                            </div>

                            <div className="mt-4 text-right">
                                <Link to="/contact" className="text-[12.5px] font-semibold text-ink/70 underline-offset-4 hover:text-rust hover:underline">Forgot password? Contact us</Link>
                            </div>

                            <button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sage-dark py-4 text-[15px] font-bold text-white shadow-sm transition hover:bg-sage disabled:opacity-60">
                                {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Logging in…</> : <>Log in to dastarkhwan <Icon name="arrowRight" size={17} /></>}
                            </button>

                            <div className="mt-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                                <span className="h-px flex-1 bg-line" /> New here? <span className="h-px flex-1 bg-line" />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Link to={`/signup?role=user${next ? `&next=${encodeURIComponent(next)}` : ''}`} className="flex items-center justify-center gap-2 rounded-lg border border-line bg-sand/50 px-3 py-3 text-[12.5px] font-bold text-ink/85 transition hover:border-sage/50">
                                    <Icon name="user" size={16} className="text-rust" /> Join as customer
                                </Link>
                                <Link to="/signup?role=chef" className="flex items-center justify-center gap-2 rounded-lg border border-line bg-sand/50 px-3 py-3 text-[12.5px] font-bold text-ink/85 transition hover:border-sage/50">
                                    <Icon name="chef" size={16} className="text-rust" /> Join as chef
                                </Link>
                            </div>
                            <p className="mt-5 text-center text-[13px] text-muted">
                                Running a grocery store? <Link to="/signup?role=grocery_owner" className="font-semibold text-rust underline-offset-4 hover:underline">Create an account →</Link>
                            </p>

                            <p className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-sand/70 px-3 py-2.5 text-center text-[11px] text-muted">
                                <Icon name="lock" size={13} /> Secure session · Passwords are stored encrypted
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AuthShell>
    )
}

export default Login
