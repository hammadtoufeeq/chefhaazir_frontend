import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import Icon from '../components/Icon'
import toast from '../lib/toast'

const initialForm = { name: '', email: '', password: '', phone: '', storeName: '', city: '', address: '' }
const AdminGroceryOwners = () => {
    const client = useQueryClient()
    const [form, setForm] = useState(null)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const query = useQuery({ queryKey: ['admin-grocery-owners'], queryFn: async () => (await api.get('/admin/grocery-owners')).data.stores || [] })
    const mutation = useMutation({
        mutationFn: async ({ mode, id, values }) => mode === 'create'
            ? (await api.post('/admin/grocery-owners', values)).data
            : mode === 'update'
                ? (await api.patch(`/admin/grocery-owners/${id}`, values)).data
                : mode === 'status'
                    ? (await api.patch(`/admin/users/${id}/status`, values)).data
                    : (await api.delete(`/admin/grocery-owners/${id}`)).data,
        onSuccess: (result, variables) => {
            setForm(null); setEditing(null); setDeleting(null)
            toast.success(result.message || 'Grocery owner updated.', variables.mode === 'create' ? 'Owner created' : 'Changes saved')
            client.invalidateQueries({ queryKey: ['admin-grocery-owners'] })
            client.invalidateQueries({ queryKey: ['admin-stores'] })
            client.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: (error) => toast.error(errorMessage(error))
    })
    const submit = (event, mode, id, current) => {
        event.preventDefault()
        const allowed = ['name', 'email', 'password', 'phone', 'storeName', 'city', 'address']
        const values = Object.fromEntries(allowed.map((key) => [key, current[key]]).filter(([, value]) => value !== '' && value !== undefined))
        mutation.mutate({ mode, id, values })
    }
    const field = (key, label, opts = {}) => <label key={key} className="block text-[10px] font-semibold text-ink/80">{label}{opts.select ? <select required={!opts.optional} value={form?.[key] ?? editing?.[key] ?? ''} onChange={(event) => opts.change(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[11px]"><option value="">Choose city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select> : <input required={!opts.optional} type={opts.type || 'text'} minLength={opts.minLength} autoComplete={key === 'password' ? 'new-password' : undefined} value={form?.[key] ?? editing?.[key] ?? ''} onChange={(event) => opts.change(event.target.value)} placeholder={opts.placeholder || label} className="mt-1.5 block w-full rounded-lg border border-line px-3 py-2.5 text-[11px] outline-none focus:border-sage"/>}</label>
    const modal = (mode) => {
        const isCreate = mode === 'create'
        const current = isCreate ? form : editing
        if (!current) return null
        const update = (key, value) => isCreate ? setForm((prev) => ({ ...prev, [key]: value })) : setEditing((prev) => ({ ...prev, [key]: value }))
        const values = current
        return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && !mutation.isPending && (isCreate ? setForm(null) : setEditing(null))}><form onSubmit={(event) => submit(event, isCreate ? 'create' : 'update', current._id, values)} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-lift sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-rust">Single city · Single store</p><h3 className="mt-1 font-serif text-[24px] font-semibold">{isCreate ? 'Create grocery owner' : `Edit ${current.owner?.name || 'grocery owner'}`}</h3></div><button type="button" onClick={() => isCreate ? setForm(null) : setEditing(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-stone-100"><Icon name="close" size={15}/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{field('name','Owner full name',{change:(v)=>update('name',v)})}{field('email','Login email',{type:'email',change:(v)=>update('email',v)})}{field('password',isCreate?'Initial password':'New password (optional)',{type:'password',optional:!isCreate,minLength:8,placeholder:isCreate?'At least 8 characters':'Leave blank to keep current password',change:(v)=>update('password',v)})}{field('phone','Phone number',{placeholder:'03XXXXXXXXX',change:(v)=>update('phone',v)})}{field('storeName','Store name',{change:(v)=>update('storeName',v)})}{field('city','Assigned city',{select:true,change:(v)=>update('city',v)})}<div className="sm:col-span-2">{field('address','Store address',{change:(v)=>update('address',v)})}</div></div><p className="mt-3 text-[10px] text-muted">The owner is assigned to this city only. The store is activated when created.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>isCreate?setForm(null):setEditing(null)} className="rounded-lg border border-line px-4 py-2.5 text-[10px] font-bold">Cancel</button><button disabled={mutation.isPending} className="rounded-lg bg-rust px-4 py-2.5 text-[10px] font-bold text-white disabled:opacity-50">{mutation.isPending?'Saving…':isCreate?'Create owner & store':'Save changes'}</button></div></form></div>
    }

    return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rust">Merchant accounts · City assignment</p><h2 className="mt-2 font-serif text-[32px] font-semibold leading-[1.05] sm:text-[40px]">Grocery Owners</h2><p className="mt-2 text-[12px] text-muted">Create one owner for each city and manage their store access.</p></div><button type="button" onClick={()=>setForm({...initialForm})} className="inline-flex items-center gap-2 rounded-lg bg-rust px-4 py-3 text-[11px] font-bold text-white"><Icon name="plus" size={15}/>Create Grocery Owner</button></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-white p-4"><p className="text-[9px] font-bold uppercase text-muted">Assigned grocery cities</p><p className="mt-1 font-serif text-[25px] font-semibold">{query.data?.length || 0}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-[9px] font-bold uppercase text-muted">Available cities</p><p className="mt-1 font-serif text-[25px] font-semibold">{Math.max(0,cities.length-(query.data?.length||0))}</p></div></div>
        {query.isLoading?<div className="rounded-xl bg-white p-10 text-center text-[11px] text-muted">Loading grocery owners…</div>:query.isError?<div role="alert" className="rounded-xl bg-red-50 p-4 text-[11px] text-red-800">{errorMessage(query.error)}</div>:query.data?.length?<div className="space-y-3">{query.data.map((store)=><article key={store._id} className="flex flex-col gap-4 rounded-xl border border-line border-l-4 border-l-sage-dark bg-white p-4 shadow-card sm:flex-row sm:items-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-soft text-sage-dark"><Icon name="store" size={20}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-[19px] font-semibold">{store.name}</h3><span className="rounded-full bg-sage-soft px-2.5 py-1 text-[9px] font-bold text-sage-dark">{store.city}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${store.owner?.status==='suspended'?'bg-red-100 text-red-800':'bg-stone-100 text-ink/70'}`}>{store.owner?.status==='suspended'?'Suspended':'Active'}</span></div><p className="mt-1 text-[11px]">{store.owner?.name} · {store.owner?.email} · {store.owner?.phone}</p><p className="mt-1 text-[10px] text-muted">{store.address} · Portal login opens this assigned store.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setEditing({...store.owner, _id:store._id, name:store.owner?.name, email:store.owner?.email, phone:store.owner?.phone, city:store.city, address:store.address, storeName:store.name, password:''})} className="rounded-lg border border-line px-3 py-2 text-[10px] font-bold">Edit</button><button type="button" disabled={mutation.isPending} onClick={()=>mutation.mutate({mode:'status',id:store.owner?._id,values:{status:store.owner?.status==='active'?'suspended':'active',...(store.owner?.status==='active'?{reason:'Suspended by an administrator.'}:{})}})} className="rounded-lg border border-line px-3 py-2 text-[10px] font-bold">{store.owner?.status==='suspended'?'Reactivate':'Suspend'}</button><button type="button" onClick={()=>setDeleting(store)} className="rounded-lg px-3 py-2 text-[10px] font-bold text-red-700 hover:bg-red-50">Delete</button></div></article>)}</div>:<div className="rounded-xl bg-white p-10 text-center text-[11px] text-muted">No grocery owners yet. Create an owner to assign a store and city.</div>}
        {modal('create')}{modal('edit')}{deleting&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lift"><h3 className="font-serif text-[22px] font-semibold">Delete {deleting.name}?</h3><p className="mt-2 text-[11px] leading-relaxed text-muted">This permanently removes the owner account and store. Stores with existing orders are protected; suspend the account to retain its history.</p><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setDeleting(null)} className="rounded-lg border border-line px-4 py-2.5 text-[10px] font-bold">Keep account</button><button disabled={mutation.isPending} onClick={()=>mutation.mutate({mode:'delete',id:deleting._id})} className="rounded-lg bg-red-700 px-4 py-2.5 text-[10px] font-bold text-white">Delete permanently</button></div></div></div>}</div>
}

export default AdminGroceryOwners
