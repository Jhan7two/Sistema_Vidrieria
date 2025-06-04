<!-- frontend/src/layouts/AuthLayout.vue -->
<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-8">
          <!-- Logo o título de la empresa -->
          <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900 mb-2">
              Vidriería Sistema
            </h2>
            <p class="text-sm text-gray-600">
              Sistema de gestión para su negocio
            </p>
          </div>
          
          <!-- Contenido dinámico (formularios de autenticación) -->
          <div class="mt-8">
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // No se requiere lógica adicional para el layout
  </script>