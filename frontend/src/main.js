// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Crear la aplicación
const app = createApp(App)

// Usar Pinia para la gestión de estado
app.use(createPinia())

// Configurar router
app.use(router)

// Montar la aplicación
app.mount('#app')
