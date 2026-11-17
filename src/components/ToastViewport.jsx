import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'

const ToastViewport = () => {
    const [toast, setToast] = useState(null)

    useEffect(() => {
        const onToast = (event) => setToast({ ...event.detail, id: Date.now() })
        window.addEventListener('chefhaazir:toast', onToast)
        return () => window.removeEventListener('chefhaazir:toast', onToast)
    }, [])

    useEffect(() => {
        if (!toast) return undefined
        const timer = window.setTimeout(() => setToast(null), 3500)
        return () => window.clearTimeout(timer)
    }, [toast])

    const success = toast?.type === 'success'
    return <div className="pointer-events-none fixed bottom-4 right-4 z-[100] w-[min(380px,calc(100vw-32px))] sm:bottom-6 sm:right-6" aria-live="polite"><AnimatePresence>{toast && <motion.div key={toast.id} initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.22, ease: 'easeOut' }} role="status" className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_16px_45px_-18px_rgba(30,25,18,0.35)] ${success ? 'border-sage/25' : 'border-red-200'}`}><span className={`absolute inset-y-0 left-0 w-1 ${success ? 'bg-sage-dark' : 'bg-red-500'}`}/><div className="flex items-start gap-3 pl-1"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${success ? 'bg-sage-soft text-sage-dark' : 'bg-red-100 text-red-700'}`}><Icon name={success ? 'checkCircle' : 'close'} size={19}/></span><div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-ink">{toast.title || (success ? 'Success' : 'Something went wrong')}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{toast.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)} className="rounded-lg p-1.5 text-muted transition hover:bg-stone-100 hover:text-ink"><Icon name="close" size={14}/></button></div></motion.div>}</AnimatePresence></div>
}

export default ToastViewport
