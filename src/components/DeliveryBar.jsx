import Icon from './Icon'
import { FREE_DELIVERY_FROM, DELIVERY_FEE } from '../constants/grocery'

// Thin announcement strip under the navbar on grocery pages
const DeliveryBar = () => (
    <div className="border-b border-rust/10 bg-rust-soft/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[12px] font-semibold text-rust-dark md:px-8">
            <p className="flex items-center gap-2">
                <Icon name="truck" size={15} />
                Free delivery on grocery orders of Rs {FREE_DELIVERY_FROM} or more. Flat Rs {DELIVERY_FEE} below that.
            </p>
            <p className="hidden items-center gap-1.5 uppercase tracking-[0.12em] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-rust" /> Prices locked when you book
            </p>
        </div>
    </div>
)

export default DeliveryBar
