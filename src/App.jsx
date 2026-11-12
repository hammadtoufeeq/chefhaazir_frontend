import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'

// Each page fades and slides in when the route changes
const Page = ({ children }) => (
    <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
    >
        {children}
    </motion.main>
)

const App = () => {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip">
            <Navbar />
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Page><Home /></Page>} />
                        <Route path="/chefs" element={<Page><ComingSoon title="Find a chef" /></Page>} />
                        <Route path="/chefs/:id" element={<Page><ComingSoon title="Chef profile" /></Page>} />
                        <Route path="/grocery" element={<Page><ComingSoon title="Grocery store" /></Page>} />
                        <Route path="/about" element={<Page><ComingSoon title="About us" /></Page>} />
                        <Route path="/contact" element={<Page><ComingSoon title="Contact" /></Page>} />
                        <Route path="/login" element={<Page><ComingSoon title="Login" /></Page>} />
                        <Route path="/signup" element={<Page><ComingSoon title="Sign up" /></Page>} />
                        <Route path="*" element={<Page><ComingSoon title="Page not found" /></Page>} />
                    </Routes>
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    )
}

export default App
