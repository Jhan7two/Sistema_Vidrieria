// frontend/src/services/api.js
import axios from 'axios'

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Para que se envíen las cookies
})

// Interceptor para incluir el token JWT en las solicitudes
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || 'Error en la solicitud'
    
    // Si es error de autenticación (401), limpiar storage
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/auth/login') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient