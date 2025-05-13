<template>
  <div class="trabajos-container p-6">
    <!-- Pestañas -->
    <div class="mb-4 flex gap-2">
      <button :class="vista === 'tabla' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-l" @click="vista = 'tabla'">Tabla</button>
      <button :class="vista === 'calendario' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-r" @click="vista = 'calendario'">Calendario</button>
    </div>
    <!-- Panel de filtros (visible solo en vista tabla) -->
    <div v-if="vista === 'tabla'" class="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium">Cliente</label>
        <input v-model="filtros.cliente" type="text" class="border rounded px-2 py-1 w-40" placeholder="Buscar cliente" />
      </div>
      <div>
        <label class="block text-sm font-medium">Tipo</label>
        <select v-model="filtros.tipo" class="border rounded px-2 py-1 w-32">
          <option value="">Todos</option>
          <option value="Instalación">Instalación</option>
          <option value="Corte">Corte</option>
          <option value="Pulido">Pulido</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium">Estado</label>
        <select v-model="filtros.estado" class="border rounded px-2 py-1 w-32">
          <option value="">Todos</option>
          <option value="inicio">Inicio</option>
          <option value="proceso">Proceso</option>
          <option value="terminado">Terminado</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium">Fecha</label>
        <input v-model="filtros.fecha" type="date" class="border rounded px-2 py-1 w-40" />
      </div>
      <button class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700" @click="aplicarFiltros">Buscar</button>
      <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" @click="limpiarFiltros">Limpiar</button>
    </div>
    <!-- Vista de tabla -->
    <div v-if="vista === 'tabla'">
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded shadow">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2">ID</th>
              <th class="px-4 py-2">Fecha Programada</th>
              <th class="px-4 py-2">Cliente</th>
              <th class="px-4 py-2">Tipo</th>
              <th class="px-4 py-2">Dirección</th>
              <th class="px-4 py-2">Estado</th>
              <th class="px-4 py-2">Fecha Finalización</th>
              <th class="px-4 py-2">Costo Total</th>
              <th class="px-4 py-2">Pagado</th>
              <th class="px-4 py-2">Saldo</th>
              <th class="px-4 py-2">Estado Pago</th>
              <th class="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trabajo in trabajosPaginados" :key="trabajo.id" class="border-b">
              <td class="px-4 py-2">{{ trabajo.id }}</td>
              <td class="px-4 py-2">{{ trabajo.fecha_programada }}</td>
              <td class="px-4 py-2">{{ trabajo.cliente }}</td>
              <td class="px-4 py-2">{{ trabajo.tipo }}</td>
              <td class="px-4 py-2">{{ trabajo.direccion_trabajo || trabajo.direccion }}</td>
              <td class="px-4 py-2">
                <span :class="estadoClase(trabajo.estado)">{{ trabajo.estado }}</span>
              </td>
              <td class="px-4 py-2">{{ trabajo.fecha_finalizacion || '-' }}</td>
              <td class="px-4 py-2">{{ formatCurrency(trabajo.costo_total) }}</td>
              <td class="px-4 py-2">{{ formatCurrency(trabajo.monto_pagado) }}</td>
              <td class="px-4 py-2">{{ formatCurrency(trabajo.saldo_pendiente) }}</td>
              <td class="px-4 py-2">
                <span :class="estadoPagoClase(trabajo.estado_pago)">{{ trabajo.estado_pago }}</span>
              </td>
              <td class="px-4 py-2 flex gap-2">
                <button class="text-blue-600 hover:underline" @click="verDetalles(trabajo)">Detalles</button>
                <button class="text-yellow-600 hover:underline" @click="editarTrabajo(trabajo)">Editar</button>
                <button class="text-green-600 hover:underline" @click="generarComprobante(trabajo)">Comprobante</button>
                <button class="text-purple-600 hover:underline" @click="abrirModalEstado(trabajo)">Cambiar Estado</button>
              </td>
            </tr>
            <tr v-if="trabajosPaginados.length === 0">
              <td colspan="12" class="text-center py-4 text-gray-500">No se encontraron trabajos.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginación -->
      <div class="flex justify-end mt-4 gap-2">
        <button :disabled="paginaActual === 1" @click="paginaActual--" class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" >Anterior</button>
        <span class="px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
        <button :disabled="paginaActual === totalPaginas" @click="paginaActual++" class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" >Siguiente</button>
      </div>
    </div>
    <!-- Vista de calendario mensual avanzada -->
    <div v-else>
      <CalendarioTrabajos
        :trabajos="trabajos"
        :mes="mes"
        :anio="anio"
        @update:mes="mes = $event"
        @update:anio="anio = $event"
      />
    </div>
    <!-- Modal para cambiar estado -->
    <div v-if="modalEstado.visible" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded shadow-lg p-6 w-96 relative">
        <h2 class="text-lg font-bold mb-4">Cambiar Estado del Trabajo</h2>
        <select v-model="modalEstado.nuevoEstado" class="border rounded px-2 py-1 w-full mb-4">
          <option value="inicio">Inicio</option>
          <option value="proceso">Proceso</option>
          <option value="terminado">Terminado</option>
        </select>
        <div class="flex justify-end gap-2">
          <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" @click="cerrarModalEstado">Cancelar</button>
          <button class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700" @click="confirmarCambioEstado">Guardar</button>
        </div>
      </div>
    </div>
    <!-- Modal para nuevo trabajo (placeholder) -->
    <div v-if="modalNuevoTrabajo" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded shadow-lg p-6 w-96 relative">
        <h2 class="text-lg font-bold mb-4">Nuevo Trabajo</h2>
        <div class="text-gray-500">Formulario para crear trabajo próximamente...</div>
        <div class="flex justify-end mt-4">
          <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" @click="cerrarModalNuevoTrabajo">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CalendarioTrabajos from '@/components/CalendarioTrabajos.vue'

const vista = ref('tabla')
const filtros = ref({ cliente: '', tipo: '', estado: '', fecha: '' })
const trabajos = ref([
  // Datos de ejemplo con información financiera actualizada según la nueva estructura
  { id: 1, fecha_programada: '2024-06-01', cliente: 'Vidrios S.A.', tipo: 'Instalación', direccion_trabajo: 'Calle 123', estado: 'inicio', fecha_finalizacion: null, costo_total: 1200, monto_pagado: 400, saldo_pendiente: 800, estado_pago: 'Parcial' },
  { id: 2, fecha_programada: '2024-06-03', cliente: 'Cristales SRL', tipo: 'Corte', direccion_trabajo: 'Av. Central 456', estado: 'proceso', fecha_finalizacion: null, costo_total: 900, monto_pagado: 300, saldo_pendiente: 600, estado_pago: 'Parcial' },
  { id: 3, fecha_programada: '2024-06-05', cliente: 'Pulidos y Más', tipo: 'Pulido', direccion_trabajo: 'Ruta 9 Km 10', estado: 'terminado', fecha_finalizacion: '2024-06-06', costo_total: 1500, monto_pagado: 1500, saldo_pendiente: 0, estado_pago: 'Pagado' },
  { id: 4, fecha_programada: '2024-06-05', cliente: 'Alfa Glass', tipo: 'Instalación', direccion_trabajo: 'Calle 456', estado: 'inicio', fecha_finalizacion: null, costo_total: 800, monto_pagado: 200, saldo_pendiente: 600, estado_pago: 'Parcial' },
  { id: 5, fecha_programada: '2024-06-05', cliente: 'Beta Vidrios', tipo: 'Corte', direccion_trabajo: 'Av. Sur 789', estado: 'terminado', fecha_finalizacion: '2024-06-07', costo_total: 700, monto_pagado: 700, saldo_pendiente: 0, estado_pago: 'Pagado' },
  { id: 6, fecha_programada: '2024-06-05', cliente: 'Gamma Glass', tipo: 'Pulido', direccion_trabajo: 'Ruta 10 Km 5', estado: 'inicio', fecha_finalizacion: null, costo_total: 1100, monto_pagado: 500, saldo_pendiente: 600, estado_pago: 'Parcial' }
])
const paginaActual = ref(1)
const trabajosPorPagina = 5
const modalEstado = ref({ visible: false, trabajo: null, nuevoEstado: '' })
const modalNuevoTrabajo = ref(false)
const mes = ref(new Date().getMonth())
const anio = ref(new Date().getFullYear())

const trabajosFiltrados = computed(() => {
  return trabajos.value.filter(t => {
    const coincideCliente = !filtros.value.cliente || t.cliente.toLowerCase().includes(filtros.value.cliente.toLowerCase())
    const coincideTipo = !filtros.value.tipo || t.tipo === filtros.value.tipo
    const coincideEstado = !filtros.value.estado || t.estado === filtros.value.estado
    const coincideFecha = !filtros.value.fecha || t.fecha_programada === filtros.value.fecha
    return coincideCliente && coincideTipo && coincideEstado && coincideFecha
  })
})
const totalPaginas = computed(() => Math.max(1, Math.ceil(trabajosFiltrados.value.length / trabajosPorPagina)))
const trabajosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * trabajosPorPagina
  return trabajosFiltrados.value.slice(inicio, inicio + trabajosPorPagina)
})

function aplicarFiltros() {
  paginaActual.value = 1
}
function limpiarFiltros() {
  filtros.value = { cliente: '', tipo: '', estado: '', fecha: '' }
  paginaActual.value = 1
}
function estadoClase(estado) {
  switch (estado) {
    case 'inicio': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded'
    case 'proceso': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded'
    case 'terminado': return 'bg-green-100 text-green-800 px-2 py-1 rounded'
    default: return ''
  }
}
function estadoPagoClase(estadoPago) {
  switch (estadoPago) {
    case 'Pendiente': return 'bg-red-100 text-red-800 px-2 py-1 rounded'
    case 'Parcial': return 'bg-orange-100 text-orange-800 px-2 py-1 rounded'
    case 'Pagado': return 'bg-green-100 text-green-800 px-2 py-1 rounded'
    default: return ''
  }
}
function formatCurrency(value) {
  if (typeof value !== 'number') return '-'
  return '$' + value.toFixed(2)
}
function abrirModalEstado(trabajo) {
  modalEstado.value = { visible: true, trabajo, nuevoEstado: trabajo.estado }
}
function cerrarModalEstado() {
  modalEstado.value.visible = false
}
function confirmarCambioEstado() {
  if (modalEstado.value.trabajo) {
    modalEstado.value.trabajo.estado = modalEstado.value.nuevoEstado
    cerrarModalEstado()
  }
}
function abrirModalNuevoTrabajo() {
  modalNuevoTrabajo.value = true
}
function cerrarModalNuevoTrabajo() {
  modalNuevoTrabajo.value = false
}
function verDetalles(trabajo) {
  // Lógica para ver detalles (próximamente)
}
function editarTrabajo(trabajo) {
  // Lógica para editar trabajo (próximamente)
}
function generarComprobante(trabajo) {
  // Lógica para generar comprobante (próximamente)
}
function registrarCobro(trabajo) {
  // Lógica para registrar cobro (próximamente)
  // Esta función redirigirá a la caja-diaria o abrirá un modal para registrar el cobro
}
</script>

<style scoped>
.trabajos-container { min-height: 80vh; }
</style>