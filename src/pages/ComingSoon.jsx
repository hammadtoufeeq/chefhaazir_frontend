import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

// Placeholder for pages that are not built yet
const ComingSoon = ({ title }) => (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft text-rust"><Icon name="pot" size={28} /></span>
        <h1 className="mt-5 font-serif text-4xl">{title}</h1>
        <p className="mt-3 text-muted">This page is still cooking. Check back soon.</p>
        <Link to="/" className="mt-8 rounded-lg bg-sage px-6 py-3 font-semibold text-white transition hover:bg-sage-dark">Back to home</Link>
    </section>
)

export default ComingSoon
