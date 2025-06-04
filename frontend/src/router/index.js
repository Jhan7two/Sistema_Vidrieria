// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Layouts
import AuthLayout from '@/layouts/auth-layout.vue'
import MainLayout from '@/layouts/main-layout.vue'

// Vistas
import Login from '@/views/auth/login-user.vue'
import Home from '@/views/home.vue'
import NotFound from '@/views/not-found.vue'
import Dashboard from '@/views/dashboard/dashboard.vue'
import CajaDiaria from '@/views/operador/caja-diaria.vue'
import Trabajos from '@/views/operador/trabajos.vue'
import ControlPanel from '@/views/dashboard/control-panel.vue'
import Cotizaciones from '@/views/operador/cotizaciones.vue'
import Cotizacion from '@/views/operador/cotizacion.vue'
import ComprobanteView from '@/views/comprobante-view.vue'

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
        path: 'login-user',
        name: 'login',
        component: Login,
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/control-panel',
    name: 'control-panel',
    component: ControlPanel,
    meta: { requiresAuth: true, requiresAdmin: true }
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
        component: CajaDiaria,
        meta: { requiresAuth: true }
      },
      {
        path: 'operador/trabajos',
        name: 'trabajos',
        component: Trabajos,
        meta: { requiresAuth: true }
      },
      {
        path: 'operador/cotizaciones',
        name: 'cotizaciones',
        component: Cotizaciones,
        meta: { requiresAuth: true }
      },
      {
        path: 'operador/cotizacion',
        name: 'cotizacion',
        component: Cotizacion,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/comprobante',
    name: 'comprobante',
    component: ComprobanteView,
    meta: { requiresAuth: false }
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
      // Guardar la ruta actual para redirección después del login
      next({ 
        name: 'login', 
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Si requiere ser admin y el usuario no lo es
    if (to.meta.requiresAdmin && !isAdmin) {
      console.log('Acceso denegado: requiere privilegios de administrador')
      // Cerrar la sesión actual
      authStore.logout()
      // Redirigir al login con un mensaje
      next({ 
        name: 'login', 
        query: { 
          message: 'Se requiere una cuenta de administrador para acceder a esta sección'
        }
      })
      return
    }
  }
  
  // Rutas que requieren NO estar autenticado (como login)
  if (to.meta.requiresGuest && isLoggedIn) {
    console.log('Redireccionando: usuario ya autenticado')
    
    // Redirigir según el rol del usuario
    if (isAdmin) {
      next({ name: 'dashboard' })
    } else {
      // Si es vendedor u otro rol, redirigir a caja-diaria
      next({ name: 'cajaDiaria' })
    }
    return
  }
  
  // En cualquier otro caso, permitir la navegación
  next()
})

export default router