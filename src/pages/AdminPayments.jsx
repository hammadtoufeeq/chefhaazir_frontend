import { useMemo, useState } from 'react'
import Icon from '../components/Icon'

const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
const dateTime = (value) => value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const AdminPayments = ({ payments, settlements, paymentsLoading, settlementsLoading, paymentsError, settlementsError, actionMutation }) => {
    const [view, setView] = useState('all')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('highest')
    const rows = useMemo(() => {
        const q = search.trim().toLowerCase()
        const filtered = payments.filter((chef) => {
            const submitted = Boolean(chef.awaitingVerification)
            return (!q || `${chef.name} ${chef.phone}`.toLowerCase().includes(q)) && (view === 'all' || (view === 'due' && chef.totalDue > 0 && !submitted) || (view === 'submitted' && submitted))
        })
        return filtered.sort((a, b) => sort === 'highest' ? b.totalDue - a.totalDue : a.name.localeCompare(b.name))
    }, [payments, search, sort, view])
    const dueTotal = payments.reduce((sum, chef) => sum + (chef.totalDue || 0), 0)
    const submittedTotal = payments.reduce((sum, chef) => sum + (chef.awaitingVerification?.amount || 0), 0)
    const blockedCount = payments.filter((chef) => chef.paymentBlocked).length
    const exportLedger = () => {
        const lines = [['Chef', 'Phone', 'Amount due (PKR)', 'Commission', 'Groceries', 'Delivery', 'Bookings', 'Payment status'], ...payments.map((chef) => [chef.name, chef.phone || '', chef.totalDue || 0, chef.breakdown?.commission || 0, chef.breakdown?.groceries || 0, chef.breakdown?.delivery || 0, chef.breakdown?.bookings || 0, chef.awaitingVerification ? 'Pending verification' : chef.paymentBlocked ? 'Blocked' : 'Due'])]
        const csv = lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        link.download = `chef-haazir-payments-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }
    const button = 'rounded-lg px-3 py-2 text-[10px] font-bold disabled:opacity-50'

    return <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rust"><Icon name="wallet" size={14}/>Finance &amp; Settlements Desk · All Hubs</p><h2 className="mt-2 font-serif text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]">Chef Remittances &amp; Ledger Accounts</h2><p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-muted">Review chef balances and verify submitted SadaPay, JazzCash, Easypaisa, or bank transfer references.</p></div><button type="button" onClick={exportLedger} className="inline-flex items-center gap-2 rounded-lg bg-rust px-4 py-3 text-[11px] font-bold text-white"><Icon name="download" size={15}/>Export Ledger (.csv)</button></div>
        <div className="grid gap-3 md:grid-cols-3"><Summary label="Total outstanding dues" value={money(dueTotal)} note={`${payments.length} chefs`} icon="wallet"/><Summary label="Pending verification" value={money(submittedTotal)} note={`${payments.filter((p) => p.awaitingVerification).length} payments`} icon="receipt"/><Summary label="Accounts blocked" value={`${blockedCount} overdue`} note="Grace period expired" icon="close" danger/></div>
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 lg:flex-row"><div className="flex shrink-0 gap-1 rounded-lg bg-stone-100 p-1">{[['all', `All (${payments.length})`], ['due', `Owes money (${payments.filter((p) => p.totalDue > 0 && !p.awaitingVerification).length})`], ['submitted', `Waiting for verification (${payments.filter((p) => p.awaitingVerification).length})`]].map(([key, label]) => <button key={key} type="button" onClick={() => setView(key)} className={`rounded-md px-3 py-2 text-[10px] font-semibold ${view === key ? 'bg-white text-rust shadow-sm' : 'text-ink/70'}`}>{label}</button>)}</div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chef by name or phone" className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-[11px] outline-none focus:border-sage"/><select aria-label="Sort balances" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-[10px]"><option value="highest">Highest dues first</option><option value="name">Chef name</option></select></div>
        {(paymentsError || settlementsError) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-[11px] text-red-800">{paymentsError || settlementsError}</div>}
        {paymentsLoading || settlementsLoading ? <div className="rounded-xl bg-white p-10 text-center text-[12px] text-muted">Loading remittance ledger…</div> : rows.length === 0 ? <div className="rounded-xl bg-white p-10 text-center text-[12px] text-muted">No chef balances match this filter.</div> : <div className="space-y-4">{rows.map((chef) => <PaymentCard key={chef.chefId} chef={chef} actionMutation={actionMutation} button={button}/>)}</div>}
        <p className="text-[10px] text-muted">Showing {rows.length} of {payments.length} chef balances · Amounts refresh automatically after payment review.</p>
    </div>
}

function Summary({ label, value, note, icon, danger = false }) {
    return <section className="rounded-xl border border-line bg-white p-4"><div className="flex items-start justify-between"><div><p className={`text-[9px] font-bold uppercase tracking-wide ${danger ? 'text-red-700' : 'text-muted'}`}>{label}</p><p className={`mt-1 font-serif text-[25px] font-semibold ${danger ? 'text-red-700' : ''}`}>{value}</p><p className="mt-0.5 text-[10px] text-muted">{note}</p></div><span className={`rounded-lg p-2 ${danger ? 'bg-red-100 text-red-700' : 'bg-rust-soft text-rust'}`}><Icon name={icon} size={17}/></span></div></section>
}

function PaymentCard({ chef, actionMutation, button }) {
    const submission = chef.awaitingVerification
    const methodNames = { sadapay: 'SadaPay', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', bank: 'Bank transfer', cash: 'Cash (legacy)' }
    const phone = (chef.phone || '').replace(/[^\d+]/g, '').replace(/^0/, '92')
    return <article className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-soft font-serif text-[15px] font-semibold text-sage-dark">{initials(chef.name)}</span><div className="min-w-0"><h3 className="truncate font-serif text-[19px] font-semibold">Chef {chef.name}</h3><p className="mt-0.5 text-[10px] text-muted">{chef.phone || 'Phone not available'} · {chef.paymentBlocked ? 'Overdue · dispatches paused' : 'Payment account active'}</p></div></div><div className="text-right"><p className={`font-serif text-[26px] font-semibold ${chef.paymentBlocked ? 'text-red-700' : 'text-rust'}`}>Due: {money(chef.totalDue)}</p><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${submission ? 'bg-orange-100 text-rust' : chef.paymentBlocked ? 'bg-red-100 text-red-800' : 'bg-sage-soft text-sage-dark'}`}>{submission ? 'Payment submitted · pending review' : chef.paymentBlocked ? 'Blocked · grace period expired' : 'Active · payment due'}</span></div></div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[#f5f2ee] p-3 sm:grid-cols-4"><Amount label="App commission" value={chef.breakdown?.commission}/><Amount label="Groceries advance" value={chef.breakdown?.groceries}/><Amount label="Delivery adjustments" value={chef.breakdown?.delivery}/><div><p className="text-[9px] font-bold uppercase text-muted">{chef.paymentBlocked ? 'Bookings on hold' : 'Settled volume'}</p><p className={`mt-1 text-[11px] font-semibold ${chef.paymentBlocked ? 'text-red-700' : 'text-sage-dark'}`}>{chef.paymentBlocked ? 'Dispatches paused' : `${chef.breakdown?.bookings || 0} bookings`}</p></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-muted">{chef.lastVerifiedPayment ? `Last verified payment: ${money(chef.lastVerifiedPayment.amount)} · ${dateTime(chef.lastVerifiedPayment.verifiedAt)}` : 'No verified payment recorded yet'}</p><div className="flex flex-wrap items-center gap-2">{phone && <a href={`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(`Chef Haazir payment reminder: your current platform balance is ${money(chef.totalDue)}.`)}`} target="_blank" rel="noreferrer" className={`${button} border border-line text-ink`}>Send WhatsApp reminder</a>}{submission && <><button type="button" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ action: 'verify-settlement', id: submission._id })} className={`${button} bg-sage-dark text-white`}>Verify &amp; clear dues</button><button type="button" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ action: 'reject-settlement', id: submission._id })} className={`${button} border border-red-200 text-red-700`}>Reject voucher</button></>}</div></div>
        {submission && <div className="mt-3 rounded-lg bg-stone-50 p-3 text-[10px]"><p className="font-semibold">{methodNames[submission.method] || submission.method} · Ref: {submission.transactionId || 'Not provided'}</p><p className="mt-1 text-muted">Submitted {dateTime(submission.submittedAt)} · Claimed amount {money(submission.amount)}</p></div>}
    </article>
}

function Amount({ label, value }) { return <div><p className="text-[9px] font-bold uppercase text-muted">{label}</p><p className="mt-1 text-[11px] font-semibold">{money(value)}</p></div> }

export default AdminPayments
