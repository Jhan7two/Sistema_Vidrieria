<template>
  <div>  
  <!-- Mensaje de carga -->
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="text-lg text-gray-600">Cargando datos...</div>
  </div>
  
  <div v-else>
    <!-- Indicadores clave del dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <IndividualCard
        title="Ventas (este mes)"
        :value="'$' + dashboardData.salesData.totalMonth.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
        color="green"
      />
      <IndividualCard
        title="Gastos (este mes)"
        :value="'$' + dashboardData.expensesData.totalMonth.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
        color="red"
      />
      <IndividualCard
        title="Trabajos pendientes"
        :value="String(trabajosStats.pendientes || 0)"
        color="amber"
      />
      <IndividualCard
        title="Trabajos en proceso"
        :value="String(trabajosStats.enProceso || 0)"
        color="blue"
      />
      <IndividualCard
        title="Trabajos terminados"
        :value="String(trabajosStats.terminados || 0)"
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
      <!--panel de estadisticas de gastos del mes-->
      <div class="bg-white rounded-lg shadow-sm p-5 col-span-1">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-md bg-red-100 text-red-600 flex items-center justify-center mr-3">
            <span class="text-lg font-bold">#</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-700">Estadísticas</h3>
        </div>
        
        <div v-if="gastosStats.totalGastos > 0" class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Total de gastos:</span>
            <span class="font-medium">{{ gastosStats.totalGastos }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Promedio:</span>
            <span class="font-medium text-blue-600">${{ gastosStats.promedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Gasto mayor:</span>
            <span class="font-medium text-green-600">${{ gastosStats.mayor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Gasto menor:</span>
            <span class="font-medium text-amber-600">${{ gastosStats.menor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
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
import IndividualCard from '../../components/individual-card.vue'
// import DataTable from '../../components/DataTable.vue'
import { getVentasDelMes, getGastosDelMes, getTrabajosPorEstado } from "@/services/dashboardService"  // Importar funciones

const loading = ref(true)
const ventasMes = ref({ ventas: [], totalMes: 0 })
const gastosMes = ref({ gastos: [], totalMes: 0 })
const trabajosEstado = ref({ pendientes: 0, enProceso: 0, terminados: 0, total: 0 })

// Cargar ventas del mes
const loadVentasMes = async () => {
  try {
    loading.value = true
    const response = await getVentasDelMes()
    console.log('Respuesta recibida de getVentasDelMes:', response)
    // Validar estructura de la respuesta
    const data = response.data || response
    if (data && Array.isArray(data.ventas) && typeof data.totalMes === 'number') {
      ventasMes.value = data
    } else {
      ventasMes.value = { ventas: [], totalMes: 0 }
      console.error('La respuesta de ventas del mes no tiene la estructura esperada:', response)
    }
  } catch (error) {
    ventasMes.value = { ventas: [], totalMes: 0 }
    console.error('Error al cargar ventas del mes:', error)
  } finally {
    loading.value = false
  }
}

// Cargar gastos del mes
const loadGastosMes = async () => {
  try {
    const response = await getGastosDelMes()
    console.log('Respuesta recibida de getGastosDelMes:', response)
    // Validar estructura de la respuesta
    const data = response.data || response
    if (data && Array.isArray(data.gastos) && typeof data.totalMes === 'number') {
      gastosMes.value = data
    } else {
      gastosMes.value = { gastos: [], totalMes: 0 }
      console.error('La respuesta de gastos del mes no tiene la estructura esperada:', response)
    }
  } catch (error) {
    gastosMes.value = { gastos: [], totalMes: 0 }
    console.error('Error al cargar gastos del mes:', error)
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

// Estadísticas de gastos
const gastosStats = computed(() => {
  if (!gastosMes.value.gastos || gastosMes.value.gastos.length === 0) {
    return {
      totalGastos: 0,
      promedio: 0,
      mayor: 0,
      menor: 0
    }
  }
  const montos = gastosMes.value.gastos.map(g => parseFloat(g.monto))
  return {
    totalGastos: gastosMes.value.gastos.length,
    promedio: montos.reduce((a, b) => a + b, 0) / montos.length,
    mayor: Math.max(...montos),
    menor: Math.min(...montos)
  }
})

// Datos para el dashboard
const dashboardData = computed(() => {
  return {
    salesData: {
      totalMonth: ventasMes.value.totalMes || 0
    },
    expensesData: {
      totalMonth: gastosMes.value.totalMes || 0
    }
  }
})

// Cargar trabajos por estado
const loadTrabajosEstado = async () => {
  try {
    const response = await getTrabajosPorEstado()
    console.log('Respuesta recibida de getTrabajosPorEstado:', response)
    // Validar estructura de la respuesta
    const data = response.data || response
    if (data && typeof data.pendientes === 'number') {
      trabajosEstado.value = data
    } else {
      trabajosEstado.value = { pendientes: 0, enProceso: 0, terminados: 0, total: 0 }
      console.error('La respuesta de trabajos por estado no tiene la estructura esperada:', response)
    }
  } catch (error) {
    trabajosEstado.value = { pendientes: 0, enProceso: 0, terminados: 0, total: 0 }
    console.error('Error al cargar trabajos por estado:', error)
  }
}

// Estadísticas de trabajos
const trabajosStats = computed(() => {
  return {
    pendientes: trabajosEstado.value.pendientes || 0,
    enProceso: trabajosEstado.value.enProceso || 0,
    terminados: trabajosEstado.value.terminados || 0,
    total: trabajosEstado.value.total || 0
  }
})

onMounted(() => {
  loadVentasMes()
  loadGastosMes()
  loadTrabajosEstado()
})
</script>