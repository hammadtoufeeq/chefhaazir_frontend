import { useEffect } from 'react'
import Icon from './Icon'

const ConfirmDialog = ({ open, title, description, confirmLabel = 'Confirm', tone = 'sage', busy = false, onConfirm, onCancel }) => {
    useEffect(() => {
        if (!open) return undefined
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !busy) onCancel()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, busy, onCancel])

    if (!open) return null
    const confirmColor = tone === 'danger' ? 'bg-rust hover:bg-rust-dark' : 'bg-sage-dark hover:bg-sage'

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
            <section role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-lift sm:p-6">
                <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === 'danger' ? 'bg-rust-soft text-rust' : 'bg-sage-soft text-sage-dark'}`}><Icon name={tone === 'danger' ? 'question' : 'checkCircle'} size={19}/></span><div className="min-w-0 flex-1"><h2 id="confirm-dialog-title" className="font-serif text-[22px] font-semibold">{title}</h2><p id="confirm-dialog-description" className="mt-1.5 text-[12px] leading-relaxed text-muted">{description}</p></div><button type="button" onClick={onCancel} disabled={busy} aria-label="Close dialog" className="rounded-full p-2 text-muted hover:bg-stone-100 disabled:opacity-40"><Icon name="close" size={15}/></button></div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-line px-4 py-2.5 text-[12px] font-semibold hover:bg-stone-50 disabled:opacity-50">No, go back</button><button type="button" onClick={onConfirm} disabled={busy} className={`rounded-lg px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-50 ${confirmColor}`}>{busy ? 'Please wait…' : confirmLabel}</button></div>
            </section>
        </div>
    )
}

export default ConfirmDialog
