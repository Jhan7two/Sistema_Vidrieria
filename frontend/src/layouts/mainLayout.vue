<template>
    <div class="min-h-screen bg-gray-100">
      <!-- Barra de navegación superior -->
      <header class="bg-primary-600 text-white shadow-md">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-white text-lg font-bold">Vidriería Montero</span>
            </div>
            
            <!-- Perfil de usuario -->
            <div class="flex items-center">
              <div class="ml-3 relative">
                <div>
                  <button @click="profileMenuOpen = !profileMenuOpen" class="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" id="user-menu" aria-expanded="false">
                    <span class="sr-only">Abrir menú de usuario</span>
                    <div class="h-8 w-8 rounded-full bg-white text-primary-600 flex items-center justify-center font-bold">
                      {{ userInitials }}
                    </div>
                  </button>
                </div>
                
                <!-- Menú desplegable de perfil -->
                <div v-if="profileMenuOpen" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                  <div class="py-1" role="none">
                    <div class="block px-4 py-2 text-sm text-gray-700">
                      <p class="font-medium">{{ user?.nombre_completo }}</p>
                      <p class="text-gray-500">{{ user?.nombre_usuario }}</p>
                      <p class="text-xs uppercase font-medium mt-1 text-primary-600">{{ user?.rol }}</p>
                    </div>
                    <hr>
                    <button @click="logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" role="menuitem">Cerrar sesión</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Navegación principal -->
      <nav class="bg-white shadow-sm">
        <div class="container mx-auto px-4">
          <div class="flex overflow-x-auto whitespace-nowrap">
            <router-link 
              v-for="(item, index) in navItems" 
              :key="index" 
              :to="item.path"
              class="py-4 px-5 border-b-2 hover:text-primary-600 transition-colors"
              :class="[$route.path === item.path ? 'border-primary-500 text-primary-500 font-medium' : 'border-transparent text-gray-600']"
            >
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </nav>
      
      <!-- Contenido principal -->
      <div class="py-6">
        <main class="container mx-auto px-4 sm:px-6 lg:px-8">
          <router-view />
        </main>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '../store/auth'
  
  // Estado local
  const profileMenuOpen = ref(false)
  const route = useRoute()
  const router = useRouter()
  
  // Auth store
  const authStore = useAuthStore()
  const user = computed(() => authStore.currentUser)
  const isAdmin = computed(() => authStore.isAdmin)
  const isOperario = computed(() => authStore.isOperario)
  
  // Iniciales del usuario (para avatar)
  const userInitials = computed(() => {
    if (!user.value?.nombre_completo) return 'U'
    
    const names = user.value.nombre_completo.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  })
  
  // Elementos de navegación para el usuario
  const navItems = computed(() => {
    // Elementos base que todos los usuarios pueden ver
    const baseItems = [
      { name: 'Caja Diaria', path: '/operador/caja-diaria' },
      { name: 'Trabajos', path: '/operador/trabajos' }
    ]
    
    // Si es operario, solo puede ver trabajos
    if (isOperario.value) {
      return [
        { name: 'Trabajos', path: '/operador/trabajos' }
      ]
    }
    
    // Si es vendedor, puede ver todo excepto dashboard
    if (!isAdmin.value && !isOperario.value) {
      return baseItems
    }
    
    // Si es admin, puede ver todo incluyendo dashboard
    if (isAdmin.value) {
      return [
        { name: 'Dashboard', path: '/dashboard' },
        ...baseItems
      ]
    }
    
    return []
  })
  
  // Función para cerrar sesión
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  </script>