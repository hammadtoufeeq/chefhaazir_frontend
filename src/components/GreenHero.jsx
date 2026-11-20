import { motion } from 'framer-motion'
import SafeImage from './SafeImage'
import Icon from './Icon'

// Forest-green page hero, shared by Find Chefs, About, Contact and Grocery.
//   pill     -> short status line (lime dot), e.g. a live count
//   title    -> headline; wrap the accent words in <Accent>
//   text     -> one or two sentences
//   chips    -> [[icon, text], ...] outlined trust pills
//   photo    -> { src, alt } framed photo on the right (desktop)
//   card     -> white card that overlaps the photo
//   children -> optional full-width block under the hero (e.g. a search bar)
export const heroHeading = { fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }

export const Accent = ({ children }) => <span className="text-[#C2E35A]">{children}</span>

const GreenHero = ({ pill, pulse = false, title, text, chips = [], photo, card, children }) => (
    <section className="relative overflow-hidden bg-[#17392C] text-white">
        <svg aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] text-white" viewBox="0 0 600 600" fill="none">
            {[110, 180, 250, 300].map((r) => <circle key={r} cx="300" cy="300" r={r} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1.5" />)}
        </svg>
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-8 lg:pb-16 lg:pt-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
                <div>
                    {pill && (
                        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                            <span className="relative flex h-1.5 w-1.5">
                                {pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C2E35A] opacity-70" />}
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C2E35A]" />
                            </span>
                            {pill}
                        </motion.span>
                    )}
                    <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={heroHeading} className="mt-4 text-[36px] text-white sm:text-[46px] lg:text-[52px]">
                        {title}
                    </motion.h1>
                    {text && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">{text}</motion.p>}
                    {chips.length > 0 && (
                        <ul className="mt-6 flex flex-wrap gap-2">
                            {chips.map(([icon, label]) => (
                                <li key={label} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] font-medium text-white/85"><Icon name={icon} size={13} className="text-[#C2E35A]" /> {label}</li>
                            ))}
                        </ul>
                    )}
                    {/* On phones the photo is hidden, so show the card under the text */}
                    {card && <div className="mt-6 max-w-sm rounded-2xl bg-white p-4 text-[#17392C] shadow-lift lg:hidden">{card}</div>}
                </div>
                {photo && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="relative hidden pb-6 lg:block">
                        <div className="overflow-hidden rounded-[24px] border-[6px] border-white/10">
                            <SafeImage src={photo.src} alt={photo.alt} eager className="h-72" />
                        </div>
                        {card && <div className="absolute -bottom-1 -left-6 max-w-[300px] rounded-2xl bg-white p-4 text-[#17392C] shadow-lift">{card}</div>}
                    </motion.div>
                )}
            </div>
            {children && <div className="mt-10 lg:mt-12">{children}</div>}
        </div>
    </section>
)

// Small numbered list used inside the white hero card
export const HeroSteps = ({ title, steps }) => (
    <>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9189]">{title}</p>
        <ol className="mt-2 space-y-1.5 text-[12px] font-semibold">
            {steps.map((t, i) => (
                <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C2E35A] text-[10px] font-bold">{i + 1}</span>{t}</li>
            ))}
        </ol>
    </>
)

export default GreenHero
