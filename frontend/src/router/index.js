// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Layouts
import AuthLayout from '../layouts/AuthLayout.vue'
import MainLayout from '../layouts/mainLayout.vue'

// Vistas
import Login from '../views/auth/Login.vue'
import Home from '../views/Home.vue'
import ControlPanel from '../views/dashboard/ControlPanel.vue'
import NotFound from '../views/NotFound.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'
import cajaDiaria from '../views/operador/caja-diaria.vue'
import Trabajos from '../views/operador/trabajos.vue'

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
    meta: { requiresAuth: true } // No requiere ser admin
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'operador/caja-diaria',
        name: 'cajaDiaria',
        component: cajaDiaria,
        meta: { requiresAuth: true }
      },
      {
        path: 'operador/trabajos',
        name: 'trabajos',
        component: Trabajos,
        meta: { requiresAuth: true }
      }
    ]
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
  
  // Obtener estado de autenticación
  const isLoggedIn = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin
  
  // Ruta de login
  const loginRoute = { name: 'login', query: to.path !== '/' ? { redirect: to.fullPath } : {} }
  
  // Rutas que requieren estar autenticado
  if (to.meta.requiresAuth) {
    // Si el usuario no está autenticado
    if (!isLoggedIn) {
      console.log('Acceso denegado: requiere autenticación')
      next(loginRoute)
      return
    }
    
    // Si además requiere ser admin
    if (to.meta.requiresAdmin && !isAdmin) {
      console.log('Acceso denegado: requiere privilegios de administrador')
      next({ name: 'controlPanel' })
      return
    }
  }
  
  // Rutas que requieren NO estar autenticado (como login)
  if (to.meta.requiresGuest && isLoggedIn) {
    console.log('Redireccionando: usuario ya autenticado')
    
    // Si el usuario está autenticado, redirigir según su rol
    if (isAdmin) {
      next({ name: 'dashboard' })
    } else {
      next({ name: 'controlPanel' })
    }
    return
  }
  
  // En cualquier otro caso, permitir la navegación
  next()
})

export default router