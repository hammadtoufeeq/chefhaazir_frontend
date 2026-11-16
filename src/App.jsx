import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'

// Each page fades in when the route changes
const Page = ({ children }) => (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {children}
    </motion.main>
)

const soon = [
    ['/chefs', 'Find chefs'],
    ['/chefs/:id', 'Chef profile'],
    ['/book/:chefId', 'Booking request'],
    ['/grocery', 'Grocery store'],
    ['/grocery/:city', 'Grocery store'],
    ['/about', 'About us'],
    ['/contact', 'Contact'],
    ['/login', 'Login'],
    ['/signup', 'Sign up'],
    ['/my-bookings', 'My bookings'],
    ['/chef', 'Chef dashboard'],
    ['/store', 'Store dashboard'],
    ['/admin', 'Admin dashboard']
]

const App = () => {
    const location = useLocation()

    // New page starts at the top; links like /#how-it-works scroll to that section
    useEffect(() => {
        if (location.hash) {
            const t = setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 350)
            return () => clearTimeout(t)
        }
        window.scrollTo(0, 0)
    }, [location.pathname, location.hash])

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip">
            <Navbar />
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Page><Home /></Page>} />
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
