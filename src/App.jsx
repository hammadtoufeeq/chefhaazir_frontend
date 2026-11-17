import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import Chefs from './pages/Chefs'
import ChefProfile from './pages/ChefProfile'
import About from './pages/About'
import Contact from './pages/Contact'
import Grocery from './pages/Grocery'
import GroceryStore from './pages/GroceryStore'
import Signup from './pages/Signup'
import Login from './pages/Login'
import MyBookings from './pages/MyBookings'
import BookingDetailsPage from './pages/BookingDetailsPage'
import BookingRequest from './pages/BookingRequest'
import ChefDashboard from './pages/ChefDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'

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

    if (location.pathname === '/chef' || location.pathname.startsWith('/chef/')) return <ChefDashboard />
    if (location.pathname === '/admin') return <AdminDashboard />

    // Sign-up and login have their own quiet layout, without the main navbar and footer
    if (location.pathname === '/signup') return <div className="overflow-x-clip"><Signup /></div>
    if (location.pathname === '/login') return <div className="overflow-x-clip"><Login /></div>

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip">
            <Navbar />
            <div className="flex-1">
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
            </div>
            <Footer />
        </div>
    )
}

export default App
