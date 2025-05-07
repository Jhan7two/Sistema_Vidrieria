// frontend/src/store/auth.js
import { defineStore } from 'pinia'
import authService from '../services/auth.service'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.rol === 'admin',
    currentUser: (state) => state.user
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.login(credentials)
        
        // Guardar token en localStorage y state
        localStorage.setItem('token', response.token)
        this.token = response.token
        this.user = response.user
        
        // Redireccionar según el parámetro query o al dashboard por defecto
        const redirectPath = router.currentRoute.value.query.redirect || '/dashboard'
        router.push(redirectPath)
        
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al iniciar sesión'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      
      try {
        await authService.logout()
      } catch (error) {
        console.error('Error durante logout:', error)
      } finally {
        // Limpiar datos de sesión
        localStorage.removeItem('token')
        this.token = null
        this.user = null
        this.loading = false
        
        // Redireccionar al login
        router.push('/auth/login')
      }
    },
    
    async fetchCurrentUser() {
      if (!this.token) return null
      
      this.loading = true
      
      try {
        const userData = await authService.getCurrentUser()
        this.user = userData
        return userData
      } catch (error) {
        console.error('Error al obtener usuario actual:', error)
        // Si hay error de autenticación, hacer logout
        if (error.response?.status === 401) {
          this.logout()
        }
        this.error = 'Error al cargar información del usuario'
        return null
      } finally {
        this.loading = false
      }
    },
    
    clearError() {
      this.error = null
    }
  }
})

// Si necesitas un archivo index.js para exportar todos los stores,
// deberías crearlo como un archivo separado en la carpeta store