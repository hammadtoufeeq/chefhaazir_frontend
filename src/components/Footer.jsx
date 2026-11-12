import { Link } from 'react-router-dom'
import Logo from './Logo'

const Footer = () => (
    <footer className="bg-dhania-dark text-cream">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
            <div className="md:col-span-2">
                <Logo light />
                <p className="mt-4 max-w-sm text-cream/75">
                    Verified home chefs who cook in your kitchen, with groceries from our own store in your city.
                </p>
                <p dir="rtl" lang="ur" className="mt-6 text-left font-urdu text-xl leading-loose text-haldi">گھر سے دور، گھر کا کھانا</p>
            </div>
            <div>
                <h3 className="font-serif text-lg">Explore</h3>
                <ul className="mt-4 space-y-2 text-cream/75">
                    <li><Link to="/chefs" className="transition hover:text-haldi">Find a chef</Link></li>
                    <li><Link to="/grocery" className="transition hover:text-haldi">Grocery store</Link></li>
                    <li><Link to="/about" className="transition hover:text-haldi">About us</Link></li>
                    <li><Link to="/contact" className="transition hover:text-haldi">Contact</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="font-serif text-lg">Join us</h3>
                <ul className="mt-4 space-y-2 text-cream/75">
                    <li><Link to="/signup?role=chef" className="transition hover:text-haldi">Cook with Chef Haazir</Link></li>
                    <li><Link to="/signup?role=grocery_owner" className="transition hover:text-haldi">Run a city store</Link></li>
                    <li><Link to="/signup" className="transition hover:text-haldi">Create an account</Link></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-cream/10">
            <p className="mx-auto max-w-7xl px-5 py-5 text-sm text-cream/60 md:px-8">© {new Date().getFullYear()} Chef Haazir. Made in Pakistan.</p>
        </div>
    </footer>
)

export default Footer
