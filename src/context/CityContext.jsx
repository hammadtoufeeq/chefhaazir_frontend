import { createContext, useContext, useEffect, useState } from 'react'
import cities from '../constants/cities'
import { useAuth } from './AuthContext'

const CityContext = createContext(null)
const KEY = 'ch_city'

const readSaved = () => {
    try {
        const saved = localStorage.getItem(KEY)
        return cities.includes(saved) ? saved : null
    } catch {
        return null
    }
}

// The city picked in the navbar. Only a browsing preference: remembered in this browser,
// and a logged-in customer's own city is used until they pick another.
export const CityProvider = ({ children }) => {
    const { user } = useAuth()
    const [city, setCityState] = useState(() => readSaved() || 'Lahore')

    useEffect(() => {
        if (user?.city && !readSaved()) setCityState(user.city)
    }, [user?.city])

    const setCity = (next) => {
        setCityState(next)
        try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
    }

    return <CityContext.Provider value={{ city, setCity }}>{children}</CityContext.Provider>
}

export const useCity = () => useContext(CityContext)
