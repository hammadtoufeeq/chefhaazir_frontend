import { motion } from 'framer-motion'

// Hand-drawn underline that draws itself
export const Underline = ({ className = '', color = 'var(--color-haldi)', delay = 0.6 }) => (
    <svg className={className} viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true">
        <motion.path
            d="M4 11 C 70 3, 150 15, 210 7 S 285 5, 296 10"
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay, ease: 'easeInOut' }}
        />
    </svg>
)

// Three rising wisps of steam
export const Steam = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 60 40" aria-hidden="true">
        {[12, 30, 48].map((x, i) => (
            <path
                key={x}
                d={`M${x} 36 q-6 -8 0 -16 q6 -8 0 -16`}
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-steam"
                style={{ animationDelay: `${i * 0.5}s` }}
            />
        ))}
    </svg>
)

// Dashed connector line between steps
export const DashedArrow = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 120 40" aria-hidden="true">
        <path d="M4 30 C 40 0, 80 0, 112 22" stroke="var(--color-muted)" strokeWidth="2" strokeDasharray="6 7" fill="none" strokeLinecap="round" />
        <path d="M104 14 L114 23 L101 27" stroke="var(--color-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)
