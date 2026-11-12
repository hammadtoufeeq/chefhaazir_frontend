import axios from 'axios'

// The backend sets httpOnly cookies, so every request must send them
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true
})

export default api
