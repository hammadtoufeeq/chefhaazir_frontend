import { Link } from 'react-router-dom'
import { Steam } from '../components/Doodles'

// Placeholder for pages that are not built yet
const ComingSoon = ({ title }) => (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
        <Steam className="h-12 w-20 text-haldi" />
        <h1 className="mt-4 font-serif text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted">This page is still cooking. Check back soon.</p>
        <Link to="/" className="mt-8 rounded-xl bg-dhania px-6 py-3 font-semibold text-cream transition hover:bg-dhania-dark">Back to home</Link>
    </section>
)

export default ComingSoon
