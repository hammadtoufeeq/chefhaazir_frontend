import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/api'
import Icon from './Icon'

const STORAGE_KEY = 'chefhaazir_read_store_notifications'

const getReadStoreNotificationIds = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

const saveReadStoreNotificationIds = (ids) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
        /* storage disabled */
    }
}

export default function StoreNotificationsBell({ user, showToast = true }) {
    const [open, setOpen] = useState(false)
    const [readIds, setReadIds] = useState(getReadStoreNotificationIds)
    const [activeToast, setActiveToast] = useState(null)
    const containerRef = useRef(null)
    const seenIdsRef = useRef(new Set())
    const initialLoadRef = useRef(true)
    const navigate = useNavigate()

    const notificationsQuery = useQuery({
        queryKey: ['store-notifications', user?._id],
        queryFn: async () => {
            const res = await api.get('/grocery/notifications')
            return res.data.notifications || []
        },
        enabled: !!user && user.role === 'grocery_owner',
        refetchInterval: 15_000,
        refetchOnWindowFocus: true
    })

    const notifications = notificationsQuery.data || []

    const unreadNotifications = notifications.filter(
        (notif) => !readIds.includes(notif.id)
    )
    const unreadCount = unreadNotifications.length

    // Toast detection on fresh arrival
    useEffect(() => {
        if (!notifications.length) return

        if (initialLoadRef.current) {
            notifications.forEach((n) => seenIdsRef.current.add(n.id))
            initialLoadRef.current = false
            return
        }

        const freshArrival = notifications.find(
            (n) => !seenIdsRef.current.has(n.id) && !readIds.includes(n.id)
        )

        notifications.forEach((n) => seenIdsRef.current.add(n.id))

        if (freshArrival && showToast) {
            setActiveToast(freshArrival)
        }
    }, [notifications, readIds, showToast])

    // Auto dismiss toast after 9 seconds
    useEffect(() => {
        if (!activeToast) return
        const timer = setTimeout(() => setActiveToast(null), 9000)
        return () => clearTimeout(timer)
    }, [activeToast])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = (notifId) => {
        if (!readIds.includes(notifId)) {
            const next = [...readIds, notifId]
            setReadIds(next)
            saveReadStoreNotificationIds(next)
        }
    }

    const markAllAsRead = () => {
        const allIds = notifications.map((n) => n.id)
        const next = Array.from(new Set([...readIds, ...allIds]))
        setReadIds(next)
        saveReadStoreNotificationIds(next)
    }

    const handleNotificationClick = (notif) => {
        markAsRead(notif.id)
        setOpen(false)
        if (activeToast?.id === notif.id) setActiveToast(null)

        if (notif.groceryStatus === 'return_requested') {
            navigate('/store/returns')
        } else {
            navigate('/store/orders')
        }
    }

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            {/* Bell trigger button */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100 transition"
                aria-label={`Grocery store notifications (${unreadCount} unread)`}
                aria-expanded={open}
            >
                <Icon name="bell" size={18} className="text-ink/80" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* In-place Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-line bg-stone-50/70 px-4 py-3">
                            <div>
                                <h3 className="font-serif text-[16px] font-semibold text-ink">Store Notifications</h3>
                                <p className="text-[10px] text-muted">
                                    {unreadCount} unread · cancellations &amp; returns
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-rust hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-line/70">
                            {notifications.length === 0 ? (
                                <div className="px-5 py-9 text-center">
                                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-muted">
                                        <Icon name="bell" size={18} />
                                    </span>
                                    <p className="mt-2 text-[12px] font-semibold text-ink">No new notifications</p>
                                    <p className="mt-1 text-[11px] text-muted">Order cancellations and grocery return requests will appear here.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => {
                                    const isUnread = !readIds.includes(notif.id)
                                    const isCancel = notif.type === 'chef_cancelled' || notif.type === 'order_cancelled'

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${
                                                isUnread ? 'bg-rust-soft/20' : 'bg-white'
                                            }`}
                                        >
                                            <span
                                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                                    isCancel ? 'bg-rust-soft text-rust' : 'bg-sage-soft text-sage-dark'
                                                }`}
                                            >
                                                <Icon name={isCancel ? 'xCircle' : 'undo'} size={15} />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className={`text-[11.5px] font-bold leading-tight ${isCancel ? 'text-rust' : 'text-ink'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="shrink-0 text-[9px] text-muted font-medium">
                                                        {notif.date}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-[11px] leading-relaxed text-ink/80">
                                                    {notif.message}
                                                </p>

                                                {notif.chefPhone && (
                                                    <p className="mt-1 text-[10px] text-muted">
                                                        Chef phone: <span className="font-semibold text-ink">{notif.chefPhone}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Unread indicator dot on the very right */}
                                            {isUnread && (
                                                <span
                                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rust ring-2 ring-rust/20"
                                                    title="Unread notification"
                                                />
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pop-down Animated Toast Banner (Slides down from top) */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {activeToast && (
                            <motion.div
                                initial={{ opacity: 0, y: -45, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -25, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                className="fixed top-4 right-4 z-[9999] max-w-[min(440px,calc(100vw-32px))] rounded-2xl border border-rust/30 bg-white p-4 shadow-lift"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rust-soft text-rust">
                                        <Icon name={activeToast.type === 'return_requested' ? 'undo' : 'xCircle'} size={20} />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-rust animate-ping" />
                                            <p className="text-[12px] font-bold text-rust">{activeToast.title}</p>
                                        </div>
                                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink/85">
                                            {activeToast.message}
                                        </p>
                                        <div className="mt-2.5 flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleNotificationClick(activeToast)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-rust px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rust-dark transition"
                                            >
                                                {activeToast.groceryStatus === 'return_requested' ? 'View Returns →' : 'View Orders →'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveToast(null)}
                                                className="text-[11px] font-medium text-muted hover:text-ink"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setActiveToast(null)}
                                        aria-label="Close toast"
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
        </div>
    )
}
