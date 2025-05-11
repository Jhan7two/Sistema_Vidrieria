// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Crear la aplicación
const app = createApp(App)

// Usar Pinia para la gestión de estado
app.use(createPinia()) // Usar Pinia primero

// Importar el store de autenticación
const { useAuthStore } = await import('./store/auth');
const authStore = useAuthStore();

// Intentar cargar el usuario actual si existe un token
// Esto se hace de forma asíncrona antes de montar completamente el router y la app
(async () => {
  if (authStore.token) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      // El error ya se maneja dentro de fetchCurrentUser (ej. logout si el token es inválido)
      console.error("Error durante la verificación inicial de autenticación en main.js:", error);
    }
  }

  // Configurar router después de la posible carga del usuario
  app.use(router)

  // Montar la aplicación
  app.mount('#app')
})();
