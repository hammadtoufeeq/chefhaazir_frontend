import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import cities from '../constants/cities'
import AdminApprovals from './AdminApprovals'
import AdminPayments from './AdminPayments'
import AdminGovernance from './AdminGovernance'
import AdminBookings from './AdminBookings'

const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`
const timeLabel = (value) => value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const dateLabel = (value) => value ? new Date(`${value}T12:00:00+05:00`).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }) : '—'
const navItems = [
    ['overview', 'Overview', 'filter'],
    ['approvals', 'Approvals', 'shield'],
    ['bookings', 'Bookings', 'calendar'],
    ['payments', 'Chef Payments', 'wallet'],
    ['issues', 'Users & Issues', 'question'],
    ['settings', 'Settings', 'menu']
]
const Panel = ({ children, className = '' }) => <section className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>{children}</section>
const Empty = ({ children }) => <p className="px-5 py-9 text-center text-[12px] text-muted">{children}</p>
const Pill = ({ children, tone = 'sage' }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${tone === 'rust' ? 'bg-rust-soft text-rust' : tone === 'red' ? 'bg-red-100 text-red-800' : 'bg-sage-soft text-sage-dark'}`}>{children}</span>

const AdminDashboard = () => {
    const { user, isLoading: authLoading, logout } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()
    const validTabs = navItems.map(([key]) => key)
    const initialTab = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'
    const [tab, setTab] = useState(initialTab)
    const [bookingStatus, setBookingStatus] = useState('all')
    const [userSearch, setUserSearch] = useState('')
    const [approvalKind, setApprovalKind] = useState('chefs')
    const [approvalSearch, setApprovalSearch] = useState('')
    const [approvalCity, setApprovalCity] = useState('all')
    const [approvalStatus, setApprovalStatus] = useState('all')
    const [otpInputs, setOtpInputs] = useState({})
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [issuedCode, setIssuedCode] = useState(null)
    const [notice, setNotice] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [settingsDraft, setSettingsDraft] = useState(null)

    const stats = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get('/admin/stats')).data, enabled: user?.role === 'admin', refetchInterval: 30_000, refetchOnWindowFocus: true })
    const chefs = useQuery({ queryKey: ['admin-chefs'], queryFn: async () => (await api.get('/admin/chefs')).data.chefs || [], enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const stores = useQuery({ queryKey: ['admin-stores'], queryFn: async () => (await api.get('/admin/stores')).data.stores || [], enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const payments = useQuery({ queryKey: ['admin-chef-payments'], queryFn: async () => (await api.get('/admin/chef-payments')).data, enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const settlements = useQuery({ queryKey: ['admin-settlements'], queryFn: async () => (await api.get('/settlements', { params: { status: 'submitted', limit: 50 } })).data.settlements || [], enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const issues = useQuery({ queryKey: ['admin-issues'], queryFn: async () => (await api.get('/issues', { params: { status: 'open', limit: 50 } })).data.issues || [], enabled: user?.role === 'admin', refetchInterval: 20_000 })
    const closedIssues = useQuery({ queryKey: ['admin-closed-issues'], queryFn: async () => { const [genuine, dismissed] = await Promise.all([api.get('/issues', { params: { status: 'genuine', limit: 20 } }), api.get('/issues', { params: { status: 'dismissed', limit: 20 } })]); return [...(genuine.data.issues || []), ...(dismissed.data.issues || [])].sort((a, b) => new Date(b.resolvedAt || b.updatedAt) - new Date(a.resolvedAt || a.updatedAt)) }, enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const users = useQuery({ queryKey: ['admin-users', userSearch], queryFn: async () => (await api.get('/admin/users', { params: { search: userSearch || undefined, page: 1, limit: 50 } })).data, enabled: user?.role === 'admin', refetchInterval: 30_000 })
    const bookings = useQuery({ queryKey: ['admin-bookings', bookingStatus], queryFn: async () => (await api.get('/admin/bookings', { params: { status: bookingStatus === 'all' ? undefined : bookingStatus, page: 1, limit: 50 } })).data, enabled: user?.role === 'admin' && tab === 'bookings', refetchInterval: 20_000 })
    const settings = useQuery({ queryKey: ['admin-settings'], queryFn: async () => (await api.get('/admin/settings')).data.settings ?? null, enabled: user?.role === 'admin' })

    useEffect(() => {
        if (settings.data && !settingsDraft) setSettingsDraft({ commissionRate: settings.data.commissionRate, deliveryFee: settings.data.deliveryFee, freeDeliveryMin: settings.data.freeDeliveryMin, paymentBlockDays: settings.data.paymentBlockDays })
    }, [settings.data, settingsDraft])

    useEffect(() => {
        const urlTab = searchParams.get('tab')
        if (validTabs.includes(urlTab) && urlTab !== tab) setTab(urlTab)
    }, [searchParams, tab])

    const refreshAdmin = async () => {
        if (refreshing) return
        setRefreshing(true)
        try {
            await queryClient.refetchQueries({ type: 'active' })
            setNotice('Admin data refreshed.')
        } catch {
            setNotice('Could not refresh admin data. Please try again.')
        } finally {
            setRefreshing(false)
        }
    }
    const actionMutation = useMutation({
        mutationFn: async ({ action, id, value, override = false }) => {
            if (action === 'chef-approval') return (await api.patch(`/admin/chefs/${id}/approval`, { status: value })).data
            if (action === 'verify-chef-otp') return (await api.post(`/admin/chefs/${id}/verify-otp`, { otp: value })).data
            if (action === 'delete-chef') return (await api.delete(`/admin/chefs/${id}`)).data
            if (action === 'store-approval') return (await api.patch(`/admin/stores/${id}/approval`, { status: value, override })).data
            if (action === 'delete-store') return (await api.delete(`/admin/stores/${id}`)).data
            if (action === 'verify-settlement') return (await api.patch(`/settlements/${id}/verify`)).data
            if (action === 'reject-settlement') return (await api.patch(`/settlements/${id}/reject`, { reason: 'Please verify the transfer reference and submit again.' })).data
            if (action === 'resolve-issue') return (await api.patch(`/issues/${id}/resolve`, { decision: value, adminNote: value === 'genuine' ? 'Issue confirmed after admin review.' : 'Issue dismissed after admin review.' })).data
            if (action === 'user-status') return (await api.patch(`/admin/users/${id}/status`, value === 'suspended' ? { status: value, reason: 'Suspended by an administrator.' } : { status: value })).data
            if (action === 'settings') return (await api.patch('/admin/settings', value)).data
            return (await api.post(`/admin/chefs/${id}/otp`)).data
        },
        onSuccess: (data, variables) => {
            if (variables.action === 'otp') setIssuedCode(data)
            if (variables.action === 'verify-chef-otp') setOtpInputs((current) => ({ ...current, [variables.id]: '' }))
            if (variables.action === 'delete-chef' || variables.action === 'delete-store') setConfirmDelete(null)
            setNotice(data.message || (variables.action === 'otp' ? 'OTP generated. Send it to the chef.' : 'Admin update saved.'))
            if (variables.action === 'settings') setSettingsDraft({ commissionRate: data.settings.commissionRate, deliveryFee: data.settings.deliveryFee, freeDeliveryMin: data.settings.freeDeliveryMin, paymentBlockDays: data.settings.paymentBlockDays })
            refreshAdmin()
        },
        onError: (error) => setNotice(errorMessage(error))
    })

    if (authLoading) return <main className="min-h-screen bg-[#fbfaf8] p-8"><div className="h-10 w-64 animate-pulse rounded bg-stone-200"/></main>
    if (!user) return <Navigate to="/login?next=%2Fadmin" replace/>
    if (user.role !== 'admin') return <Navigate to={user.role === 'chef' ? '/chef' : '/'} replace/>

    const data = stats.data || {}
    const waiting = data.waitingForAdmin || {}
    const allChefs = chefs.data || []
    const pendingChefs = allChefs.filter((chef) => chef.approvalStatus === 'pending')
    const otpRequests = (chefs.data || []).filter((chef) => chef.otpRequestedAt && !chef.phoneVerified)
    const allStores = stores.data || []
    const pendingStores = allStores.filter((store) => store.approvalStatus === 'pending')
    const searchable = approvalSearch.trim().toLowerCase()
    const filteredChefs = allChefs.filter((chef) => {
        const text = [chef.user?.name, chef.user?.phone, chef.user?.email, chef.city, chef._id].join(' ').toLowerCase()
        return (!searchable || text.includes(searchable)) && (approvalCity === 'all' || chef.city === approvalCity) && (approvalStatus === 'all' || chef.approvalStatus === approvalStatus)
    })
    const filteredStores = allStores.filter((store) => {
        const text = [store.name, store.owner?.name, store.owner?.phone, store.city, store._id].join(' ').toLowerCase()
        return (!searchable || text.includes(searchable)) && (approvalCity === 'all' || store.city === approvalCity) && (approvalStatus === 'all' || store.approvalStatus === approvalStatus)
    })
    const monthly = data.revenueByMonth || []
    const maxRevenue = Math.max(1, ...monthly.map((month) => (month.commission || 0) + (month.grocerySales || 0)))
    const completedCount = data.bookingsByStatus?.completed || 0
    const totalBookings = Object.values(data.bookingsByStatus || {}).reduce((sum, count) => sum + count, 0)
    const mainTitle = navItems.find(([key]) => key === tab)?.[1] || 'Overview'
    const exportAudit = () => {
        const rows = [['Metric', 'Value'], ['Completed bookings', completedCount], ['Total bookings', totalBookings], ['Platform commission accrued', data.totals?.commission || 0], ['Platform commission collected', data.totals?.collectedCommission || 0], ['Grocery sales', data.totals?.grocerySales || 0], ['Grocery sales settled', data.totals?.collectedGrocerySales || 0], ['Delivery fees', data.totals?.deliveryFees || 0], ['Verified settlements', data.totals?.settledBookings || 0], ['Open chef approvals', waiting.pendingChefs || 0], ['Open store approvals', waiting.pendingStores || 0], ['Open issues', waiting.openIssues || 0]]
        const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        link.download = `chef-haazir-audit-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }
    const changeTab = (key) => {
        setTab(key)
        setSearchParams({ tab: key })
        setNotice('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (key === 'overview') stats.refetch()
        if (key === 'approvals') { chefs.refetch(); stores.refetch() }
        if (key === 'payments') { payments.refetch(); settlements.refetch() }
        if (key === 'issues') { issues.refetch(); users.refetch() }
    }

    return <div className="min-h-screen bg-[#fbfaf8] text-ink">
        <div className="min-w-0">
            <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur"><div className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rust text-white"><Icon name="pot" size={22}/></span><div><p className="font-serif text-[20px] font-semibold leading-none text-rust">Chef Haazir</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Admin console</p></div><span className="mx-2 hidden h-9 w-px bg-line lg:block"/><div className="hidden lg:block"><h1 className="font-serif text-[20px] font-semibold">Operations Portal</h1><span className="text-[9px] text-muted">Lahore Hub · All Clusters</span></div></div><div className="flex items-center gap-2"><span className="hidden text-right text-[10px] text-muted sm:block">{user.name || 'Administrator'}<span className="block">Lahore Central Ops</span></span><button type="button" onClick={refreshAdmin} disabled={refreshing} aria-label="Refresh admin data" className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-rust transition hover:bg-stone-50 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"><Icon name="refresh" size={16} className={refreshing ? 'animate-spin' : ''}/><span className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block group-focus-visible:block">Refresh</span></button><button type="button" onClick={() => { logout(); navigate('/') }} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[10px] font-semibold text-ink/75 hover:bg-stone-50"><Icon name="logout" size={14}/><span className="hidden sm:inline">Log out</span></button></div></div><nav aria-label="Admin navigation" className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2 sm:px-7 xl:px-8">{navItems.map(([key, label, icon]) => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => changeTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-semibold transition sm:px-4 sm:text-[11px] ${tab === key ? 'bg-rust text-white shadow-sm' : 'text-ink/70 hover:bg-stone-100 hover:text-ink'}`}><Icon name={icon} size={15}/>{label}{key === 'approvals' && ((waiting.pendingChefs || 0) + (waiting.pendingStores || 0)) > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${tab === key ? 'bg-white/20' : 'bg-stone-200'}`}>{(waiting.pendingChefs || 0) + (waiting.pendingStores || 0)}</span>}{key === 'issues' && waiting.openIssues > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${tab === key ? 'bg-white/20' : 'bg-red-100 text-red-800'}`}>{waiting.openIssues}</span>}</button>)}</nav></header>
            <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 xl:px-8">
                {!['approvals', 'payments', 'issues', 'bookings'].includes(tab) && <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5"><div><div className="flex items-center gap-2"><Pill>Live sync · Lahore hub</Pill><span className="text-[9px] text-muted">Updated {stats.dataUpdatedAt ? new Date(stats.dataUpdatedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}</span></div><h2 className="mt-2 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]">{tab === 'overview' ? 'Central Operations & Lahore Hub Overview' : mainTitle}</h2><p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-muted">{tab === 'overview' ? 'Live ledger, partner onboarding backlog, and booking health across your service hubs.' : `Review and manage Chef Haazir ${mainTitle.toLowerCase()} using current platform records.`}</p></div>{tab === 'overview' && <button type="button" onClick={exportAudit} className="inline-flex items-center gap-2 rounded-lg bg-rust px-4 py-2.5 text-[11px] font-bold text-white hover:bg-rust-dark"><Icon name="wallet" size={15}/>Export financial audit</button>}</div>
                </>}
                {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-sage/20 bg-sage-soft px-4 py-3 text-[12px] text-sage-dark"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss" className="rounded p-1 hover:bg-white/60"><Icon name="close" size={14}/></button></div>}
                {stats.isError && tab === 'overview' && <Panel className="mb-5 border-rust/20 p-4 text-[12px] text-rust">Could not load dashboard metrics: {errorMessage(stats.error)} <button type="button" onClick={() => stats.refetch()} className="ml-2 underline">Retry</button></Panel>}

                {tab === 'overview' && <div className="space-y-5">
                    <Panel className="border-l-4 border-l-rust p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rust-soft text-rust"><Icon name="question" size={19}/></span><div><h3 className="font-serif text-[21px] font-semibold">Waiting for you <Pill tone="rust">{(waiting.pendingChefs || 0) + (waiting.pendingStores || 0) + (waiting.openIssues || 0)} action items</Pill></h3><p className="mt-1 text-[11px] text-muted">Review partner onboarding and customer issues.</p></div></div><span className="rounded-lg bg-orange-50 px-3 py-2 text-[10px] font-semibold text-rust">Approval queue · {waiting.pendingChefs || 0} chefs · {waiting.pendingStores || 0} stores · {waiting.openIssues || 0} issues</span></div><div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <button type="button" onClick={() => changeTab('approvals')} className="rounded-xl border border-line bg-[#fbfaf8] p-4 text-left transition hover:border-sage/40"><div className="flex items-center justify-between"><Pill>Chef profile</Pill><span className="text-[10px] font-bold text-rust">{waiting.pendingChefs || 0} pending</span></div><p className="mt-3 text-[13px] font-semibold">Chef onboarding review</p><p className="mt-1 text-[10px] leading-relaxed text-muted">Verify phone, agreement and profile approval.</p><span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-rust">Review approvals <Icon name="arrowRight" size={13}/></span></button>
                        <button type="button" onClick={() => changeTab('approvals')} className="rounded-xl border border-line bg-[#fbfaf8] p-4 text-left transition hover:border-sage/40"><div className="flex items-center justify-between"><Pill tone="rust">Grocery partner</Pill><span className="text-[10px] font-bold text-rust">{waiting.pendingStores || 0} pending</span></div><p className="mt-3 text-[13px] font-semibold">Store verification</p><p className="mt-1 text-[10px] leading-relaxed text-muted">Check store details and approve eligible partners.</p><span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-rust">Review stores <Icon name="arrowRight" size={13}/></span></button>
                        <button type="button" onClick={() => changeTab('issues')} className="rounded-xl border border-line bg-[#fbfaf8] p-4 text-left transition hover:border-rust/40"><div className="flex items-center justify-between"><Pill tone="red">Customer issue</Pill><span className="text-[10px] font-bold text-red-800">{waiting.openIssues || 0} open</span></div><p className="mt-3 text-[13px] font-semibold">Booking issue review</p><p className="mt-1 text-[10px] leading-relaxed text-muted">Review reports and resolve disputed orders.</p><span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-rust">Resolve issues <Icon name="arrowRight" size={13}/></span></button>
                    </div></Panel>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
                        ['Completed bookings', completedCount, 'Completed service orders', 'calendar'],
                        ['Commission collected', money(data.totals?.collectedCommission), `Accrued ${money(data.totals?.commission)} · ${money(data.totals?.unsettledCommission)} awaiting verification`, 'wallet'],
                        ['Grocery sales settled', money(data.totals?.collectedGrocerySales), `Sales ${money(data.totals?.grocerySales)} · ${money(data.totals?.unsettledGrocerySales)} awaiting verification`, 'basket'],
                        ['Verified settlements', data.totals?.settledBookings || 0, 'Completed bookings included in verified payouts', 'checkCircle']
                    ].map(([label, value, caption, icon]) => <Panel key={label} className="p-5"><div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rust-soft text-rust"><Icon name={icon} size={16}/></span></div><p className="mt-4 font-serif text-[29px] font-semibold">{stats.isLoading ? '—' : value}</p><p className="mt-1 text-[10px] text-muted">{caption}</p></Panel>)}</div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]"><Panel className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-serif text-[21px] font-semibold">Monthly revenue breakdown</h3><p className="mt-1 text-[10px] text-muted">Platform commission and grocery sales · completed orders</p></div><div className="flex gap-3 text-[9px] text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-rust"/>Commission</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#b85e38]"/>Groceries</span></div></div>{monthly.length ? <div className="mt-5 flex h-56 items-end gap-3 border-b border-line px-2 pb-2 sm:gap-5">{monthly.slice(-6).map((row) => { const groceryHeight = (row.grocerySales || 0) / maxRevenue * 100; const commissionHeight = (row.commission || 0) / maxRevenue * 100; return <div key={row.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="flex h-[85%] w-full max-w-12 flex-col justify-end overflow-hidden rounded-t-md bg-stone-100"><div title={`Commission ${money(row.commission)}`} className="w-full bg-rust" style={{ height: `${commissionHeight}%` }}/><div title={`Grocery sales ${money(row.grocerySales)}`} className="w-full bg-[#b85e38]" style={{ height: `${groceryHeight}%` }}/></div><span className="text-[9px] font-semibold text-muted">{row.month}</span></div>})}</div> : <Empty>No completed revenue data yet.</Empty>}<div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-[10px]"><span className="text-muted">Total platform commission</span><strong>{money(data.totals?.commission)}</strong><span className="text-muted">All time grocery sales</span><strong>{money(data.totals?.grocerySales)}</strong></div></Panel>
                        <Panel className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-serif text-[21px] font-semibold">Bookings by slot</h3><p className="mt-1 text-[10px] text-muted">Completed and confirmed booking demand</p></div><Pill>{data.bookingsPerSlot?.length || 0} slots</Pill></div><div className="mt-5 space-y-3">{(data.bookingsPerSlot || []).map((row) => { const peak = Math.max(1, ...(data.bookingsPerSlot || []).map((entry) => entry.bookings || 0)); return <div key={row.slot} className="grid grid-cols-[88px_minmax(0,1fr)_24px] items-center gap-2 text-[10px]"><span className="truncate text-muted">{row.slot}</span><div className="h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-sage" style={{ width: `${Math.max(3, (row.bookings || 0) / peak * 100)}%` }}/></div><strong className="text-right">{row.bookings}</strong></div>})}</div><div className="mt-5 rounded-lg bg-stone-50 px-3 py-2 text-[10px] text-muted">Most booked slot: <strong className="text-rust">{[...(data.bookingsPerSlot || [])].sort((a,b) => b.bookings - a.bookings)[0]?.slot || 'No activity'}</strong></div></Panel></div>

                    <div className="grid gap-5 xl:grid-cols-2"><Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h3 className="font-serif text-[20px] font-semibold">Top performing chefs</h3><p className="mt-1 text-[10px] text-muted">Ranked by completed bookings and commission</p></div><button type="button" onClick={() => setTab('approvals')} className="text-[10px] font-bold text-rust">Manage chefs →</button></div>{data.topChefs?.length ? <div className="divide-y divide-line">{data.topChefs.slice(0,5).map((chef, index) => <div key={chef.chefId} className="flex items-center gap-3 px-5 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[10px] font-bold text-sage-dark">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold">{chef.name}</p><p className="text-[9px] text-muted">{chef.bookings} completed bookings</p></div><span className="text-right"><strong className="block text-[11px]">{money(chef.earnedForPlatform)}</strong><small className="text-[9px] text-muted">commission</small></span></div>)}</div> : <Empty>No completed chef bookings yet.</Empty>}</Panel>
                        <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h3 className="font-serif text-[20px] font-semibold">Best-selling groceries</h3><p className="mt-1 text-[10px] text-muted">Top items by units sold and revenue</p></div><Pill>Live</Pill></div>{data.topItems?.length ? <div className="divide-y divide-line">{data.topItems.slice(0,5).map((item) => <div key={item._id} className="flex items-center justify-between gap-3 px-5 py-3"><div className="min-w-0"><p className="truncate text-[11px] font-semibold">{item.name}</p><p className="text-[9px] text-muted">{item.quantitySold} {item.unit} sold</p></div><strong className="shrink-0 text-[11px] text-rust">{money(item.revenue)}</strong></div>)}</div> : <Empty>No completed grocery sales yet.</Empty>}</Panel></div>
                    <Panel className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 px-5 py-4"><p className="text-[11px]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-sage"/><strong>Lahore service hub</strong> · {totalBookings.toLocaleString('en-PK')} bookings recorded</p><p className="text-[10px] text-muted">{waiting.pendingChefs || 0} chef approvals · {waiting.pendingStores || 0} store approvals · {waiting.openIssues || 0} open issues</p></Panel>
                </div>}

                {tab === 'approvals' && <AdminApprovals chefs={filteredChefs} stores={filteredStores} chefsLoading={chefs.isLoading} storesLoading={stores.isLoading} chefsError={chefs.isError ? errorMessage(chefs.error) : ''} storesError={stores.isError ? errorMessage(stores.error) : ''} approvalKind={approvalKind} setApprovalKind={setApprovalKind} approvalSearch={approvalSearch} setApprovalSearch={setApprovalSearch} approvalCity={approvalCity} setApprovalCity={setApprovalCity} approvalStatus={approvalStatus} setApprovalStatus={setApprovalStatus} cities={cities} otpInputs={otpInputs} setOtpInputs={setOtpInputs} actionMutation={actionMutation} setConfirmDelete={setConfirmDelete} />}

                {tab === 'bookings' && <AdminBookings bookings={bookings.data?.bookings || []} pagination={bookings.data?.pagination} bookingStats={bookings.data?.bookingStats || {}} status={bookingStatus} setStatus={setBookingStatus} loading={bookings.isLoading} error={bookings.isError ? errorMessage(bookings.error) : ''} />}

                {tab === 'payments' && <AdminPayments payments={payments.data?.chefs || []} totals={payments.data?.totals || {}} paymentsLoading={payments.isLoading} settlementsLoading={settlements.isLoading} paymentsError={payments.isError ? errorMessage(payments.error) : ''} settlementsError={settlements.isError ? errorMessage(settlements.error) : ''} actionMutation={actionMutation} />}

                {tab === 'issues' && <AdminGovernance issues={issues.data || []} closedIssues={closedIssues.data || []} users={users.data} issuesLoading={issues.isLoading} closedLoading={closedIssues.isLoading} usersLoading={users.isLoading} issuesError={issues.isError ? errorMessage(issues.error) : ''} usersError={users.isError ? errorMessage(users.error) : ''} userSearch={userSearch} setUserSearch={setUserSearch} actionMutation={actionMutation} />}

                {tab === 'settings' && <Panel className="max-w-3xl p-5 sm:p-7"><div className="border-b border-line pb-4"><h3 className="font-serif text-[22px] font-semibold">Platform settings</h3><p className="mt-1 text-[11px] text-muted">These defaults apply to new bookings.</p></div>{settings.isLoading ? <Empty>Loading settings…</Empty> : settingsDraft && <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); const value = Object.fromEntries(Object.entries(settingsDraft).map(([key, number]) => [key, Number(number)])); actionMutation.mutate({ action: 'settings', value }) }}>{[['commissionRate','Platform commission (%)'],['deliveryFee','Grocery delivery fee (Rs)'],['freeDeliveryMin','Free delivery threshold (Rs)'],['paymentBlockDays','Days before chef payment hold']].map(([key, label]) => <label key={key} className="block text-[11px] font-semibold">{label}<input type="number" min="0" step="1" value={settingsDraft[key]} onChange={(event) => setSettingsDraft({ ...settingsDraft, [key]: event.target.value })} className="mt-1.5 block w-full max-w-sm rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] font-normal outline-none focus:border-sage"/></label>)}<button type="submit" disabled={actionMutation.isPending} className="rounded-lg bg-rust px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50">{actionMutation.isPending ? 'Saving…' : 'Save settings'}</button></form>}</Panel>}
            </main>
        </div>
        {issuedCode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && setIssuedCode(null)}><section role="dialog" aria-modal="true" aria-labelledby="otp-generated-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-sage-dark">One-time code created</p><h2 id="otp-generated-title" className="mt-1 font-serif text-[25px] font-semibold">Send this code to {issuedCode.chefName}</h2></div><button type="button" onClick={() => setIssuedCode(null)} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-stone-100"><Icon name="close" size={16}/></button></div><p className="mt-2 text-[12px] text-muted">Send to {issuedCode.phone}. Expires {timeLabel(issuedCode.expiresAt)}.</p><p className="mt-5 rounded-xl bg-stone-50 py-5 text-center font-sans text-[36px] font-bold tracking-[0.35em]">{issuedCode.otp}</p><div className="mt-5 flex gap-2"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(issuedCode.otp); setNotice('OTP copied. Send it to the chef now.') } catch { setNotice('Copy was unavailable. Select and copy the OTP manually.') } }} className="flex-1 rounded-lg border border-line px-4 py-2.5 text-[11px] font-bold">Copy code</button><button type="button" onClick={() => setIssuedCode(null)} className="flex-1 rounded-lg bg-sage-dark px-4 py-2.5 text-[11px] font-bold text-white">Done</button></div></section></div>}
        {confirmDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && !actionMutation.isPending && setConfirmDelete(null)}><section role="dialog" aria-modal="true" aria-labelledby="delete-approval-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift"><p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Permanent removal</p><h2 id="delete-approval-title" className="mt-1 font-serif text-[24px] font-semibold">Delete {confirmDelete.name}?</h2><p className="mt-2 text-[12px] leading-relaxed text-muted">This removes the {confirmDelete.type === 'chef' ? 'chef profile and its account' : 'store catalog and partner record'}. Existing booking or settlement records prevent deletion and must be retained.</p><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={actionMutation.isPending} onClick={() => setConfirmDelete(null)} className="rounded-lg border border-line px-4 py-2.5 text-[11px] font-semibold">Keep record</button><button type="button" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ action: confirmDelete.type === 'chef' ? 'delete-chef' : 'delete-store', id: confirmDelete.id })} className="rounded-lg bg-red-700 px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50">{actionMutation.isPending ? 'Deleting…' : 'Delete permanently'}</button></div></section></div>}
    </div>
}

export default AdminDashboard
