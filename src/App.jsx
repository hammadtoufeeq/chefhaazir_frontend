import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
// Pages load on demand, so the first visit downloads only what it shows
const Chefs = lazy(() => import('./pages/Chefs'))
const ChefProfile = lazy(() => import('./pages/ChefProfile'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Grocery = lazy(() => import('./pages/Grocery'))
const GroceryStore = lazy(() => import('./pages/GroceryStore'))
const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage'))
const BookingRequest = lazy(() => import('./pages/BookingRequest'))
const ChefDashboard = lazy(() => import('./pages/ChefDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
import { useAuth } from './context/AuthContext'

// Shown for the split second a page's code is loading
const PageLoading = () => (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-sage border-t-transparent" />
    </div>
)

// Each page fades in when the route changes
const Page = ({ children }) => (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {children}
    </motion.main>
)

const soon = [
    ['/store', 'Store dashboard'],
]

const App = () => {
    const location = useLocation()
    const { user, isLoading } = useAuth()

    // New page starts at the top; links like /#how-it-works scroll to that section
    useEffect(() => {
        if (location.hash) {
            const t = setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 350)
            return () => clearTimeout(t)
        }
        window.scrollTo(0, 0)
    }, [location.pathname, location.hash])

    if (!isLoading && user?.role === 'chef' && !location.pathname.startsWith('/chef')) return <Navigate to="/chef" replace />

    if (location.pathname === '/chef' || location.pathname.startsWith('/chef/')) return <Suspense fallback={<PageLoading />}><ChefDashboard /></Suspense>
    if (location.pathname === '/admin') return <Suspense fallback={<PageLoading />}><AdminDashboard /></Suspense>

    // Sign-up and login have their own quiet layout, without the main navbar and footer
    if (location.pathname === '/signup') return <div className="overflow-x-clip"><Suspense fallback={<PageLoading />}><Signup /></Suspense></div>
    if (location.pathname === '/login') return <div className="overflow-x-clip"><Suspense fallback={<PageLoading />}><Login /></Suspense></div>

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip">
            <Navbar />
            <div className="flex-1">
                <Suspense fallback={<PageLoading />}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Page><Home /></Page>} />
                        <Route path="/chefs" element={<Page><Chefs /></Page>} />
                        <Route path="/chefs/:id" element={<Page><ChefProfile /></Page>} />
                        <Route path="/my-bookings" element={<Page><MyBookings /></Page>} />
                        <Route path="/my-bookings/:bookingId" element={<Page><BookingDetailsPage /></Page>} />
                        <Route path="/book/:chefId" element={<Page><BookingRequest /></Page>} />
                        <Route path="/about" element={<Page><About /></Page>} />
                        <Route path="/contact" element={<Page><Contact /></Page>} />
                        <Route path="/grocery" element={<Page><Grocery /></Page>} />
                        <Route path="/grocery/:city" element={<Page><GroceryStore /></Page>} />
                        {soon.map(([path, title]) => (
                            <Route key={path} path={path} element={<Page><ComingSoon title={title} /></Page>} />
                        ))}
                        <Route path="*" element={<Page><ComingSoon title="Page not found" /></Page>} />
                    </Routes>
                </AnimatePresence>
                </Suspense>
            </div>
            <Footer />
        </div>
    )
}

export default App
