import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

// Quiet layout for login and sign-up: logo, a way back, and a one-line footer
const AuthShell = ({ children }) => (
    <div className="flex min-h-screen flex-col">
        <header className="border-b border-line/70 bg-cream/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
                <Logo />
                <Link to="/" className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/75 transition hover:text-rust">
                    <Icon name="arrowLeft" size={15} /> Back to home
                </Link>
            </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="py-8 text-center text-[11px] font-semibold tracking-wide text-muted">
            © {new Date().getFullYear()} Chef Haazir · Authentic ghar ka khana
        </footer>
    </div>
)

export default AuthShell
