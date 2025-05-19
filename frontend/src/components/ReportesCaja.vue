<template>
  <div class="reportes-caja p-6">
    <h2 class="text-2xl font-bold mb-4">Historial de Cierres de Caja</h2>
    
    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="float-right font-bold">×</button>
    </div>
    
    <!-- Filtros -->
    <div class="bg-white p-4 rounded shadow mb-4">
      <h3 class="text-lg font-semibold mb-2">Filtros</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Desde</label>
          <input v-model="filtros.desde" type="date" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Hasta</label>
          <input v-model="filtros.hasta" type="date" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Registros por página</label>
          <select v-model="filtros.limit" class="border rounded px-3 py-2 w-full">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="cargarCierres" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 mr-2">Buscar</button>
          <button @click="limpiarFiltros" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Limpiar</button>
        </div>
      </div>
    </div>
    
    <!-- Resumen -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-green-50 p-4 rounded shadow">
        <h4 class="text-sm font-medium text-green-800">Total Entradas</h4>
        <p class="text-2xl font-bold text-green-700">{{ formatCurrency(meta.totalEntradas) }}</p>
      </div>
      <div class="bg-red-50 p-4 rounded shadow">
        <h4 class="text-sm font-medium text-red-800">Total Salidas</h4>
        <p class="text-2xl font-bold text-red-700">{{ formatCurrency(meta.totalSalidas) }}</p>
      </div>
      <div class="bg-blue-50 p-4 rounded shadow">
        <h4 class="text-sm font-medium text-blue-800">Saldo Total</h4>
        <p class="text-2xl font-bold text-blue-700">{{ formatCurrency(meta.totalSaldo) }}</p>
      </div>
    </div>
    
    <!-- Indicador de carga -->
    <div v-if="cargando" class="text-center py-3 mb-4">
      <span class="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded">
        Cargando datos...
      </span>
    </div>
    
    <!-- Tabla de cierres -->
    <div class="bg-white rounded shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Fecha</th>
              <th class="px-4 py-2 text-left">Entradas</th>
              <th class="px-4 py-2 text-left">Salidas</th>
              <th class="px-4 py-2 text-left">Saldo del Día</th>
              <th class="px-4 py-2 text-left">Saldo Acumulado</th>
              <th class="px-4 py-2 text-left">Usuario</th>
              <th class="px-4 py-2 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cierre in cierres" :key="cierre.id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-2">{{ formatFecha(cierre.fecha) }}</td>
              <td class="px-4 py-2 text-green-700">{{ formatCurrency(cierre.total_entradas || cierre.total_ventas) }}</td>
              <td class="px-4 py-2 text-red-700">{{ formatCurrency(cierre.total_salidas || cierre.total_gastos) }}</td>
              <td class="px-4 py-2 font-medium" :class="cierre.saldo_final >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatCurrency(cierre.saldo_final) }}
              </td>
              <td class="px-4 py-2 font-medium">{{ formatCurrency(cierre.saldo_acumulado || 0) }}</td>
              <td class="px-4 py-2">{{ getNombreUsuario(cierre.usuario) }}</td>
              <td class="px-4 py-2">{{ cierre.observaciones || '-' }}</td>
            </tr>
            <tr v-if="cierres.length === 0">
              <td colspan="7" class="text-center py-4 text-gray-500">No hay registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Paginación -->
      <div v-if="meta.pages > 1" class="px-4 py-3 border-t">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-sm text-gray-700">
              Mostrando {{ (meta.currentPage - 1) * filtros.limit + 1 }} a 
              {{ Math.min(meta.currentPage * filtros.limit, meta.total) }} 
              de {{ meta.total }} registros
            </span>
          </div>
          <div class="flex gap-2">
            <button 
              @click="cambiarPagina(meta.currentPage - 1)" 
              :disabled="meta.currentPage === 1"
              :class="meta.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''"
              class="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            >
              Anterior
            </button>
            <button 
              @click="cambiarPagina(meta.currentPage + 1)" 
              :disabled="meta.currentPage === meta.pages"
              :class="meta.currentPage === meta.pages ? 'opacity-50 cursor-not-allowed' : ''"
              class="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getHistorialCierres } from '../services/cajaService';

// Estado reactivo
const cierres = ref([]);
const meta = ref({
  total: 0,
  pages: 0,
  currentPage: 1,
  totalEntradas: 0,
  totalSalidas: 0,
  totalSaldo: 0
});
const filtros = ref({
  page: 1,
  limit: 10,
  desde: '',
  hasta: ''
});
const cargando = ref(false);
const error = ref(null);

// Métodos
const cargarCierres = async () => {
  try {
    cargando.value = true;
    error.value = null;
    
    const response = await getHistorialCierres(filtros.value);
    
    cierres.value = response.cierres || [];
    meta.value = response.meta || {
      total: 0,
      pages: 0,
      currentPage: 1,
      totalEntradas: 0,
      totalSalidas: 0,
      totalSaldo: 0
    };
    
  } catch (err) {
    console.error("Error al cargar cierres de caja:", err);
    error.value = "Error al cargar datos. Intente nuevamente.";
  } finally {
    cargando.value = false;
  }
};

const cambiarPagina = (pagina) => {
  if (pagina < 1 || pagina > meta.value.pages) return;
  
  filtros.value.page = pagina;
  cargarCierres();
};

const limpiarFiltros = () => {
  filtros.value = {
    page: 1,
    limit: 10,
    desde: '',
    hasta: ''
  };
  cargarCierres();
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return value || '-';
  }
  return '$' + value.toFixed(2);
};

const formatFecha = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString();
};

const getNombreUsuario = (usuario) => {
  if (!usuario) return '-';
  return usuario.nombre_completo || usuario.nombre_usuario || '-';
};

// Cargar datos al montar el componente
onMounted(() => {
  cargarCierres();
});
</script>

<style scoped>
.reportes-caja {
  max-width: 1200px;
  margin: 0 auto;
}
</style> 