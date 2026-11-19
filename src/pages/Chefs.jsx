import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import api, { errorMessage } from '../lib/api'
import cities from '../constants/cities'
import cuisines from '../constants/cuisines'
import { useCity } from '../context/CityContext'
import Icon from '../components/Icon'
import SafeImage from '../components/SafeImage'
import Pagination from '../components/Pagination'
import { chefPhoto } from '../constants/images'

const PAGE_SIZE = 8
const ALL = 'all'

const readFilters = (params, fallbackCity) => ({
    search: params.get('search') || '',
    city: params.get('city') || fallbackCity,
    cuisine: params.get('cuisine') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || ''
})

// ---------------- Custom Chef Card (Built to match reference) ----------------
const CustomChefCard = ({ chef }) => {
    // Use chefPhoto helper, fallback to a standard image if needed
    const imgSrc = chef.photo || (chefPhoto ? chefPhoto(chef) : 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop')
    
    return (
        <article className="flex flex-col rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-sm transition hover:shadow-md">
            <div className="relative h-48 rounded-xl overflow-hidden bg-[#F5F0E4]">
                <SafeImage src={imgSrc} alt={chef.name} className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#17392C] backdrop-blur-sm">
                    ⭐ {chef.rating || '4.98'} <span className="text-[#8A9189] font-normal">({chef.reviews || 124} reviews)</span>
                </span>
            </div>
            
            <div className="flex flex-1 flex-col px-1 pt-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-[17px] text-[#17392C]">{chef.name}</h3>
                        <p className="text-[12px] text-[#8A9189] mt-0.5">{chef.city}, {chef.city === 'Lahore' ? 'Punjab' : 'Sindh'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#8A9189] uppercase tracking-wider">
                        <Icon name="shield" size={12} /> NADRA
                    </div>
                </div>

                <p className="mt-3 text-[12.5px] leading-relaxed text-[#5E6B63] line-clamp-2">
                    {chef.bio || "22+ years of culinary heart. Master of slow-simmered handi, melt-in-mouth kebabs, and thin hot tawa rotis."}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {(chef.cuisines || ['Desi Homestyle', 'Karahi']).slice(0, 2).map(c => (
                        <span key={c} className="rounded-md bg-[#F5F0E4] px-2 py-1 text-[11px] font-medium text-[#17392C]">{c}</span>
                    ))}
                    <span className="rounded-md bg-[#F5F0E4] px-2 py-1 text-[11px] font-medium text-[#17392C]">Tandoori</span>
                </div>

                <div className="mt-auto pt-4 flex items-end justify-between border-t border-[#EFE9DA]">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A9189]">Cooking Fee</p>
                        <p className="text-[15px] font-bold text-[#17392C]">Rs {chef.ratePerSlot?.toLocaleString() || '1,500'} <span className="text-[11px] font-medium text-[#8A9189]">/ 2-hr slot</span></p>
                    </div>
                    <Link to={`/chefs/${chef.id}`} className="flex items-center gap-1 text-[12.5px] font-semibold text-[#17392C] hover:text-[#5E8A2E]">
                        Book Chef <Icon name="arrowRight" size={14} />
                    </Link>
                </div>
            </div>
        </article>
    )
}

// ---------------- Main Page Component ----------------
const Chefs = () => {
    const [params, setParams] = useSearchParams()
    const { city: preferredCity, setCity } = useCity()
    const [showFilters, setShowFilters] = useState(false)
    const [activeCuisine, setActiveCuisine] = useState('All Cuisines')

    const filters = readFilters(params, preferredCity)
    const page = Math.max(1, Number(params.get('page')) || 1)
    const cityName = filters.city === ALL ? null : filters.city

    const query = {
        search: filters.search || undefined,
        city: cityName || undefined,
        cuisine: filters.cuisine || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        page,
        limit: PAGE_SIZE
    }

    const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
        queryKey: ['chefs', 'list', query],
        queryFn: async () => (await api.get('/chefs', { params: query })).data,
        placeholderData: keepPreviousData
    })

    const apply = (next, nextPage = 1) => {
        const p = new URLSearchParams()
        Object.entries(next).forEach(([k, v]) => { if (v) p.set(k, v) })
        if (nextPage > 1) p.set('page', nextPage)
        setParams(p)
        if (next.city && next.city !== ALL) setCity(next.city)
        setShowFilters(false)
    }

    const goToPage = (p) => {
        apply(filters, p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const clear = () => apply({ city: filters.city })

    const total = data?.pagination.total ?? 0
    const place = cityName || 'Pakistan'
    const activeCount = ['search', 'cuisine', 'minPrice', 'maxPrice'].filter((k) => filters[k]).length

    // Mock data for UI completeness if API is empty
    const mockChefs = [
        { id: '1', name: 'Shabana Aunty', city: 'Gulberg III', cuisines: ['Koyla Karahi', 'Daal Chawal', 'Dum Handi'], ratePerSlot: 1500 },
        { id: '2', name: 'Farzana Baji', city: 'DHA Phase 6', cuisines: ['Sindhi Biryani', 'Slow Haleem', 'Chapati Roti'], ratePerSlot: 1400 },
        { id: '3', name: 'Uncle Tariq', city: 'Model Town', cuisines: ['Slow Nihari', 'Tandoori Chapli', 'BBQ Platter'], ratePerSlot: 1800 },
        { id: '4', name: 'Amna Chachi', city: 'Johar Town', cuisines: ['Desi Homestyle', 'Daal Chawal', 'Zeera Kachori'], ratePerSlot: 1350 },
        { id: '5', name: 'Chef Rizwan', city: 'Cantt', cuisines: ['Mutton Karahi', 'Roghani Naan', 'Seekh Kebab'], ratePerSlot: 1750 },
        { id: '6', name: 'Baji Yasmin', city: 'DHA Phase 6', cuisines: ['Shahi Daal', 'Chicken Pulao', 'Matka Kheer'], ratePerSlot: 1450 },
    ]

    const displayChefs = data?.chefs?.length > 0 ? data.chefs : mockChefs

    return (
        <div className="min-h-screen bg-[#FAF6EE] pb-20 pt-8">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                
                {/* Top Header Area */}
                <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-8">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E9E3D3] px-3 py-1.5 text-[11px] font-semibold text-[#17392C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#7DBB3A]" /> Verified Neighborhood Chefs in {place} • Available Today
                        </span>
                        <h1 className="mt-4 text-[42px] font-bold leading-[1.1] tracking-tight text-[#17392C] sm:text-5xl">
                            Book verified home chefs in your kitchen, tasting like home.
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[#5E6B63] max-w-xl">
                            Neighborhood aunties and master home cooks arrive with fresh local groceries, cook authentic homestyle meals in your kitchen, and leave it 100% spotless.
                        </p>
                        
                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5 rounded-full bg-white border border-[#E9E3D3] px-3 py-1.5 text-[11.5px] font-medium text-[#17392C]"><Icon name="shield" size={13} className="text-[#5E8A2E]" /> NADRA Biometric & Health Screened</span>
                            <span className="flex items-center gap-1.5 rounded-full bg-white border border-[#E9E3D3] px-3 py-1.5 text-[11.5px] font-medium text-[#17392C]"><Icon name="basket" size={13} className="text-[#5E8A2E]" /> Arrives with Fresh Groceries</span>
                            <span className="flex items-center gap-1.5 rounded-full bg-white border border-[#E9E3D3] px-3 py-1.5 text-[11.5px] font-medium text-[#17392C]"><Icon name="check" size={13} className="text-[#5E8A2E]" /> 100% Kitchen Cleanup Guaranteed</span>
                        </div>
                    </div>

                    {/* Featured Top Chef Card */}
                    <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-[#E9E3D3] bg-white p-3 shadow-lg">
                        <div className="relative h-40 rounded-xl bg-gray-300 overflow-hidden flex items-center justify-center">
                            <span className="text-gray-500 font-bold">img</span>
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-[#C2E35A]">⚡ Top Cook: Shabana Aunty ★ 4.98</p>
                                    <p className="text-white font-bold text-[13px] mt-1">Fresh Chicken Karahi & Tawa Roti</p>
                                    <p className="text-white/80 text-[10px]">4–6 Persons • Pure Desi Ghee & Spices</p>
                                </div>
                                <span className="bg-[#C2E35A] text-[#17392C] text-[10px] font-bold px-2 py-1 rounded-md">Rs 1,500</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1">
                            <span className="text-[10px] font-medium text-[#5E6B63] flex items-center gap-1"><Icon name="clock" size={12} /> Arrives in 30 mins</span>
                            <span className="text-[10px] font-medium text-[#5E6B63] flex items-center gap-1">⚡ 2 slots left</span>
                        </div>
                    </div>
                </header>

                {/* Horizontal Search & Filter Bar */}
                <div className="bg-white rounded-[20px] p-3 shadow-sm border border-[#E9E3D3] mb-8">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                            <input 
                                type="text" 
                                placeholder="Search by chef name, Karahi, Biryani, Nihari..." 
                                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#FAF6EE] text-[13px] text-[#17392C] outline-none placeholder:text-[#8A9189] border border-transparent focus:border-[#5E8A2E]"
                                value={filters.search}
                                onChange={(e) => apply({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="w-full md:w-[200px] relative">
                            <Icon name="pin" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                            <select 
                                className="w-full h-12 pl-10 pr-8 rounded-xl bg-[#FAF6EE] text-[13px] text-[#17392C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#5E8A2E]"
                                value={filters.city}
                                onChange={(e) => apply({ ...filters, city: e.target.value })}
                            >
                                <option value={ALL}>All Cities</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <Icon name="chevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189] pointer-events-none" />
                        </div>
                        <div className="w-full md:w-[220px] relative">
                            <Icon name="clock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9189]" />
                            <select className="w-full h-12 pl-10 pr-8 rounded-xl bg-[#FAF6EE] text-[13px] text-[#17392C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#5E8A2E]">
                                <option>Dinner (6:30 PM – 9:00 PM)</option>
                                <option>Lunch (12:00 PM – 3:00 PM)</option>
                            </select>
                            <Icon name="chevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9189] pointer-events-none" />
                        </div>
                        <button className="h-12 px-6 rounded-xl bg-[#17392C] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-[#0F2A20] transition shrink-0">
                            Find Chefs <Icon name="arrowRight" size={16} />
                        </button>
                    </div>

                    {/* Cuisine Pills */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F5F0E4] overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9189] mr-2 shrink-0">Cuisines:</span>
                        {['All Cuisines', 'Desi Homestyle', 'Koyla Karahi & Handi', 'Sindhi Dum Biryani', 'BBQ & Seekh Platter', 'Dietary & Low-Oil', 'Sweet & Halwa Puri'].map(c => (
                            <button 
                                key={c}
                                onClick={() => { setActiveCuisine(c); apply({ ...filters, cuisine: c === 'All Cuisines' ? '' : c }) }}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-[11.5px] font-semibold transition ${activeCuisine === c ? 'bg-[#17392C] text-white' : 'bg-[#F5F0E4] text-[#17392C] hover:bg-[#E9E3D3]'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
                    
                    {/* Left Sidebar Filters */}
                    <aside className="bg-white rounded-2xl border border-[#E9E3D3] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-[14px] text-[#17392C] flex items-center gap-2"><Icon name="filter" size={16} /> Refine Search</h3>
                            <button onClick={clear} className="text-[11px] font-semibold text-[#8A9189] hover:text-red-500">Reset All</button>
                        </div>

                        {/* Neighborhood */}
                        <div className="mb-6 border-b border-[#F5F0E4] pb-5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A9189] mb-3">Lahore Neighborhoods</p>
                            <div className="space-y-2.5">
                                {['Gulberg III & Main Blvd', 'DHA (Phases 1–6)', 'Model Town', 'Johar Town & PIA Road', 'Cantt & Cavalry Ground'].map((loc, i) => (
                                    <label key={loc} className="flex items-center gap-2 cursor-pointer text-[12.5px] text-[#17392C] hover:text-[#5E8A2E]">
                                        <input type="checkbox" defaultChecked={i === 0} className="rounded text-[#17392C] focus:ring-[#17392C]" />
                                        <span className="flex-1">{loc}</span>
                                        <span className="text-[11px] text-[#8A9189]">{8 - i} chefs</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-6 border-b border-[#F5F0E4] pb-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A9189]">Price Per 2-Hr Slot</p>
                                <span className="text-[10px] font-bold text-white bg-[#17392C] px-1.5 py-0.5 rounded">Rs 1,000 – Rs 2,500</span>
                            </div>
                            <input type="range" min="1000" max="3500" className="w-full accent-[#17392C]" />
                            <div className="flex justify-between text-[11px] font-bold text-[#17392C] mt-2">
                                <span>Rs 1,000</span>
                                <span>Rs 3,500</span>
                            </div>
                        </div>

                        {/* Dietary */}
                        <div className="mb-6">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A9189] mb-3">Kitchen & Dietary Standards</p>
                            <div className="space-y-2.5">
                                {['Pure Desi Ghee', 'Zero Artificial Dyes', 'Halal Meat Certified', 'Diabetic / Low Sodium'].map((diet) => (
                                    <label key={diet} className="flex items-center gap-2 cursor-pointer text-[12.5px] text-[#17392C] hover:text-[#5E8A2E]">
                                        <input type="checkbox" className="rounded text-[#17392C] focus:ring-[#17392C]" />
                                        <span>{diet}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button className="w-full py-2.5 rounded-lg border border-[#E9E3D3] text-[12px] font-bold text-[#17392C] hover:bg-[#F5F0E4] transition">
                            Apply Filters
                        </button>

                        {/* Guarantee Card */}
                        <div className="mt-6 bg-[#D3F0DE] rounded-xl p-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#17392C] mb-3"><Icon name="shield" size={16} /></span>
                            <h4 className="font-bold text-[13px] text-[#17392C]">Chef Haazir Guarantee</h4>
                            <p className="text-[11px] text-[#4E5F55] mt-1 leading-relaxed">Every home cook undergoes in-person kitchen sanitation inspection, medical screening, and 100% NADRA biometric identity validation.</p>
                            <ul className="mt-3 space-y-2 text-[11px] font-medium text-[#17392C]">
                                <li className="flex gap-1.5 items-start"><Icon name="check" size={12} className="mt-0.5 text-[#5E8A2E] shrink-0" /> Kitchen counter wiped & dishes clean</li>
                                <li className="flex gap-1.5 items-start"><Icon name="check" size={12} className="mt-0.5 text-[#5E8A2E] shrink-0" /> Food safety & sealed grocery options</li>
                                <li className="flex gap-1.5 items-start"><Icon name="check" size={12} className="mt-0.5 text-[#5E8A2E] shrink-0" /> On-time arrival guarantee or full refund</li>
                            </ul>
                        </div>

                        {/* WhatsApp Concierge */}
                        <div className="mt-6 flex items-center gap-3 border border-[#E9E3D3] rounded-xl p-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17392C] text-white"><Icon name="user" size={14} /></span>
                            <div>
                                <p className="text-[11.5px] font-bold text-[#17392C]">Need chef guidance?</p>
                                <p className="text-[10px] text-[#8A9189]">Talk to Lahore concierge</p>
                            </div>
                            <button className="ml-auto text-[10px] font-bold text-[#5E8A2E]">WhatsApp</button>
                        </div>
                    </aside>

                    {/* Right Results Area */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-[16px] font-bold text-[#17392C]">Showing 24 verified chefs in {place}</h2>
                                <p className="text-[12px] text-[#8A9189]">Available for same-day booking & weekend feasts</p>
                            </div>
                            <div className="flex items-center gap-2 text-[12px]">
                                <span className="text-[#8A9189]">Sort by:</span>
                                <select className="font-bold text-[#17392C] bg-transparent outline-none cursor-pointer">
                                    <option>Highest Rated (4.9+)</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {isError ? (
                            <div className="rounded-xl border border-[#E9E3D3] bg-white p-10 text-center">
                                <p className="font-bold text-xl text-[#17392C]">Couldn’t load chefs</p>
                                <p className="mt-2 text-sm text-[#8A9189]">{errorMessage(error)}</p>
                                <button onClick={() => refetch()} className="mt-5 rounded-lg bg-[#17392C] px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
                            </div>
                        ) : (
                            <>
                                <div className={`grid gap-5 sm:grid-cols-2 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
                                    {isLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="animate-pulse rounded-2xl border border-[#E9E3D3] bg-white p-3 h-[380px]">
                                                <div className="bg-[#F5F0E4] h-48 rounded-xl w-full mb-4"></div>
                                                <div className="h-4 bg-[#F5F0E4] w-1/2 mb-2"></div>
                                                <div className="h-3 bg-[#F5F0E4] w-3/4 mb-4"></div>
                                                <div className="h-10 bg-[#F5F0E4] w-full mt-auto"></div>
                                            </div>
                                        ))
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            {displayChefs.map((chef, i) => (
                                                <motion.div key={chef.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}>
                                                    <CustomChefCard chef={chef} />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                                
                                {displayChefs.length === 0 && !isLoading && (
                                    <div className="mt-5 rounded-xl border border-dashed border-[#E9E3D3] bg-white px-6 py-14 text-center">
                                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E4] text-[#17392C]"><Icon name="pot" size={28} /></span>
                                        <p className="mt-5 text-2xl font-bold text-[#17392C]">No chefs match these filters</p>
                                        <p className="mx-auto mt-2 max-w-sm text-sm text-[#8A9189]">Try another cuisine, a wider budget or a different name.</p>
                                        <button onClick={clear} className="mt-6 rounded-lg bg-[#17392C] px-6 py-2.5 text-sm font-semibold text-white">Clear filters</button>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-center">
                                    <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 3} onPage={goToPage} />
                                </div>
                            </>
                        )}
                    </section>
                </div>

                {/* Bottom Concierge Banner */}
                <div className="mt-16 bg-[#E9E3D3]/50 border border-[#E9E3D3] rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-[20px] font-bold text-[#17392C] flex items-center gap-2"><Icon name="sparkle" size={20} className="text-[#5E8A2E]" /> Personalized Family Dawat Service</h3>
                        <p className="text-[13.5px] text-[#5E6B63] mt-1 max-w-lg">Can't find the right chef? Let our concierge curate the perfect menu and chef for your family gathering.</p>
                    </div>
                    <button className="bg-white border border-[#E9E3D3] px-6 py-3 rounded-full text-[13px] font-bold text-[#17392C] flex items-center gap-2 hover:bg-[#FAF6EE] shadow-sm">
                        <Icon name="user" size={16} /> WhatsApp Concierge
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Chefs