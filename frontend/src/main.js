// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Crear la aplicación
const app = createApp(App)

// Usar Pinia para la gestión de estado
const pinia = createPinia()
app.use(pinia)

// Importar el store de autenticación
import { useAuthStore } from './store/auth'

// Inicializar la aplicación
const initApp = async () => {
  const authStore = useAuthStore()
  
  // Si hay un token almacenado, intentar obtener la información del usuario
  if (authStore.token) {
    try {
      console.log('Verificando sesión de usuario...')
      await authStore.fetchCurrentUser()
    } catch (error) {
      console.error('Error durante la verificación inicial de autenticación:', error)
    }
  } else {
    // Marcar la verificación como completada si no hay token
    authStore.sessionChecked = true
  }
  
  // Agregar guardia de navegación global
  router.beforeEach((to, from, next) => {
    // Asegurarse de que la sesión se ha verificado antes de continuar
    if (!authStore.sessionChecked) {
      console.log('Esperando verificación de sesión...')
      // Establecer un tiempo máximo de espera (5 segundos)
      const timeout = setTimeout(() => {
        console.log('Tiempo de espera agotado, continuando navegación')
        next()
      }, 5000)
      
      // Crear un watcher para detectar cuando se completa la verificación
      const unwatch = authStore.$subscribe(() => {
        if (authStore.sessionChecked) {
          clearTimeout(timeout)
          unwatch()
          next()
        }
      })
    } else {
      next()
    }
  })
  
  // Configurar router
  app.use(router)
  
  // Montar la aplicación
  app.mount('#app')
}

// Iniciar la aplicación
initApp()
