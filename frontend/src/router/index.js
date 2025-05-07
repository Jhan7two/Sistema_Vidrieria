// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Layouts
import AuthLayout from '../layouts/AuthLayout.vue'

// Vistas
import Login from '../views/auth/Login.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'
import Home from '../views/Home.vue'
import NotFound from '../views/NotFound.vue'

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
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
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
  
  // Rutas que requieren autenticación
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Rutas que requieren NO estar autenticado (como login)
  if (to.meta.requiresGuest && isLoggedIn) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router