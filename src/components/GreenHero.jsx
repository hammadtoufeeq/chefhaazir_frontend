import { motion } from 'framer-motion'
import SafeImage from './SafeImage'
import Icon from './Icon'

// Deep-green page hero shared by Find Chefs, About, Contact and Grocery.
//   pill     -> small uppercase label above the headline
//   title    -> serif headline; wrap the accent words in <Accent> (italic peach, underlined)
//   text     -> one short paragraph
//   stats    -> [[value, label], ...] glassy number tiles (use real numbers only)
//   checks   -> [[icon, text], ...] small check items under the stats
//   photo    -> { src, alt, tag, badge: [icon, text], time, caption: [quote, place] }
//   card     -> optional white card overlapping the photo (also shown on phones)
//   children -> optional full-width block under the hero (e.g. a search bar)
export const heroHeading = { fontFamily: 'var(--font-serif)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.08 }

export const Accent = ({ children }) => (
    <span className="italic text-[#F2C08F] underline decoration-[#F2C08F]/45 decoration-2 underline-offset-[6px]">{children}</span>
)

const heroBackground = {
    backgroundColor: '#163A2B',
    backgroundImage: 'radial-gradient(ellipse at 12% 0%, rgba(58,110,82,0.55) 0%, transparent 55%), radial-gradient(circle at 88% 95%, rgba(196,142,62,0.20) 0%, transparent 42%), linear-gradient(160deg, #1B4634 0%, #133426 60%, #10291F 100%)'
}

const GreenHero = ({ pill, pulse = false, title, text, stats = [], checks = [], chips = [], photo, card, children }) => {
    const items = checks.length ? checks : chips
    return (
        <section className="relative overflow-hidden text-white" style={heroBackground}>
            <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-8 lg:pb-16 lg:pt-14">
                <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
                    <div>
                        {pill && (
                            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/85">
                                <span className="relative flex h-1.5 w-1.5">
                                    {pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C2E35A] opacity-70" />}
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C2E35A]" />
                                </span>
                                {pill}
                            </motion.span>
                        )}
                        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={heroHeading} className="mt-5 text-[38px] text-white sm:text-[48px] lg:text-[56px]">
                            {title}
                        </motion.h1>
                        {text && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">{text}</motion.p>}

                        {stats.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mt-7 grid max-w-xl grid-cols-3 gap-2.5">
                                {stats.map(([value, label]) => (
                                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 backdrop-blur-sm">
                                        <p style={heroHeading} className="text-[22px] text-[#F2C08F] sm:text-[26px]">{value ?? '–'}</p>
                                        <p className="mt-1 text-[9.5px] font-bold uppercase leading-tight tracking-[0.1em] text-white/55">{label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {items.length > 0 && (
                            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                                {items.map(([icon, label]) => (
                                    <li key={label} className="flex items-center gap-1.5 text-[12px] font-medium text-white/75"><Icon name={icon} size={14} className="text-[#C2E35A]" /> {label}</li>
                                ))}
                            </ul>
                        )}

                        {card && <div className="mt-6 max-w-sm rounded-2xl bg-white p-4 text-[#17392C] shadow-lift lg:hidden">{card}</div>}
                    </div>

                    {photo && (
                        <motion.figure initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className={`relative ${card ? 'hidden pb-6 lg:block' : ''}`}>
                            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
                                <div className="relative overflow-hidden rounded-[16px]">
                                    <SafeImage src={photo.src} alt={photo.alt} eager className="aspect-[4/3]" />
                                    {photo.tag && <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-[#10291F]/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#C2E35A]" />{photo.tag}</span>}
                                    {photo.badge && <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-[#10291F]/85 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm"><Icon name={photo.badge[0]} size={13} className="text-[#C2E35A]" />{photo.badge[1]}</span>}
                                    {photo.time && <span className="absolute bottom-3 right-3 rounded-md bg-[#F2C08F] px-2.5 py-1.5 text-[11px] font-bold text-[#17392C]">{photo.time}</span>}
                                </div>
                            </div>
                            {photo.caption && (
                                <figcaption className="mt-3 flex items-center justify-between gap-3 px-1 text-[11.5px] text-white/60">
                                    <span className="italic">“{photo.caption[0]}”</span>
                                    {photo.caption[1] && <span className="shrink-0 font-bold uppercase tracking-[0.1em] text-white/70">{photo.caption[1]}</span>}
                                </figcaption>
                            )}
                            {card && <div className="absolute -bottom-1 -left-6 max-w-[300px] rounded-2xl bg-white p-4 text-[#17392C] shadow-lift">{card}</div>}
                        </motion.figure>
                    )}
                </div>
                {children && <div className="mt-10 lg:mt-12">{children}</div>}
            </div>
        </section>
    )
}

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
