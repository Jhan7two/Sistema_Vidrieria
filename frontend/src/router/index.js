// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Layouts
import AuthLayout from '../layouts/AuthLayout.vue'

// Vistas
import Login from '../views/auth/Login.vue'
import Home from '../views/Home.vue'
import ControlPanel from '../views/dashboard/ControlPanel.vue'
import NotFound from '../views/NotFound.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'
import cajaDiaria from '../views/operador/caja-diaria.vue'

// Rutas
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: Login,
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/controlPanel',
    name: 'controlPanel',
    component: ControlPanel,
    meta: { requiresAuth: true} // Añadido requiresAdmin
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true} // Añadido requiresAdmin
  },
  {
    path: '/cajaDiaria',
    name: 'cajaDiaria',
    component: cajaDiaria,
    meta: { requiresAuth: true} // Añadido requiresAdmin
    
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // Siempre ir al principio al cambiar de página
    return { top: 0 }
  }
})

// Protección de rutas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin // Obtener el estado de administrador

  // Rutas que requieren rol de admin
  if (to.meta.requiresAdmin) {
    if (!isLoggedIn) { // Primero, el usuario debe estar autenticado
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    if (!isAdmin) { // Si está autenticado pero no es admin
      next({ name: 'home' }) // Redirigir a la página de inicio
      return
    }
  }
  
  // Rutas que requieren autenticación (pero no necesariamente rol de admin)
  // Este bloque se ejecutará para rutas con `requiresAuth: true` y (`requiresAdmin: false` o `requiresAdmin` no definido)
  if (to.meta.requiresAuth && !to.meta.requiresAdmin && !isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Rutas que requieren NO estar autenticado (como login)
  if (to.meta.requiresGuest && isLoggedIn) {
    // Si el usuario está autenticado, redirigir desde páginas como login.
    // 'controlPanel' es un buen destino; si no es admin, será redirigido a 'home' por el guardia de 'requiresAdmin'.
    next({ name: 'controlPanel' }) 
    return
  }
  
  next()
})

export default router