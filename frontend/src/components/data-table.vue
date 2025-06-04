<template>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th v-for="(header, index) in headers" :key="index" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in items" :key="item.id">
            <td v-for="(key, index) in keys" :key="index" class="px-2 py-2 whitespace-nowrap text-sm text-gray-700">
              <template v-if="key === 'amount'">
                {{ formatCurrency(item[key]) }}
              </template>
              <template v-else>
                {{ item[key] }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  defineProps({
    headers: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    keys: {
      type: Array,
      required: true
    }
  })
  
  // Format currency
  const formatCurrency = (value) => {
    // Si el valor ya es un string formateado con $ al inicio, devolverlo tal cual
    if (typeof value === 'string' && value.startsWith('$')) {
      return value;
    }
    
    // Check if value is a valid number or can be converted to one
    if (value === null || value === undefined) {
      return '$0.00';
    }
    
    // Intentar convertir a número
    let numValue;
    if (typeof value === 'string') {
      // Limpiar caracteres no numéricos excepto punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, '');
      numValue = Number(cleanValue);
    } else {
      numValue = Number(value);
    }
    
    // Si no es un número válido, devolver $0.00
    if (isNaN(numValue)) {
      return '$0.00';
    }
    
    // Formatear como moneda con formato boliviano
    return `$${numValue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  </script>