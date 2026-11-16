import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const timeLabel = (value) => value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const AdminDashboard = () => {
    const { user, isLoading: authLoading, logout } = useAuth()
    const queryClient = useQueryClient()
    const [issuedCode, setIssuedCode] = useState(null)
    const [notice, setNotice] = useState('')
    const chefsQuery = useQuery({
        queryKey: ['admin-otp-requests'],
        queryFn: async () => (await api.get('/admin/chefs')).data.chefs,
        enabled: user?.role === 'admin',
        refetchInterval: 30_000
    })
    const generateMutation = useMutation({
        mutationFn: async (chefId) => (await api.post(`/admin/chefs/${chefId}/otp`)).data,
        onSuccess: (data) => {
            setIssuedCode(data)
            setNotice('A verification code was generated. Send it to the chef using your approved contact channel.')
            queryClient.invalidateQueries({ queryKey: ['admin-otp-requests'] })
        },
        onError: (error) => setNotice(errorMessage(error))
    })

    if (authLoading) return <main className="min-h-screen bg-stone-50 p-8"><div className="h-10 w-64 animate-pulse rounded bg-stone-200"/></main>
    if (!user) return <Navigate to="/login?next=%2Fadmin" replace/>
    if (user.role !== 'admin') return <Navigate to={user.role === 'chef' ? '/chef' : '/'} replace/>

    const requests = (chefsQuery.data || []).filter((chef) => chef.otpRequestedAt && !chef.phoneVerified).sort((a, b) => new Date(a.otpRequestedAt) - new Date(b.otpRequestedAt))

    return (
        <main className="min-h-screen bg-[#fbfaf8] px-4 py-6 text-ink sm:px-7 sm:py-9">
            <div className="mx-auto max-w-5xl">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rust">Chef Haazir administration</p><h1 className="mt-1 font-serif text-[32px] font-semibold">Phone verification requests</h1><p className="mt-1 text-[12px] text-muted">Generate a one-time code, then send it to the chef manually.</p></div>
                    <button type="button" onClick={() => { logout(); window.location.assign('/') }} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[11px] font-semibold"><Icon name="logout" size={14}/> Log out</button>
                </header>

                <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[12px] leading-relaxed text-amber-900"><Icon name="question" size={16} className="mt-0.5 shrink-0"/><p>The backend does not send SMS or WhatsApp automatically. After generating a code, send it to the displayed number yourself. Codes expire 10 minutes after generation.</p></div>
                {notice && <p role="status" className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-[12px] text-sage-dark">{notice}</p>}

                <section className="mt-6 rounded-xl border border-line bg-white shadow-card">
                    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><div><h2 className="font-serif text-[22px] font-semibold">Waiting for an OTP</h2><p className="mt-1 text-[11px] text-muted">{requests.length} chef{requests.length === 1 ? '' : 's'} requested a code</p></div><button type="button" onClick={() => chefsQuery.refetch()} className="rounded-lg border border-line px-3 py-2 text-[10px] font-bold"><Icon name="undo" size={13} className="mr-1 inline"/>Refresh</button></div>
                    {chefsQuery.isLoading ? <div className="space-y-3 p-5">{[0,1].map((key) => <div key={key} className="h-20 animate-pulse rounded-lg bg-stone-100"/>)}</div>
                        : chefsQuery.isError ? <div className="p-6 text-center"><p className="text-[12px] text-rust">{errorMessage(chefsQuery.error)}</p><button type="button" onClick={() => chefsQuery.refetch()} className="mt-3 text-[11px] font-bold text-rust underline">Try again</button></div>
                            : requests.length ? <div className="divide-y divide-line">{requests.map((chef) => <div key={chef._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rust-soft text-rust"><Icon name="chef" size={19}/></span><div className="min-w-0"><p className="truncate text-[14px] font-bold">{chef.user?.name || 'Chef applicant'}</p><p className="mt-0.5 text-[11px] text-muted">{chef.user?.phone || 'No phone'} · {chef.city}</p><p className="mt-1 text-[10px] text-muted">Requested {timeLabel(chef.otpRequestedAt)}</p></div></div><button type="button" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate(chef._id)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sage disabled:opacity-50">{generateMutation.isPending && generateMutation.variables === chef._id ? 'Generating…' : 'Generate OTP'} <Icon name="arrowRight" size={14}/></button></div>)}</div>
                                : <div className="px-5 py-12 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-muted"><Icon name="checkCircle" size={20}/></span><h3 className="mt-3 font-serif text-[20px]">No requests waiting</h3><p className="mt-1 text-[11px] text-muted">New requests will appear here when chefs ask for verification.</p></div>}
                </section>

                <footer className="mt-6 flex justify-between border-t border-line pt-4 text-[10px] text-muted"><Link to="/" className="hover:text-rust">Open Chef Haazir site</Link><span>Codes are one-time and expire after 10 minutes.</span></footer>
            </div>

            {issuedCode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && setIssuedCode(null)}><section role="dialog" aria-modal="true" aria-labelledby="otp-generated-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-sage-dark">One-time code created</p><h2 id="otp-generated-title" className="mt-1 font-serif text-[26px] font-semibold">Send this code to {issuedCode.chefName}</h2></div><button type="button" onClick={() => setIssuedCode(null)} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-stone-100"><Icon name="close" size={16}/></button></div><p className="mt-2 text-[12px] text-muted">Send to {issuedCode.phone}. Expires {timeLabel(issuedCode.expiresAt)}.</p><p className="mt-5 rounded-xl bg-stone-50 py-5 text-center font-mono text-[36px] font-bold tracking-[0.35em]">{issuedCode.otp}</p><p className="mt-3 text-[10px] leading-relaxed text-muted">Send this code directly to the chef using your approved SMS or WhatsApp process. Do not share it with anyone else.</p><div className="mt-5 flex gap-2"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(issuedCode.otp); setNotice('OTP copied. Send it to the chef now.') } catch { setNotice('Copy was unavailable. Select and copy the OTP manually.') } }} className="flex-1 rounded-lg border border-line px-4 py-2.5 text-[11px] font-bold">Copy code</button><button type="button" onClick={() => setIssuedCode(null)} className="flex-1 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white">Done</button></div></section></div>}
        </main>
    )
}

export default AdminDashboard
