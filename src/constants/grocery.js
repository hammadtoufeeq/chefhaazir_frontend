// Same lists as the backend (constants/grocery.js)
export const groceryCategories = ['Atta & Rice', 'Meat & Chicken', 'Vegetables', 'Fruits', 'Spices & Masala', 'Dairy & Eggs', 'Oil & Ghee', 'Daal & Pulses', 'Other']

// Delivery rule from the backend settings: free at Rs 500 and above, otherwise Rs 150
export const FREE_DELIVERY_FROM = 500
export const DELIVERY_FEE = 150

// A small emoji and tint per category, used on item cards and filter chips
export const categoryStyle = {
    'Atta & Rice': { emoji: '🌾', tint: 'bg-[#F6EBD3]' },
    'Meat & Chicken': { emoji: '🍗', tint: 'bg-[#F7DED6]' },
    'Vegetables': { emoji: '🧅', tint: 'bg-[#E3EEDC]' },
    'Fruits': { emoji: '🍋', tint: 'bg-[#F7F0CF]' },
    'Spices & Masala': { emoji: '🌶️', tint: 'bg-[#F9E1D3]' },
    'Dairy & Eggs': { emoji: '🥚', tint: 'bg-[#EEF0EC]' },
    'Oil & Ghee': { emoji: '🫙', tint: 'bg-[#F5E9C8]' },
    'Daal & Pulses': { emoji: '🫘', tint: 'bg-[#F1E2D2]' },
    'Other': { emoji: '🧂', tint: 'bg-[#ECE7DF]' }
}
