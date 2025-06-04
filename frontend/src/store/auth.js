// frontend/src/store/auth.js
import { defineStore } from 'pinia'
import authService from '../services/auth.service'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    sessionChecked: false
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.rol === 'admin',
    isOperario: (state) => state.user?.rol === 'operario',
    currentUser: (state) => state.user
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.login(credentials)
        
        // Guardar datos de sesión en localStorage
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Actualizar estado
        this.token = response.token
        this.user = response.user
        this.sessionChecked = true
        
        // Retornar true para indicar login exitoso
        // La redirección se manejará en el componente
        return true
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
        localStorage.removeItem('user')
        this.token = null
        this.user = null
        this.loading = false
        this.sessionChecked = true
        
        // Redireccionar a home después del logout
        router.push({ name: 'home' })
      }
    },
    
    async fetchCurrentUser() {
      if (!this.token) {
        this.sessionChecked = true
        return null
      }
      
      this.loading = true
      
      try {
        const response = await authService.getCurrentUser()
        
        // Actualizar datos de usuario y guardar en localStorage
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        
        // Si el token fue renovado en el backend, actualizarlo también
        if (response.token) {
          this.token = response.token
          localStorage.setItem('token', response.token)
        }
        
        this.sessionChecked = true
        return response.data
      } catch (error) {
        console.error('Error al obtener usuario actual:', error)
        
        // Si hay error de autenticación, hacer logout
        if (error.response?.status === 401) {
          // Limpiar datos de sesión sin llamar a logout() para evitar otra petición
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          this.token = null
          this.user = null
          this.sessionChecked = true
          
          // Redirigir a home en caso de error de autenticación
          router.push({ name: 'home' })
        }
        
        this.error = 'Error al cargar información del usuario'
        this.sessionChecked = true
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