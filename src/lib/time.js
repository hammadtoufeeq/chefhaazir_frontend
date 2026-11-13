// Same rules as the backend: Pakistan is always UTC+5 and dates are YYYY-MM-DD

export const SLOTS = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22']

export const todayInPakistan = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)

export const addDays = (date, days) => {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

// "08-10" -> "8:00 AM – 10:00 AM"
const hourLabel = (h) => {
    const n = Number(h)
    const suffix = n >= 12 ? 'PM' : 'AM'
    return `${n % 12 || 12}:00 ${suffix}`
}
export const slotLabel = (slot) => {
    const [start, end] = slot.split('-')
    return `${hourLabel(start)} – ${hourLabel(end)}`
}

// "2026-11-14" -> { day: 'Sat', date: 14, month: 'Nov' }
export const dateParts = (date) => {
    const d = new Date(`${date}T00:00:00Z`)
    return {
        day: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        date: d.getUTCDate(),
        month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    }
}
