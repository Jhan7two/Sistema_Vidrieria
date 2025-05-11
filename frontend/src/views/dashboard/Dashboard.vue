<template>
  <div>
  <h2 class="text-2xl font-semibold text-gray-700 mb-6">Dashboard</h2>
  
  <!-- Mensaje de carga -->
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="text-lg text-gray-600">Cargando datos...</div>
  </div>
  
  <div v-else>
    <!-- Solo mostrar ventas del mes -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <IndividualCard
        title="Ventas (este mes)"
        :value="'$' + ventasStats.promedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
        color="green"
      />
    </div>
    <!-- Panel de estadísticas de ventas del mes -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
      <div class="bg-white rounded-lg shadow-sm p-5 col-span-1">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-md bg-green-100 text-green-600 flex items-center justify-center mr-3">
            <span class="text-lg font-bold">#</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-700">Estadísticas</h3>
        </div>
        
        <div v-if="ventasStats.totalVentas > 0" class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Total de ventas:</span>
            <span class="font-medium">{{ ventasStats.totalVentas }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Promedio:</span>
            <span class="font-medium text-blue-600">${{ ventasStats.promedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Venta mayor:</span>
            <span class="font-medium text-green-600">${{ ventasStats.mayor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Venta menor:</span>
            <span class="font-medium text-amber-600">${{ ventasStats.menor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
        </div>
        <div v-else class="text-center py-4">
          <p class="text-gray-500">No hay datos</p>
        </div>
      </div>
      
      <!--
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ...
        (Sección de ventas recientes y gastos recientes comentada para simplificar)
      </div>
      -->
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import IndividualCard from '../../components/IndividualCard.vue'
// import DataTable from '../../components/DataTable.vue'
import { getVentasDelMes } from "@/services/dashboardService"  // Solo importar lo necesario

const loading = ref(true)
const ventasMes = ref({ ventas: [], totalMes: 0 })

// Cargar ventas del mes
const loadVentasMes = async () => {
  try {
    loading.value = true
    const data = await getVentasDelMes()
    console.log('Respuesta recibida de getVentasDelMes:', data)
    // Validar estructura de la respuesta
    if (data && Array.isArray(data.ventas) && typeof data.totalMes === 'number') {
      ventasMes.value = data
    } else {
      ventasMes.value = { ventas: [], totalMes: 0 }
      console.error('La respuesta de ventas del mes no tiene la estructura esperada:', data)
    }
  } catch (error) {
    ventasMes.value = { ventas: [], totalMes: 0 }
    console.error('Error al cargar ventas del mes:', error)
  } finally {
    loading.value = false
  }
}

// Estadísticas de ventas
const ventasStats = computed(() => {
  if (!ventasMes.value.ventas || ventasMes.value.ventas.length === 0) {
    return {
      totalVentas: 0,
      promedio: 0,
      mayor: 0,
      menor: 0
    }
  }
  const montos = ventasMes.value.ventas.map(v => parseFloat(v.monto))
  return {
    totalVentas: ventasMes.value.ventas.length,
    promedio: montos.reduce((a, b) => a + b, 0) / montos.length,
    mayor: Math.max(...montos),
    menor: Math.min(...montos)
  }
})

onMounted(() => {
  loadVentasMes()
})

//
// --- Código comentado para futuras tareas ---
// const dashboardData = ref({ ... })
// const recentSales = ref([])
// const recentExpenses = ref([])
// const loadDashboardData = async () => { ... }
// const loadRecentSales = async () => { ... }
// const loadRecentExpenses = async () => { ... }
//
</script>