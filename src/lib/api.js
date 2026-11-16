import axios from 'axios'

// The backend sets httpOnly cookies, so every request must send them
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true
})

// The access cookie lasts 15 minutes. On a 401, get a new one with the refresh cookie and retry once.
let refreshing = null
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config
        const isAuthCall = ['/auth/refresh', '/auth/login', '/auth/logout'].some((path) => original?.url?.startsWith(path))
        if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
            original._retried = true
            try {
                refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null })
                await refreshing
                return api(original)
            } catch {
                // not logged in: fall through with the original 401
            }
        }
        return Promise.reject(error)
    }
)

// The message from the backend's { status, message } error body
export const errorMessage = (error) =>
    error?.response?.data?.message || 'Something went wrong. Please try again.'

export default api
