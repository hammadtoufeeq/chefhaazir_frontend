import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Icon from './Icon'

const formatTimeAgo = (dateValue) => {
    if (!dateValue) return ''
    const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

const ChefNotificationsBell = ({ user, showToast = true, dark = true }) => {
    const userKey = user?.id || user?._id || user?.email || 'chef'
    const storageKey = `chefhaazir-read-chef-notifications:${userKey}`
    const [open, setOpen] = useState(false)
    const [toast, setToast] = useState(null)
    const containerRef = useRef(null)
    const seenRef = useRef(null)
    const navigate = useNavigate()

    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '[]')
        } catch {
            return []
        }
    })

    const { data: notifications = [] } = useQuery({
        queryKey: ['chef-notifications', userKey],
        queryFn: async () => (await api.get('/bookings/chef/notifications')).data.notifications ?? [],
        enabled: user?.role === 'chef',
        staleTime: 8_000,
        refetchInterval: 12_000,
        refetchOnWindowFocus: true
    })

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const close = (e) => {
            if (!containerRef.current?.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [open])

    // Detect new incoming notifications for the Pop-Down Toast Banner
    useEffect(() => {
        if (!notifications.length) return
        const currentIds = new Set(notifications.map((n) => n.id))
        if (seenRef.current === null) {
            seenRef.current = currentIds
            return
        }
        const fresh = notifications.filter((n) => !seenRef.current.has(n.id) && !readIds.includes(n.id))
        currentIds.forEach((id) => seenRef.current.add(id))
        if (fresh.length && showToast) {
            setToast(fresh[0])
        }
    }, [notifications, readIds, showToast])

    // Auto-dismiss toast banner after 9 seconds
    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 9_000)
        return () => clearTimeout(timer)
    }, [toast])

    const markRead = (id) => {
        setReadIds((prev) => {
            const next = Array.from(new Set([...prev, id]))
            try {
                localStorage.setItem(storageKey, JSON.stringify(next))
            } catch {}
            return next
        })
    }

    const markAllRead = () => {
        const allIds = notifications.map((n) => n.id)
        setReadIds(allIds)
        try {
            localStorage.setItem(storageKey, JSON.stringify(allIds))
        } catch {}
    }

    const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

    const handleNotificationClick = (notification) => {
        markRead(notification.id)
        setOpen(false)
        setToast(null)
        if (notification.type === 'new_order') {
            // Route to the Bookings page, Pending filter, and highlight the specific booking
            navigate(`/chef/bookings?status=pending&bookingId=${notification.bookingId}`)
        } else {
            // Route to the Bookings page with the grocery modal open
            navigate(`/chef/bookings?bookingId=${notification.bookingId}&openGrocery=true`)
        }
    }

    return (
        <>
            <div ref={containerRef} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label={`${unreadCount} chef notifications`}
                    aria-expanded={open}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                        dark
                            ? 'text-white/85 hover:bg-white/10'
                            : 'text-ink/80 hover:bg-stone-100 hover:text-ink'
                    }`}
                >
                    <Icon name="bell" size={19} />
                    {unreadCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Notification Dropdown Popover */}
                <AnimatePresence>
                    {open && (
                        <motion.section
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            role="dialog"
                            aria-label="Chef notifications"
                            className="absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-lift"
                        >
                            {/* Dropdown Header */}
                            <div className="flex items-center justify-between border-b border-line bg-stone-50/70 px-4 py-3">
                                <div>
                                    <p className="font-serif text-[17px] font-semibold leading-tight">Chef Notifications</p>
                                    <p className="text-[10px] text-muted">
                                        {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                                    </p>
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllRead}
                                        className="text-[10px] font-bold text-rust hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            {notifications.length > 0 ? (
                                <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
                                    {notifications.map((n) => {
                                        const unread = !readIds.includes(n.id)
                                        const isNewOrder = n.type === 'new_order'
                                        return (
                                            <li key={n.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${
                                                        unread ? 'bg-sage-soft/15' : 'bg-white'
                                                    }`}
                                                >
                                                    {/* Icon */}
                                                    <span
                                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                                            isNewOrder
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'bg-sage-soft text-sage-dark'
                                                        }`}
                                                    >
                                                        <Icon name={isNewOrder ? 'bell' : 'truck'} size={16} />
                                                    </span>

                                                    {/* Details */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <strong className="truncate text-[12px] font-bold text-ink">
                                                                {n.title}
                                                            </strong>
                                                            <span className="shrink-0 text-[10px] text-muted">
                                                                {formatTimeAgo(n.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink/80">
                                                            {n.message}
                                                        </p>
                                                        <p className="mt-1 text-[10px] font-semibold text-rust">
                                                            {isNewOrder ? 'View request details →' : 'View grocery status →'}
                                                        </p>
                                                    </div>

                                                    {/* Unread Dot on the Very Right */}
                                                    {unread && (
                                                        <span
                                                            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-rust ring-2 ring-rust/20 animate-pulse"
                                                            title="Unread"
                                                        />
                                                    )}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <div className="px-4 py-10 text-center">
                                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-muted">
                                        <Icon name="bell" size={18} />
                                    </span>
                                    <p className="mt-3 font-serif text-[15px] font-semibold">No notifications yet</p>
                                    <p className="mt-1 text-[11px] text-muted">
                                        When you receive a new booking or grocery dispatch updates, they will appear here.
                                    </p>
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* Pop-Down Notification Bar (Toast Banner) */}
            {createPortal(
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                            role="status"
                            aria-live="polite"
                            className="fixed left-1/2 top-5 z-[999] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-sage/35 bg-white p-4 shadow-lift ring-1 ring-black/5"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                                        toast.type === 'new_order'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-sage-dark text-white'
                                    }`}
                                >
                                    <Icon name={toast.type === 'new_order' ? 'bell' : 'truck'} size={20} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rust">
                                            {toast.type === 'new_order' ? 'New Request Alert' : 'Grocery Dispatch'}
                                        </span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-rust" />
                                    </div>
                                    <h4 className="mt-0.5 font-serif text-[16px] font-semibold leading-tight text-ink">
                                        {toast.title}
                                    </h4>
                                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                                        {toast.message}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleNotificationClick(toast)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-sage-dark px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-sage"
                                        >
                                            {toast.type === 'new_order' ? 'Open pending order' : 'View grocery status'}
                                            <Icon name="arrowRight" size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                markRead(toast.id)
                                                setToast(null)
                                            }}
                                            className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-stone-50"
                                        >
                                            Mark as read
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setToast(null)}
                                    aria-label="Dismiss notification"
                                    className="rounded-lg p-1 text-muted hover:bg-stone-100 hover:text-ink"
                                >
                                    <Icon name="close" size={15} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}

export default ChefNotificationsBell