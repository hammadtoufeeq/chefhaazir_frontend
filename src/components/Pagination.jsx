import Icon from './Icon'

// Page numbers with "…" when there are many pages
const pageList = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
    const sorted = [...set].sort((a, b) => a - b)
    return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ['…', p] : [p]))
}

const Pagination = ({ page, totalPages, onPage }) => {
    if (totalPages <= 1) return null
    const btn = 'flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition disabled:pointer-events-none disabled:opacity-40'
    const idle = 'border-line bg-white hover:border-sage/50'
    return (
        <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} ${idle}`}><Icon name="arrowLeft" size={14} /> Prev</button>
            {pageList(page, totalPages).map((p, i) => p === '…'
                ? <span key={`gap${i}`} className="px-1 text-muted">…</span>
                : <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)} className={`${btn} ${p === page ? 'border-sage-dark bg-sage-dark text-white' : idle}`}>{p}</button>
            )}
            <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} ${idle}`}>Next <Icon name="arrowRight" size={14} /></button>
        </nav>
    )
}

export default Pagination
