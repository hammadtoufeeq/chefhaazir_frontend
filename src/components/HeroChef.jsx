import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

// ---------------------------------------------------------------------------
// Hero chef card: a chef holding an empty plate. Every 4 seconds a different
// dish appears on the plate, and after the last one the first comes back.
//
// Put the chef photo at  public/chef2.jpg  (it is loaded as /chef2.jpg).
// PLATE was measured from that photo (2048 x 1359): where the plate sits as a
// percentage of the image, its width, its shape and its tilt. If you swap in a
// different photo, measure the plate again and update these numbers.
// ---------------------------------------------------------------------------

const CHEF_PHOTO = '/chef2.jpg'
const PHOTO_SIZE = { width: 2048, height: 1359 }
const PLATE = { x: 21.97, y: 69.1, w: 19.04, ratio: 390 / 228, tilt: -21.7 }
const SWAP_MS = 4000

// Small deterministic random generator, so the rice grains never jump around between renders
const seeded = (seed) => {
    let s = seed
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

const scatter = (count, seed, radius, cx = 100, cy = 100) => {
    const rnd = seeded(seed)
    return Array.from({ length: count }, () => {
        const a = rnd() * Math.PI * 2
        const d = Math.sqrt(rnd()) * radius
        return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, rot: Math.round(rnd() * 180), pick: rnd() }
    })
}

// One piece of food pops onto the plate; pieces are staggered with `i`
const Pop = ({ i = 0, children }) => {
    const reduce = useReducedMotion()
    return (
        <motion.g
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 260, damping: 15 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
            {children}
        </motion.g>
    )
}

// ---------------- Fruit pieces ----------------
const Orange = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#F28C1E" />
        <circle cx={cx} cy={cy} r={r * 0.86} fill="#FFC95C" />
        {Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4
            return <line key={k} x1={cx} y1={cy} x2={cx + Math.cos(a) * r * 0.82} y2={cy + Math.sin(a) * r * 0.82} stroke="#F8A93A" strokeWidth="1.6" />
        })}
        <circle cx={cx} cy={cy} r={r * 0.13} fill="#FFE3A3" />
    </g>
)

const Kiwi = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#6BA32E" />
        <circle cx={cx} cy={cy} r={r * 0.84} fill="#B5DB6A" />
        <circle cx={cx} cy={cy} r={r * 0.3} fill="#F3F7C8" />
        {Array.from({ length: 12 }, (_, k) => {
            const a = (k * Math.PI) / 6
            return <ellipse key={k} cx={cx + Math.cos(a) * r * 0.52} cy={cy + Math.sin(a) * r * 0.52} rx="1.1" ry="1.7" fill="#23261A" transform={`rotate(${(k * 30) + 90} ${cx + Math.cos(a) * r * 0.52} ${cy + Math.sin(a) * r * 0.52})`} />
        })}
    </g>
)

const Strawberry = ({ cx, cy, r }) => (
    <g>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.08} fill="#D8283B" />
        <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.35} ry={r * 0.22} fill="#F06A74" opacity="0.7" />
        {[[-0.4, 0.1], [0.3, 0.05], [0, 0.45], [-0.45, 0.55], [0.45, 0.5], [0, -0.15]].map(([dx, dy], k) => (
            <ellipse key={k} cx={cx + dx * r} cy={cy + dy * r} rx="0.9" ry="1.4" fill="#FFE08A" />
        ))}
        <path d={`M${cx - r * 0.5} ${cy - r * 0.85} l${r * 0.5} ${r * 0.3} l${r * 0.5} -${r * 0.3} l-${r * 0.15} ${r * 0.45} l-${r * 0.35} ${r * 0.1} l-${r * 0.35} -${r * 0.1} z`} fill="#3E9B3A" />
    </g>
)

const Banana = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#F2D35C" />
        <circle cx={cx} cy={cy} r={r * 0.78} fill="#FFF1B0" />
        <circle cx={cx} cy={cy} r={r * 0.2} fill="#C9A53A" />
    </g>
)

const Blueberry = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#33469B" />
        <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.28} fill="#FFFFFF" opacity="0.4" />
        <circle cx={cx + r * 0.1} cy={cy + r * 0.15} r={r * 0.2} fill="#1E2A63" />
    </g>
)

const Grape = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#7B3F98" />
        <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.3} fill="#FFFFFF" opacity="0.35" />
    </g>
)

const Leaf = ({ cx, cy, rot = 0, fill = '#3E9B4A', size = 1 }) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <ellipse cx={cx} cy={cy} rx={8 * size} ry={4 * size} fill={fill} />
        <line x1={cx - 7 * size} y1={cy} x2={cx + 7 * size} y2={cy} stroke="#2A7335" strokeWidth="0.8" />
    </g>
)

const Lemon = ({ cx, cy, r = 14, rot = 0 }) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <path d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${r * 2} 0 z`} fill="#F7D93B" />
        <path d={`M${cx - r * 0.78} ${cy} a${r * 0.78} ${r * 0.78} 0 0 1 ${r * 1.56} 0 z`} fill="#FFF3A0" />
        {[-0.5, 0, 0.5].map((k) => <line key={k} x1={cx} y1={cy} x2={cx + k * r * 0.9} y2={cy - r * 0.7} stroke="#F7D93B" strokeWidth="1.1" />)}
    </g>
)

// A chunk of chicken: irregular, glazed on top
const Piece = ({ x, y, rot = 0, scale = 1, base = '#A5471E', glaze = '#D98A4C' }) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
        <path d="M-15 1 C-16 -8 -5 -12 5 -10 C15 -9 18 3 9 9 C0 14 -14 10 -15 1 Z" fill={base} stroke="#6E2D0E" strokeWidth="0.8" />
        <path d="M-9 0 C-9 -5 -2 -7 5 -6 C10 -5 11 1 6 4 C0 7 -8 5 -9 0 Z" fill={glaze} />
        <path d="M-5 -3 q5 -3 10 -1" fill="none" stroke="#F3C28F" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
    </g>
)

// Fills the plate better: scales a dish up around the plate centre
const Fit = ({ k = 1, children }) => <g transform={`translate(100 100) scale(${k}) translate(-100 -100)`}>{children}</g>

// ---------------- The four dishes (drawn top-down in a 200 x 200 box) ----------------
const FruitArt = () => (
    <Fit k={1.16}>
        <Pop i={0}><g>{[[46, 68], [60, 66], [53, 80], [40, 82], [66, 80]].map(([x, y]) => <Grape key={`${x}${y}`} cx={x} cy={y} r="8" />)}</g></Pop>
        <Pop i={1}><Kiwi cx={100} cy={47} r={16} /></Pop>
        <Pop i={2}><Orange cx={146} cy={74} r={17} /></Pop>
        <Pop i={3}><Strawberry cx={147} cy={127} r={14} /></Pop>
        <Pop i={4}><g><Banana cx={78} cy={150} r={11} /><Banana cx={97} cy={155} r={11} /><Banana cx={117} cy={149} r={11} /></g></Pop>
        <Pop i={5}><Strawberry cx={53} cy={125} r={14} /></Pop>
        <Pop i={6}>
            <g>
                <Blueberry cx={92} cy={96} r={9} />
                <Blueberry cx={111} cy={91} r={9} />
                <Blueberry cx={101} cy={111} r={9} />
                <Blueberry cx={120} cy={108} r={8} />
                <Blueberry cx={83} cy={113} r={8} />
            </g>
        </Pop>
        <Pop i={7}><g><Leaf cx={126} cy={86} rot={-30} /><Leaf cx={76} cy={88} rot={40} /></g></Pop>
    </Fit>
)

const riceGrains = scatter(110, 7, 54, 100, 102)
const grainFills = ['#FFF2C7', '#F4B24A', '#E27B2C', '#FFFFFF', '#8BC34A']

const BiryaniArt = () => (
    <>
        <defs>
            <radialGradient id="hc-bir-rice" cx="0.5" cy="0.45" r="0.6">
                <stop offset="0" stopColor="#FBE08A" />
                <stop offset="0.7" stopColor="#F0B93E" />
                <stop offset="1" stopColor="#D9902A" />
            </radialGradient>
        </defs>
        <Pop i={0}>
            <g>
                <circle cx="100" cy="102" r="58" fill="url(#hc-bir-rice)" />
                {riceGrains.map((g, k) => (
                    <ellipse key={k} cx={g.x} cy={g.y} rx="4.4" ry="1.5" fill={grainFills[Math.floor(g.pick * grainFills.length)]} transform={`rotate(${g.rot} ${g.x} ${g.y})`} />
                ))}
            </g>
        </Pop>
        {[[68, 92, -20], [132, 96, 25], [100, 134, 8]].map(([x, y, rot], k) => (
            <Pop key={k} i={k + 1}><Piece x={x} y={y} rot={rot} scale={1.15} /></Pop>
        ))}
        <Pop i={4}>
            <g>
                <ellipse cx="100" cy="72" rx="11" ry="14" fill="#FFFDF5" stroke="#E6E0CF" strokeWidth="1" />
                <circle cx="100" cy="74" r="6.2" fill="#F5BF2E" />
                <circle cx="98" cy="72" r="1.8" fill="#FBE08A" />
            </g>
        </Pop>
        <Pop i={5}>
            <g>
                {[[78, 108], [120, 118], [88, 78], [112, 132], [60, 100], [140, 100]].map(([x, y], k) => (
                    <path key={k} d={`M${x} ${y} q4 -6 9 0`} fill="none" stroke="#7A4A22" strokeWidth="2.2" strokeLinecap="round" />
                ))}
            </g>
        </Pop>
        <Pop i={6}><g><Leaf cx={84} cy={64} rot={-25} size={0.9} /><Leaf cx={118} cy={64} rot={25} size={0.9} /></g></Pop>
        <Pop i={7}><Lemon cx={156} cy={140} r={13} rot={-25} /></Pop>
    </>
)

const KarahiArt = () => (
    <>
        <defs>
            <radialGradient id="hc-kar-gravy" cx="0.5" cy="0.45" r="0.6">
                <stop offset="0" stopColor="#D2552B" />
                <stop offset="0.75" stopColor="#B23F1C" />
                <stop offset="1" stopColor="#8B2E12" />
            </radialGradient>
        </defs>
        <Pop i={0}>
            <g>
                <circle cx="100" cy="100" r="60" fill="url(#hc-kar-gravy)" />
                {[[70, 70, 7], [128, 76, 6], [64, 118, 6], [132, 122, 7], [100, 58, 5], [98, 142, 6]].map(([x, y, r], k) => (
                    <ellipse key={k} cx={x} cy={y} rx={r * 1.5} ry={r * 0.8} fill="#F08A3C" opacity="0.35" />
                ))}
            </g>
        </Pop>
        {[[72, 86, 10], [100, 70, -15], [128, 88, 30], [76, 120, -25], [108, 124, 15], [132, 114, -10], [98, 98, 40]].map(([x, y, rot], k) => (
            <Pop key={k} i={k + 1}><Piece x={x} y={y} rot={rot} base="#B4521F" glaze="#E08A45" /></Pop>
        ))}
        <Pop i={8}>
            <g>
                {[[66, 98, 'M0 0 q10 -14 26 -10'], [112, 138, 'M0 0 q14 -6 24 -18'], [84, 62, 'M0 0 q12 4 24 -2']].map(([x, y, d], k) => (
                    <path key={k} d={d} transform={`translate(${x} ${y})`} fill="none" stroke="#3F9A32" strokeWidth="4.5" strokeLinecap="round" />
                ))}
            </g>
        </Pop>
        <Pop i={9}>
            <g>
                {[[94, 84], [122, 102], [86, 110]].map(([x, y], k) => (
                    <path key={k} d={`M${x} ${y} l7 -3 l-2 7 z`} fill="#E2402A" />
                ))}
                {Array.from({ length: 10 }, (_, k) => (
                    <line key={k} x1={70 + k * 6} y1={92 + ((k * 7) % 22)} x2={74 + k * 6} y2={95 + ((k * 7) % 22)} stroke="#F5D98A" strokeWidth="1.4" strokeLinecap="round" />
                ))}
            </g>
        </Pop>
        <Pop i={10}>
            <g>
                {[[86, 80], [120, 104], [92, 128], [60, 100]].map(([x, y], k) => (
                    <g key={k}><circle cx={x} cy={y} r="3.4" fill="#52A73F" /><circle cx={x + 4} cy={y + 2} r="3" fill="#3F9A32" /><circle cx={x - 3} cy={y + 3} r="2.8" fill="#6DBB55" /></g>
                ))}
            </g>
        </Pop>
    </>
)

const riceMound = scatter(70, 11, 30, 72, 116)
const daalBits = scatter(18, 5, 36, 126, 90)

const DaalChawalArt = () => (
    <>
        <defs>
            <radialGradient id="hc-daal" cx="0.5" cy="0.45" r="0.6">
                <stop offset="0" stopColor="#F6C84E" />
                <stop offset="1" stopColor="#DB9B1D" />
            </radialGradient>
            <radialGradient id="hc-rice" cx="0.45" cy="0.4" r="0.65">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.75" stopColor="#F1EAD7" />
                <stop offset="1" stopColor="#CFC4A8" />
            </radialGradient>
        </defs>
        <Pop i={0}>
            <g>
                <circle cx="124" cy="92" r="45" fill="url(#hc-daal)" stroke="#B87A12" strokeWidth="1" />
                <path d="M98 86 q16 -18 38 -4 q18 12 4 28" fill="none" stroke="#F9DF8B" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
            </g>
        </Pop>
        <Pop i={1}>
            <g>
                {daalBits.map((b, k) => {
                    if (b.pick < 0.25) return <circle key={k} cx={b.x} cy={b.y} r="3.4" fill="none" stroke="#C62A1B" strokeWidth="1.7" />
                    if (b.pick < 0.5) return <ellipse key={k} cx={b.x} cy={b.y} rx="3" ry="1.7" fill="#F8EBC0" transform={`rotate(${b.rot} ${b.x} ${b.y})`} />
                    if (b.pick < 0.75) return <circle key={k} cx={b.x} cy={b.y} r="1.4" fill="#5A3A1A" />
                    return <ellipse key={k} cx={b.x} cy={b.y} rx="3" ry="2" fill="#47A03A" transform={`rotate(${b.rot} ${b.x} ${b.y})`} />
                })}
            </g>
        </Pop>
        <Pop i={2}>
            <g>
                <circle cx="72" cy="116" r="35" fill="url(#hc-rice)" stroke="#BFB295" strokeWidth="1.2" />
                {riceMound.map((g, k) => (
                    <ellipse key={k} cx={g.x} cy={g.y} rx="4.4" ry="1.5" fill="#FFFFFF" stroke="#D9D0BA" strokeWidth="0.4" transform={`rotate(${g.rot} ${g.x} ${g.y})`} />
                ))}
            </g>
        </Pop>
        <Pop i={3}><Lemon cx={58} cy={64} r={13} rot={-10} /></Pop>
        <Pop i={4}><g><Leaf cx={140} cy={138} rot={20} size={0.9} /><Leaf cx={128} cy={146} rot={-20} size={0.8} /></g></Pop>
    </>
)

const DISHES = [
    { name: 'Fresh fruit platter', Art: FruitArt, hot: false },
    { name: 'Chicken biryani', Art: BiryaniArt, hot: true },
    { name: 'Chicken karahi', Art: KarahiArt, hot: true },
    { name: 'Daal chawal', Art: DaalChawalArt, hot: true }
]

// A few wisps of steam above hot dishes
const Steam = () => (
    <svg viewBox="0 0 60 50" className="h-full w-full overflow-visible" aria-hidden="true">
        {[10, 30, 50].map((x, i) => (
            <motion.path
                key={x}
                d={`M${x} 46 q-6 -8 0 -16 t0 -16`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 0.7, 0], y: [6, -10, -22] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
        ))}
    </svg>
)

const HeroChef = () => {
    const [idx, setIdx] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const dish = DISHES[idx]
    const { Art } = dish

    // After 4 seconds the next dish appears; clicking a dot restarts the 4 seconds
    useEffect(() => {
        if (!loaded) return undefined
        const t = setTimeout(() => setIdx((i) => (i + 1) % DISHES.length), SWAP_MS)
        return () => clearTimeout(t)
    }, [idx, loaded])

    return (
        <figure className="overflow-hidden rounded-2xl bg-[#A9CD7F] shadow-lift ring-1 ring-white/15">
            <div className="relative">
                <img
                    src={CHEF_PHOTO}
                    alt="A smiling chef presenting a plate"
                    width={PHOTO_SIZE.width}
                    height={PHOTO_SIZE.height}
                    fetchPriority="high"
                    onLoad={() => setLoaded(true)}
                    className="block h-auto w-full"
                />

                {loaded && (
                    <>
                        {/* The dish, sitting on the plate and tilted with it */}
                        <div
                            className="pointer-events-none absolute"
                            style={{ left: `${PLATE.x}%`, top: `${PLATE.y}%`, width: `${PLATE.w}%`, aspectRatio: PLATE.ratio, transform: `translate(-50%, -50%) rotate(${PLATE.tilt}deg)` }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.svg
                                    key={dish.name}
                                    viewBox="0 0 200 200"
                                    preserveAspectRatio="none"
                                    className="h-full w-full overflow-visible"
                                    style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.28))', transformOrigin: '50% 50%' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.25 }}
                                    role="img"
                                    aria-label={dish.name}
                                >
                                    <Art />
                                </motion.svg>
                            </AnimatePresence>
                        </div>

                        {/* Steam rises straight up from the plate, so it is not tilted */}
                        <AnimatePresence>
                            {dish.hot && (
                                <motion.div
                                    key={`steam-${dish.name}`}
                                    className="pointer-events-none absolute"
                                    style={{ left: `${PLATE.x}%`, top: `${PLATE.y - 4}%`, width: '6%', transform: 'translate(-50%, -100%)' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Steam />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            <figcaption className="flex items-center justify-between gap-3 bg-[#16291F]/85 px-4 py-3 backdrop-blur-sm">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Fresh from a home kitchen</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={dish.name}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="truncate font-serif text-[18px] leading-snug text-white"
                        >
                            {dish.name}
                        </motion.p>
                    </AnimatePresence>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {DISHES.map((d, n) => (
                        <button
                            key={d.name}
                            type="button"
                            onClick={() => setIdx(n)}
                            aria-label={`Show ${d.name}`}
                            aria-current={n === idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${n === idx ? 'w-6 bg-[#E98A4B]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                        />
                    ))}
                </div>
            </figcaption>
        </figure>
    )
}

export { DISHES, PLATE }
export default HeroChef