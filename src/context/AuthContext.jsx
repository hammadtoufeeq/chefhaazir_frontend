import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from '../lib/toast'

const AuthContext = createContext(null)

// Where each role lands after login, and its main navbar link
export const homeFor = {
    user: { to: '/my-bookings', label: 'My Bookings' },
    chef: { to: '/chef', label: 'Dashboard' },
    grocery_owner: { to: '/store', label: 'Dashboard' },
    admin: { to: '/admin', label: 'Dashboard' }
}

// GET /auth/me tells us who is logged in. A 401 just means "guest".
export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient()

    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/auth/me')
                return data.user
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) return null
                throw error
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: false
    })

    const logout = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSettled: () => {
            queryClient.setQueryData(['me'], null)
            queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' && q.queryKey[0] !== 'chefs' })
        }
    })

    return (
        <AuthContext.Provider value={{ user: user ?? null, isLoading, logout: () => { toast.success('You have been logged out.', 'Logged out'); logout.mutate() } }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
