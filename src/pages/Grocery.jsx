import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import cities from '../constants/cities'
import { images } from '../constants/images'
import { FREE_DELIVERY_FROM } from '../constants/grocery'
import { useCity } from '../context/CityContext'
import SafeImage from '../components/SafeImage'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import GreenHero, { Accent } from '../components/GreenHero'

const storeLink = (city) => `/grocery/${encodeURIComponent(city)}`

// Big card for the store in the visitor's city (or the first store)
const FlagshipCard = ({ store, isHome }) => (
    <Link to={storeLink(store.city)} aria-label={`Shop ${store.city} grocery store`} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 lg:row-span-3">
        <div className="relative lg:min-h-72 lg:flex-1">
            <SafeImage src={images.spiceBowls} alt={`Spices and daals at ${store.name}`} className="h-64 sm:h-72 lg:absolute lg:inset-0 lg:h-full" imgClassName="transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded bg-rust px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{isHome ? 'Your city' : 'City store'}</span>
                <span className="rounded bg-white/90 px-2 py-1 text-[10px] font-bold text-ink">{store.city}</span>
            </div>
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-ink/75 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Icon name="clock" size={13} /> Packed once your booking is confirmed
            </span>
        </div>
        <div className="flex flex-col p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-[26px] leading-tight">{store.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sage">Free delivery over Rs {FREE_DELIVERY_FROM}</span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Atta, rice, meat, sabzi, masalas, dairy and ghee for chefs cooking anywhere in {store.city}. Groceries reach your chef’s home before the slot, and the chef brings them along.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <p className="flex gap-4 text-[12px] text-muted">
                    <span className="flex items-center gap-1.5"><Icon name="basket" size={14} className="text-rust" /> Daal, ghee, masala</span>
                    <span className="flex items-center gap-1.5"><Icon name="truck" size={14} className="text-rust" /> To your chef</span>
                </p>
                <span className="group/btn flex items-center gap-2 rounded-lg bg-sage px-5 py-3 text-[13px] font-bold text-white transition group-hover:bg-sage-dark">
                    Shop {store.city} store <Icon name="arrowRight" size={15} className="transition group-hover/btn:translate-x-1" />
                </span>
            </div>
        </div>
    </Link>
)

const StoreCard = ({ store }) => (
    <Link to={storeLink(store.city)} aria-label={`Shop ${store.city} grocery store`} className="group flex flex-col rounded-xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2">
        <span className="w-fit rounded bg-sage-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-dark">{store.city}</span>
        <h3 className="mt-3 font-serif text-[22px] leading-tight">{store.name}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">Fresh pantry staples for home chefs cooking in {store.city}.</p>
        <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted">Free delivery over Rs {FREE_DELIVERY_FROM}</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-sage px-4 py-2 text-[12px] font-bold text-white transition group-hover:bg-sage-dark">
                Shop now <Icon name="arrowRight" size={14} />
            </span>
        </div>
    </Link>
)

const ComingSoonCard = ({ cityList }) => (
    <article className="rounded-xl border border-dashed border-line bg-sand/60 p-6">
        <span className="rounded bg-line/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/70">Coming soon</span>
        <h3 className="mt-3 font-serif text-[22px] leading-tight text-ink/85">More city stores</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            No store yet in {cityList.join(', ')}. Chefs there cook with groceries you already have at home.
        </p>
        <Link to="/signup?role=grocery_owner" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-rust hover:underline">
            Grocery partner access <Icon name="arrowRight" size={13} />
        </Link>
    </article>
)

const reasons = [
    {
        icon: 'lock', tone: 'bg-rust-soft text-rust',
        title: 'Prices locked at booking',
        text: 'The price you see when you add an item is copied into your booking. A later price change never touches what you owe.',
        foot: 'No surprise bills'
    },
    {
        icon: 'truck', tone: 'bg-sage-soft text-sage-dark',
        title: 'Straight to your chef',
        text: 'Once your chef accepts, the store packs your order and delivers it to the chef’s home. The chef brings everything to your kitchen.',
        foot: 'Packed after confirmation'
    },
    {
        icon: 'undo', tone: 'bg-rust-soft text-rust',
        title: 'Fair if plans change',
        text: 'If a booking is cancelled after groceries reached the chef, they go back to the store and the return is verified. You only pay for what was cooked.',
        foot: 'Verified returns'
    }
]

const Grocery = () => {
    const { city } = useCity()
    const { data: stores = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['grocery', 'stores'],
        queryFn: async () => (await api.get('/grocery/stores')).data.stores
    })

    const home = stores.find((s) => s.city === city)
    const flagship = home || stores[0]
    const others = stores.filter((s) => s !== flagship)
    const missing = cities.filter((c) => !stores.some((s) => s.city === c))

    return (
        <>
            <GreenHero
                pill="Chef Haazir kiryana"
                title={<>Groceries that arrive <Accent>with your chef.</Accent></>}
                text="Our own store in your city packs your order once the chef accepts the booking, and delivers it to the chef’s home before your slot. The chef brings everything to your kitchen."
                stats={[[isLoading ? null : stores.length, 'City stores open'], [`Rs ${FREE_DELIVERY_FROM}`, 'Free delivery from'], ['1', 'Approved store per city']]}
                checks={[['lock', 'Prices locked at booking'], ['truck', 'Delivered before your slot'], ['wallet', 'Pay the chef in cash']]}
                photo={{ src: images.groceryShelves, alt: 'Shelves of fresh vegetables in a grocery store', tag: 'Fresh every morning', badge: ['truck', 'Packed once your chef accepts'], time: 'Before your slot', caption: ['Everything your chef needs, from chakki atta to desi ghee.', ''] }}
            >
                <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 text-[#17392C] shadow-lift sm:flex-row sm:items-center">
                    <p className="flex shrink-0 items-center gap-2 px-2 text-[13px] font-bold"><Icon name="pin" size={16} className="text-[#5E8A2E]" /> Open your city store</p>
                    <div className="flex flex-1 flex-wrap gap-2">
                        {isLoading && [0, 1, 2].map((i) => <span key={i} className="h-10 w-28 animate-pulse rounded-xl bg-[#F5F0E4]" />)}
                        {stores.map((s) => (
                            <Link key={s._id} to={storeLink(s.city)} className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${s.city === city ? 'bg-[#17392C] text-white' : 'bg-[#FAF6EE] hover:bg-[#F5F0E4]'}`}>
                                {s.city} <Icon name="arrowRight" size={14} className={`transition group-hover:translate-x-0.5 ${s.city === city ? 'text-[#C2E35A]' : 'text-[#8A9189]'}`} />
                            </Link>
                        ))}
                        {!isLoading && !stores.length && <span className="px-2 py-2.5 text-[12.5px] text-[#8A9189]">Our first city stores are opening soon.</span>}
                    </div>
                </div>
            </GreenHero>
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-8">
                {/* Stores */}
                <section className="mt-12">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="font-serif text-[32px] tracking-tight">Select your city store</h2>
                            <p className="mt-1 text-[14px] text-muted">Browse prices here, then add items on the booking form when you book a chef.</p>
                        </div>
                        {!isLoading && !isError && (
                            <p className="flex items-center gap-2 text-[12px] font-semibold text-sage-dark">
                                <span className="h-2 w-2 rounded-full bg-sage" /> {stores.length} city {stores.length === 1 ? 'store' : 'stores'} open
                            </p>
                        )}
                    </div>

                    {isLoading && (
                        <div className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
                            <div className="h-[520px] animate-pulse rounded-xl bg-sand" />
                            <div className="space-y-5">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-sand" />)}</div>
                        </div>
                    )}

                    {isError && (
                        <div className="mt-6 rounded-xl border border-line bg-white p-10 text-center shadow-card">
                            <p className="font-serif text-2xl">Couldn’t load the stores</p>
                            <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-dark">Try again</button>
                        </div>
                    )}

                    {!isLoading && !isError && stores.length === 0 && (
                        <div className="mt-6 rounded-xl border border-dashed border-line bg-white p-10 text-center">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rust-soft text-rust"><Icon name="store" size={24} /></span>
                            <p className="mt-4 font-serif text-2xl">Our first city stores are opening soon</p>
                            <p className="mt-2 text-sm text-muted">Until then, chefs cook with the groceries in your kitchen.</p>
                        </div>
                    )}

                    {flagship && (
                        <div className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
                            <FlagshipCard store={flagship} isHome={!!home} />
                            <div className="flex flex-col gap-5">
                                {!home && (
                                    <p className="rounded-xl border border-rust/20 bg-rust-soft/60 p-4 text-[13px] text-rust-dark">
                                        There is no store in <strong>{city}</strong> yet. Chefs in {city} cook with groceries you already have.
                                    </p>
                                )}
                                {others.map((s) => <StoreCard key={s._id} store={s} />)}
                                {missing.length > 0 && <ComingSoonCard cityList={missing.filter((c) => c !== city || home).slice(0, 6)} />}
                            </div>
                        </div>
                    )}
                </section>

                {/* Why */}
                <section className="mt-20">
                    <Reveal className="text-center">
                        <p className="eyebrow">The Chef Haazir standard</p>
                        <h2 className="mt-3 font-serif text-[34px] tracking-tight">Why order groceries with your chef</h2>
                    </Reveal>
                    <div className="mt-10 grid gap-5 md:grid-cols-3">
                        {reasons.map((r, i) => (
                            <Reveal key={r.title} delay={i * 0.08}>
                                <article className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-card">
                                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${r.tone}`}><Icon name={r.icon} size={19} /></span>
                                    <h3 className="mt-5 font-serif text-[21px] leading-tight">{r.title}</h3>
                                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{r.text}</p>
                                    <p className="mt-auto flex items-center gap-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-rust">{r.foot} <Icon name="check" size={13} strokeWidth={2.4} /></p>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <Reveal className="mt-14 flex flex-col gap-5 rounded-xl border border-line bg-sand/70 p-6 sm:flex-row sm:items-center sm:p-7">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-dark text-white"><Icon name="pot" size={22} /></span>
                    <div className="flex-1">
                        <p className="font-serif text-[20px]">Ready to cook something?</p>
                        <p className="mt-0.5 text-[13px] text-muted">Pick a chef, choose a slot, and add groceries from your city store on the same form.</p>
                    </div>
                    <Link to={`/chefs?city=${encodeURIComponent(city)}`} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-rust px-5 py-3 text-[13px] font-bold text-white transition hover:bg-rust-dark">
                        Find a chef in {city} <Icon name="arrowRight" size={15} />
                    </Link>
                </Reveal>
            </div>
        </>
    )
}

export default Grocery
