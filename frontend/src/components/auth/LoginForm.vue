<!-- frontend/src/components/auth/LoginForm.vue -->
<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Mensaje de error -->
      <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
  
      <!-- Campo de usuario -->
      <div>
        <label for="username" class="form-label">Nombre de usuario</label>
        <input id="username" type="text" v-model="form.username" required
          class="form-input" :class="{ 'border-red-500': v$.form.username.$error }">
        <div v-if="v$.form.username.$error" class="form-error">
          {{ v$.form.username.$errors[0].$message }}
        </div>
      </div>
  
      <!-- Campo de contraseña -->
      <div>
        <label for="password" class="form-label">Contraseña</label>
        <input id="password" type="password" v-model="form.password" required
          class="form-input" :class="{ 'border-red-500': v$.form.password.$error }">
        <div v-if="v$.form.password.$error" class="form-error">
          {{ v$.form.password.$errors[0].$message }}
        </div>
      </div>
  
      <!-- Botón de acceso -->
      <div>
        <button type="submit" class="btn-primary w-full flex justify-center items-center" :disabled="loading">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </div>
    </form>
  </template>
  
  <script setup>
  import { reactive, ref, computed } from 'vue'
  import { useVuelidate } from '@vuelidate/core'
  import { required, minLength } from '@vuelidate/validators'
  import { useAuthStore } from '../../store/auth'
  import { useRouter, useRoute } from 'vue-router'
  
  // Estado del formulario
  const form = reactive({
    username: '',
    password: ''
  })
  
  // Reglas de validación
  const rules = {
    form: {
      username: { required, minLength: minLength(3) },
      password: { required, minLength: minLength(4) }
    }
  }
  
  // Inicializar Vuelidate
  const v$ = useVuelidate(rules, { form })
  
  // Auth store
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  
  // Estado de la UI
  const loading = computed(() => authStore.loading)
  const errorMessage = computed(() => authStore.error)
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
    // Validar formulario
    const isFormValid = await v$.value.$validate()
    if (!isFormValid) return
  
    try {
      // Intentar login
      const success = await authStore.login({
        username: form.username,
        password: form.password
      })

      if (success) {
        // Si hay una ruta de redirección en la query, usarla
        if (route.query.redirect) {
          router.push(route.query.redirect)
        } else {
          // Si no hay ruta de redirección, redirigir según el rol
          if (authStore.isAdmin) {
            router.push({ name: 'dashboard' })
          } else if (authStore.isOperario) {
            router.push({ name: 'trabajos' })
          } else {
            router.push({ name: 'cajaDiaria' })
          }
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
    }
  }
  </script>