<!-- frontend/src/views/auth/Login.vue -->
<template>
    <div>
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Acceso al Sistema</h1>
      
      <LoginForm />
      
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Sistema de Gestión para Vidriería
        </p>
      </div>
    </div>
  </template>
  
  <script setup>
  import LoginForm from '../../components/auth/LoginForm.vue'
  </script>