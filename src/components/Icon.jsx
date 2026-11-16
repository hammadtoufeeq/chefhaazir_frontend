// Small line icons (24px grid, stroke = currentColor)
const paths = {
    pin: <><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.4 4.6-4.8" /></>,
    shield: <><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    tag: <><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
    wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14.5h2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    basket: <><path d="M4 10h16l-1.6 9H5.6L4 10Z" /><path d="m8 10 3-6m5 6-3-6M9 14v2m3-2v2m3-2v2" /></>,
    pot: <><path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5Z" /><path d="M2 10h20M9 4c0 1.5 1 1.5 1 3m4-3c0 1.5 1 1.5 1 3" /></>,
    chef: <><path d="M7 14v5h10v-5" /><path d="M7 14a4 4 0 0 1-1-7.9A4 4 0 0 1 12 4a4 4 0 0 1 6 2.1A4 4 0 0 1 17 14H7Z" /><path d="M7 17h10" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
    phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
    heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
    store: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12v8h13v-8M10 20v-4.5h4V20" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4m8-4v4" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h10" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="m10 16-4-4 4-4M6 12h10" /></>,
    sparkle: <path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2L12 3.5Z" />
}

const Icon = ({ name, size = 18, className = '', strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {paths[name]}
    </svg>
)

export default Icon
