<template>
  <div class="trabajos-container p-6">
    <!-- Pestañas -->
    <div class="mb-4 flex gap-2">
      <button :class="vista === 'tabla' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-l" @click="vista = 'tabla'">Tabla</button>
      <button :class="vista === 'calendario' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-r" @click="vista = 'calendario'">Calendario</button>
    </div>
    
    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="float-right font-bold">×</button>
    </div>
    
    <!-- Indicador de carga -->
    <div v-if="cargando" class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">Cargando datos...</span>
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
              <td class="px-4 py-2">{{ trabajo.fecha_programada || '-' }}</td>
              <td class="px-4 py-2">{{ trabajo.cliente || (trabajo.cliente_id ? 'Cliente #' + trabajo.cliente_id : 'Sin cliente') }}</td>
              <td class="px-4 py-2">{{ trabajo.tipo || '-' }}</td>
              <td class="px-4 py-2">{{ trabajo.direccion_trabajo || trabajo.direccion || '-' }}</td>
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
    <!-- Modal para detalles del trabajo -->
    <DetallesTrabajo 
      v-if="modalDetalles.visible" 
      :trabajo="modalDetalles.trabajo" 
      @cerrar="cerrarModalDetalles"
      @editar="editarTrabajo"
      @generar-comprobante="generarComprobante"
    />
    <!-- Modal para editar trabajo -->
    <EditarTrabajo 
      v-if="modalEditar.visible" 
      :trabajo="modalEditar.trabajo" 
      @cerrar="cerrarModalEditar"
      @guardar="guardarTrabajo"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CalendarioTrabajos from '@/components/CalendarioTrabajos.vue'
import DetallesTrabajo from '@/components/DetallesTrabajo.vue'
import EditarTrabajo from '@/components/EditarTrabajo.vue'
import { getAllTrabajos, updateTrabajo } from '@/services/trabajoService'

const vista = ref('tabla')
const filtros = ref({ cliente: '', tipo: '', estado: '', fecha: '' })
const trabajos = ref([])
const paginaActual = ref(1)
const trabajosPorPagina = 5
const modalEstado = ref({ visible: false, trabajo: null, nuevoEstado: '' })
const modalNuevoTrabajo = ref(false)
const mes = ref(new Date().getMonth())
const anio = ref(new Date().getFullYear())
const cargando = ref(false)
const error = ref(null)
const modalDetalles = ref({ visible: false, trabajo: null })
const modalEditar = ref({ visible: false, trabajo: null })

// Cargar trabajos al iniciar el componente
onMounted(async () => {
  await cargarTrabajos()
})

// Función para cargar los trabajos desde la API
async function cargarTrabajos() {
  try {
    cargando.value = true
    error.value = null
    console.log('Iniciando carga de trabajos')
    
    const response = await getAllTrabajos()
    console.log('Respuesta completa:', response)
    
    if (response && Array.isArray(response)) {
      console.log(`Se recibieron ${response.length} trabajos del servidor`)
      trabajos.value = response
      
      if (response.length === 0) {
        console.log('No hay trabajos registrados en el sistema')
      }
    } else {
      console.error('Formato de respuesta inválido:', response)
      error.value = 'La respuesta del servidor no tiene el formato esperado'
    }
  } catch (err) {
    console.error('Error al cargar trabajos:', err)
    
    // Determinar el tipo de error para mostrar un mensaje más específico
    if (err.response) {
      // Error de respuesta del servidor
      const status = err.response.status
      const mensaje = err.response.data?.message || 'Error del servidor'
      
      if (status === 401 || status === 403) {
        error.value = 'No tiene permisos para acceder a esta información'
      } else {
        error.value = `Error (${status}): ${mensaje}`
      }
    } else if (err.request) {
      // Error de red - No se recibió respuesta
      error.value = 'No se pudo conectar con el servidor. Verifique su conexión.'
    } else {
      // Error de configuración de la solicitud
      error.value = `Error al preparar la solicitud: ${err.message}`
    }
  } finally {
    cargando.value = false
    console.log('Finalizada la carga de trabajos')
  }
}

const trabajosFiltrados = computed(() => {
  return trabajos.value.filter(t => {
    // Verificar que cliente existe y es string antes de usar toLowerCase
    const clienteNombre = t.cliente || '';
    const clienteMatch = !filtros.value.cliente || 
      (typeof clienteNombre === 'string' && clienteNombre.toLowerCase().includes(filtros.value.cliente.toLowerCase()));
    
    // Verificar otros campos
    const tipoMatch = !filtros.value.tipo || t.tipo === filtros.value.tipo;
    const estadoMatch = !filtros.value.estado || t.estado === filtros.value.estado;
    const fechaMatch = !filtros.value.fecha || t.fecha_programada === filtros.value.fecha;
    
    return clienteMatch && tipoMatch && estadoMatch && fechaMatch;
  });
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
  if (!estado) return '';
  switch (estado) {
    case 'inicio': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded'
    case 'proceso': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded'
    case 'terminado': return 'bg-green-100 text-green-800 px-2 py-1 rounded'
    default: return ''
  }
}
function estadoPagoClase(estadoPago) {
  if (!estadoPago) return '';
  switch (estadoPago) {
    case 'Pendiente': return 'bg-red-100 text-red-800 px-2 py-1 rounded'
    case 'Parcial': return 'bg-orange-100 text-orange-800 px-2 py-1 rounded'
    case 'Pagado': return 'bg-green-100 text-green-800 px-2 py-1 rounded'
    default: return ''
  }
}
function formatCurrency(value) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') {
    value = parseFloat(value)
    if (isNaN(value)) return '-'
  }
  if (typeof value !== 'number') return '-'
  return '$' + value.toFixed(2)
}
function abrirModalEstado(trabajo) {
  modalEstado.value = { visible: true, trabajo, nuevoEstado: trabajo.estado }
}
function cerrarModalEstado() {
  modalEstado.value.visible = false
}
async function confirmarCambioEstado() {
  if (modalEstado.value.trabajo) {
    try {
      cargando.value = true
      error.value = null
      
      const trabajo = modalEstado.value.trabajo
      const nuevoEstado = modalEstado.value.nuevoEstado
      
      // Enviar cambio al backend
      await updateTrabajo(trabajo.id, { estado: nuevoEstado })
      
      // Actualizar trabajo en la lista local
      trabajo.estado = nuevoEstado
      
      // Cerrar modal
      cerrarModalEstado()
      
    } catch (err) {
      console.error('Error al cambiar estado del trabajo:', err)
      error.value = 'Error al actualizar el estado del trabajo'
    } finally {
      cargando.value = false
    }
  }
}
function abrirModalNuevoTrabajo() {
  modalNuevoTrabajo.value = true
}
function cerrarModalNuevoTrabajo() {
  modalNuevoTrabajo.value = false
}
function verDetalles(trabajo) {
  modalDetalles.value = { visible: true, trabajo }
}
function cerrarModalDetalles() {
  modalDetalles.value.visible = false
}
function editarTrabajo(trabajo) {
  modalEditar.value = { visible: true, trabajo }
}
function cerrarModalEditar() {
  modalEditar.value.visible = false
}
async function guardarTrabajo(trabajoActualizado) {
  try {
    cargando.value = true
    error.value = null
    
    // Llamar al servicio para actualizar el trabajo
    const response = await updateTrabajo(trabajoActualizado.id, trabajoActualizado)
    
    // Actualizar trabajo en la lista local
    const index = trabajos.value.findIndex(t => t.id === trabajoActualizado.id)
    if (index !== -1) {
      // Preservar clienteInfo si existe
      const clienteInfo = trabajos.value[index].clienteInfo
      trabajos.value[index] = { ...response, clienteInfo }
    }
    
    // Cerrar modal
    cerrarModalEditar()
    
    // Mostrar mensaje de éxito
    alert('Trabajo actualizado correctamente')
    
  } catch (err) {
    console.error('Error al actualizar trabajo:', err)
    error.value = 'Error al actualizar el trabajo'
  } finally {
    cargando.value = false
  }
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