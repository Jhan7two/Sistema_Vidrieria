<!-- frontend/src/views/dashboard/Dashboard.vue -->
<template>
    <div>
      <!-- Barra de navegación superior -->
      <nav class="bg-gradient-to-r from-rose-600 to-rose-700 text-white py-2">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <span class="text-white text-lg font-bold">Vidriería Sistema</span>
              </div>
            </div>
            <div class="flex items-center">
              <div class="ml-3 relative">
                <div>
                  <button @click="profileMenuOpen = !profileMenuOpen" class="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" id="user-menu" aria-expanded="false">
                    <span class="sr-only">Abrir menú de usuario</span>
                    <div class="h-8 w-8 rounded-full bg-zinc-700 text-white flex items-center justify-center">
                      {{ userInitials }}
                    </div>
                  </button>
                </div>
                
                <!-- Menú desplegable de perfil -->
                <div v-if="profileMenuOpen" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
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
      </nav>
  
      <!-- Contenido principal -->
      <div class="py-6">
        <header class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900">Panel de Control</h1>
        </header>
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Selector de módulos -->
          <div class="py-4" v-if="!activeModule">
            <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Bienvenido al Sistema de Gestión para Vidriería
                </h3>
                <div class="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Has iniciado sesión correctamente como {{ user?.rol }}.</p>
                </div>
                <div class="mt-5">
                  <p class="text-sm font-medium text-gray-700">¿Qué deseas hacer?</p>
                  <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <!-- Opciones del panel según el rol -->
                    <button class="bg-white border border-gray-300 rounded-md shadow-sm p-4 flex items-center space-x-3 hover:bg-gray-50">
                      <svg class="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span class="text-gray-900 font-medium">Gestionar ventas y gastos</span>
                    </button>
                    
                    <button @click="setActiveModule('clientes')" class="bg-white border border-gray-300 rounded-md shadow-sm p-4 flex items-center space-x-3 hover:bg-gray-50">
                      <svg class="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span class="text-gray-900 font-medium">Clientes</span>
                    </button>
                    
                    <button v-if="isAdmin" @click="setActiveModule('usuarios')" class="bg-white border border-gray-300 rounded-md shadow-sm p-4 flex items-center space-x-3 hover:bg-gray-50">
                      <svg class="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span class="text-gray-900 font-medium">Usuarios</span>
                    </button>
                    
                    <button v-if="isAdmin" @click="setActiveModule('reportesCaja')" class="bg-white border border-gray-300 rounded-md shadow-sm p-4 flex items-center space-x-3 hover:bg-gray-50">
                      <svg class="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span class="text-gray-900 font-medium">Reportes de Caja</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Módulo activo -->
          <div v-if="activeModule" class="py-4">
            <!-- Botón para volver al panel principal -->
            <div class="mb-4">
              <button @click="closeActiveModule" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al panel
              </button>
            </div>
            
            <!-- Componentes de módulos -->
            <ReportesCaja v-if="activeModule === 'reportesCaja'" />
            <GestionUsuarios v-if="activeModule === 'usuarios'" />
            <GestionClientes v-if="activeModule === 'clientes'" />
          </div>
        </main>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '../../store/auth'
  import ReportesCaja from '../../components/ReportesCaja.vue'
  import GestionUsuarios from '../../components/GestionUsuarios.vue'
  import GestionClientes from '../../components/GestionClientes.vue'
  
  // Estado local
  const profileMenuOpen = ref(false)
  const activeModule = ref(null)
  
  // Auth store
  const authStore = useAuthStore()
  const user = computed(() => authStore.currentUser)
  const isAdmin = computed(() => authStore.isAdmin)
  
  // Iniciales del usuario (para avatar)
  const userInitials = computed(() => {
    if (!user.value?.nombre_completo) return '?'
    
    const names = user.value.nombre_completo.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  })

  // Función para cerrar sesión
  const logout = () => {
    authStore.logout()
  }

  // Funciones para gestionar módulos
  const setActiveModule = (moduleName) => {
    activeModule.value = moduleName
  }

  const closeActiveModule = () => {
    activeModule.value = null
  }
  </script>