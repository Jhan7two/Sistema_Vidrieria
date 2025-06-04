<template>
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-gray-500 font-medium mb-2">{{ title }}</h3>
      <p
        class="text-3xl font-bold"
        :class="{
          'text-green-600': color === 'green',
          'text-red-600': color === 'red',
          'text-amber-500': color === 'amber',
          'text-gray-800': color === 'gray' // 'blue' no está manejado aquí
          // Podrías añadir: 'text-blue-600': color === 'blue',
        }"
      >
        {{ value }}
      </p>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'blue',
      validator: (value) => ['blue', 'green', 'red', 'amber', 'gray'].includes(value)
    }
  })
  </script>