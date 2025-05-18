<template>
    <div class="p-6 bg-gray-50 min-h-screen">
     
      <!-- Mensaje de depuración (temporal) -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <span class="block sm:inline">{{ error }}</span>
      </div>
      
      <div v-if="cargando" class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
        <span class="block sm:inline">Cargando datos...</span>
      </div>
      
      <!-- Filtros simplificados para el calendario -->
      <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select v-model="filtros.clienteId" class="w-full border rounded-md px-3 py-2" @change="filtrarTrabajos">
              <option value="">Todos los clientes</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Trabajo</label>
            <select v-model="filtros.tipo" class="w-full border rounded-md px-3 py-2" @change="filtrarTrabajos">
              <option value="">Todos los tipos</option>
              <option v-for="tipo in tiposTrabajos" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select v-model="filtros.estado" class="w-full border rounded-md px-3 py-2" @change="filtrarTrabajos">
              <option value="">Todos los estados</option>
              <option value="inicio">Programado</option>
              <option value="proceso">En Progreso</option>
              <option value="terminado">Completado</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button @click="cargarTrabajos" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Actualizar datos
          </button>
        </div>
      </div>
      
      <!-- Cabecera del Calendario -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="flex justify-between items-center p-4 border-b">
          <button 
            @click="changeMonth(-1)"
            class="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <h2 class="text-xl font-medium text-gray-800">
            {{ formatMonthYear(currentMonth) }}
          </h2>
          
          <button 
            @click="changeMonth(1)"
            class="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        <!-- Días de la semana -->
        <div class="grid grid-cols-7 bg-gray-100">
          <div v-for="(day, index) in diasSemana" :key="index" class="py-2 text-center text-sm font-medium text-gray-600">
            {{ day }}
          </div>
        </div>
        
        <!-- Mensaje cuando no hay trabajos -->
        <div v-if="!cargando && trabajosMes.length === 0" class="p-8 text-center text-gray-500">
          No hay trabajos programados para {{ formatMonthYear(currentMonth) }}
          <div class="mt-2">
            <button @click="cargarTrabajos" class="text-primary-600 font-medium hover:underline">
              Actualizar datos
            </button>
          </div>
        </div>
        
        <!-- Días del mes -->
        <div class="grid grid-cols-7">
          <template v-for="(celda, idx) in celdasCalendario" :key="idx">
            <!-- Celda vacía (antes del primer día o después del último día del mes) -->
            <div v-if="!celda.dia" class="border border-gray-200 p-2 h-32 bg-gray-50"></div>
            
            <!-- Celda con día -->
            <div v-else class="border border-gray-200 p-2 h-32 relative">
              <div class="font-medium text-gray-700 mb-1">{{ celda.dia }}</div>
              <div v-if="celda.trabajos.length > 0" class="space-y-1">
                <div 
                  v-for="trabajo in celda.trabajos.slice(0, 3)" 
                  :key="trabajo.id"
                  :class="['text-xs p-1 rounded truncate cursor-pointer', getEstadoClass(trabajo.estado)]"
                  @click="abrirModalTrabajo(trabajo)"
                >
                  {{ getHoraFromFecha(trabajo.fecha_programada) }} - {{ trabajo.cliente }} ({{ trabajo.tipo }})
                </div>
                <div 
                  v-if="celda.trabajos.length > 3" 
                  class="text-xs text-gray-500 font-medium cursor-pointer"
                  @click="abrirModalListaTrabajos(celda.trabajos)"
                >
                  + {{ celda.trabajos.length - 3 }} más
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
  
      <!-- Resumen Financiero -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-800">Resumen Financiero del Mes</h3>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600 font-medium">Total Trabajos</div>
            <div class="text-2xl font-semibold mt-1">{{ resumen.totalTrabajos }}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600 font-medium">Ingresos Totales</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.ingresosTotales) }}</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="text-sm text-yellow-600 font-medium">Adelantos Recibidos</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.adelantos) }}</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600 font-medium">Saldos Pendientes</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.saldosPendientes) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Modal de Detalles del Trabajo -->
      <div v-if="modalTrabajo.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white rounded-lg p-6 w-full max-w-lg">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-medium text-gray-900">Detalles del Trabajo</h3>
            <button 
              @click="cerrarModalTrabajo" 
              class="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="modalTrabajo.trabajo">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">ID Trabajo</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.id }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Estado</p>
                <span :class="['px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getEstadoClass(modalTrabajo.trabajo.estado)]">
                  {{ getEstadoLabel(modalTrabajo.trabajo.estado) }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-500">Cliente</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.cliente }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Tipo</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.tipo }}</p>
              </div>
            </div>
            
            <!-- Fechas del trabajo -->
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 class="font-medium text-gray-800 mb-2">Fechas del Trabajo</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Fecha Programada</p>
                  <p class="font-medium">{{ formatDate(modalTrabajo.trabajo.fecha_programada) }}</p>
                  <p class="text-xs text-gray-500">{{ getHoraFromFecha(modalTrabajo.trabajo.fecha_programada) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Fecha de Inicio</p>
                  <p v-if="modalTrabajo.trabajo.fecha_inicio" class="font-medium">
                    {{ formatDate(modalTrabajo.trabajo.fecha_inicio) }}
                  </p>
                  <p v-else class="text-sm text-gray-400 italic">No iniciado</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Fecha de Finalización</p>
                  <p v-if="modalTrabajo.trabajo.fecha_finalizacion" class="font-medium">
                    {{ formatDate(modalTrabajo.trabajo.fecha_finalizacion) }}
                  </p>
                  <p v-else class="text-sm text-gray-400 italic">No finalizado</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Fecha de Entrega</p>
                  <p v-if="modalTrabajo.trabajo.fecha_entrega" class="font-medium">
                    {{ formatDate(modalTrabajo.trabajo.fecha_entrega) }}
                  </p>
                  <p v-else class="text-sm text-gray-400 italic">No entregado</p>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">Dirección</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.direccion_trabajo || 'No especificada' }}</p>
              </div>
              <div v-if="modalTrabajo.trabajo.observaciones">
                <p class="text-sm text-gray-500">Observaciones</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.observaciones }}</p>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 class="font-medium text-gray-800 mb-2">Información Financiera</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Monto Total</p>
                  <p class="font-medium text-gray-800">{{ formatCurrency(modalTrabajo.trabajo.costo_total) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Adelanto</p>
                  <p class="font-medium text-green-600">{{ formatCurrency(modalTrabajo.trabajo.monto_pagado) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Saldo Pendiente</p>
                  <p class="font-medium text-red-600">{{ formatCurrency(modalTrabajo.trabajo.saldo_pendiente) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Estado de Pago</p>
                  <p class="font-medium" :class="{'text-red-600': modalTrabajo.trabajo.estado_pago === 'Pendiente', 'text-yellow-600': modalTrabajo.trabajo.estado_pago === 'Parcial', 'text-green-600': modalTrabajo.trabajo.estado_pago === 'Pagado'}">
                    {{ modalTrabajo.trabajo.estado_pago || 'No definido' }}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-4">
              <button 
                @click="abrirModalCambioEstado(modalTrabajo.trabajo)" 
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Cambiar Estado
              </button>
              <button v-if="modalTrabajo.trabajo.estado === 'terminado'" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Comprobante
              </button>
              <button 
                @click="irADetallesCompletos(modalTrabajo.trabajo)" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver Completo
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal lista de trabajos (más de 3 en un día) -->
      <div v-if="modalListaTrabajos.visible" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-lg font-bold">Trabajos del día</h2>
            <button 
              @click="cerrarModalListaTrabajos" 
              class="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-for="trabajo in modalListaTrabajos.trabajos" :key="trabajo.id" class="mb-2 p-2 border-b cursor-pointer hover:bg-gray-100" @click="abrirModalTrabajo(trabajo)">
            <div class="flex justify-between items-center">
              <span>{{ trabajo.cliente }} - {{ formatCurrency(trabajo.montoTotal) }}</span>
              <span :class="getEstadoClass(trabajo.estado)">{{ trabajo.estado }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal para cambiar estado del trabajo -->
      <div v-if="modalCambioEstado.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-medium text-gray-900">Cambiar estado del trabajo</h3>
            <button 
              @click="cerrarModalCambioEstado" 
              class="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="modalCambioEstado.trabajo" class="space-y-4">
            <div>
              <p class="text-sm text-gray-500 mb-1">Trabajo</p>
              <p class="font-medium">{{ modalCambioEstado.trabajo.id }} - {{ modalCambioEstado.trabajo.cliente }}</p>
            </div>
            
            <div>
              <p class="text-sm text-gray-500 mb-1">Estado actual</p>
              <p class="font-medium">{{ getEstadoLabel(modalCambioEstado.trabajo.estado) }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nuevo estado</label>
              <select v-model="modalCambioEstado.nuevoEstado" class="w-full border rounded-md px-3 py-2">
                <option value="inicio">Programado</option>
                <option value="proceso">En Progreso</option>
                <option value="espera">En Espera</option>
                <option value="terminado">Completado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
              <textarea 
                v-model="modalCambioEstado.observaciones" 
                rows="3" 
                class="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Ingrese observaciones sobre el cambio de estado..."
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button 
                @click="cerrarModalCambioEstado" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                @click="guardarCambioEstado" 
                :disabled="guardandoEstado"
                class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                <span v-if="guardandoEstado">Guardando...</span>
                <span v-else>Guardar cambios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { getAllTrabajos, updateTrabajo } from '../services/trabajoService';
  import { useRouter } from 'vue-router';
  
  // Propiedades
  const props = defineProps({
    trabajos: {
      type: Array,
      default: () => []
    },
    mesInicial: {
      type: Number,
      default: () => new Date().getMonth()
    },
    anioInicial: {
      type: Number,
      default: () => new Date().getFullYear()
    }
  });
  
  // Emits
  const emit = defineEmits(['update:mes', 'update:anio']);
  
  // Estados
  const currentMonth = ref(new Date(props.anioInicial, props.mesInicial));
  const modalTrabajo = ref({ visible: false, trabajo: null });
  const modalListaTrabajos = ref({ visible: false, trabajos: [] });
  const celdasCalendario = ref([]);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const error = ref(null);
  const cargando = ref(false);
  const todosTrabajos = ref([]);
  const trabajosFiltrados = ref([]);
  const clientes = ref([]);
  const tiposTrabajos = ref([]);
  const filtros = ref({
    clienteId: '',
    tipo: '',
    estado: ''
  });
  const modalCambioEstado = ref({
    visible: false,
    trabajo: null,
    nuevoEstado: '',
    observaciones: ''
  });
  const guardandoEstado = ref(false);
  
  // Filtrar trabajos según los filtros seleccionados
  function filtrarTrabajos() {
    trabajosFiltrados.value = todosTrabajos.value.filter(trabajo => {
      // Filtrar por cliente
      if (filtros.value.clienteId && trabajo.cliente_id !== filtros.value.clienteId) {
        return false;
      }
      
      // Filtrar por tipo
      if (filtros.value.tipo && trabajo.tipo !== filtros.value.tipo) {
        return false;
      }
      
      // Filtrar por estado
      if (filtros.value.estado && trabajo.estado !== filtros.value.estado) {
        return false;
      }
      
      return true;
    });
    
    // Regenerar el calendario con los trabajos filtrados
    generarCalendario();
  }
  
  // Cargar trabajos desde la API
  async function cargarTrabajos() {
    try {
      cargando.value = true;
      error.value = null;
      
      const respuesta = await getAllTrabajos();
      console.log('Respuesta de API trabajos:', respuesta);
      
      // Procesar los datos para asegurar que las fechas estén en formato correcto
      if (Array.isArray(respuesta)) {
        todosTrabajos.value = respuesta.map(trabajo => {
          // Normalizar la fecha programada para asegurar que sea válida
          if (trabajo.fecha_programada) {
            try {
              // Intentar parsear la fecha
              const fecha = new Date(trabajo.fecha_programada);
              
              // Verificar si la fecha es válida
              if (isNaN(fecha.getTime())) {
                console.error('Fecha inválida:', trabajo.fecha_programada);
                trabajo.fecha_programada_valida = false;
              } else {
                trabajo.fecha_programada_valida = true;
              }
            } catch (e) {
              console.error('Error al parsear fecha:', e);
              trabajo.fecha_programada_valida = false;
            }
          } else {
            trabajo.fecha_programada_valida = false;
          }
          
          // Calcular el saldo pendiente si no existe
          if (trabajo.costo_total && trabajo.monto_pagado && !trabajo.saldo_pendiente) {
            trabajo.saldo_pendiente = parseFloat(trabajo.costo_total) - parseFloat(trabajo.monto_pagado);
          }
          
          return trabajo;
        });
      } else {
        error.value = 'La respuesta de la API no tiene el formato esperado';
        todosTrabajos.value = [];
      }
      
      // Extraer lista única de clientes
      const clientesSet = new Set();
      const tiposSet = new Set();
      
      todosTrabajos.value.forEach(trabajo => {
        if (trabajo.cliente) {
          clientesSet.add(JSON.stringify({
            id: trabajo.cliente_id,
            nombre: trabajo.cliente
          }));
        }
        
        if (trabajo.tipo) {
          tiposSet.add(trabajo.tipo);
        }
      });
      
      clientes.value = Array.from(clientesSet).map(c => JSON.parse(c));
      tiposTrabajos.value = Array.from(tiposSet);
      
      console.log('Clientes extraídos:', clientes.value);
      console.log('Tipos de trabajo:', tiposTrabajos.value);
      console.log('Total trabajos cargados:', todosTrabajos.value.length);
      
      filtrarTrabajos();
    } catch (err) {
      console.error('Error al cargar trabajos:', err);
      error.value = 'Error al cargar los trabajos: ' + (err.message || 'Error desconocido');
      todosTrabajos.value = [];
    } finally {
      cargando.value = false;
    }
  }
  
  // Computed properties
  const trabajosMes = computed(() => {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    
    const filtrados = trabajosFiltrados.value.filter(t => {
      if (!t.fecha_programada || !t.fecha_programada_valida) return false;
      
      try {
        const fecha = new Date(t.fecha_programada);
        const coincide = fecha.getMonth() === month && fecha.getFullYear() === year;
        return coincide;
      } catch (e) {
        console.error('Error al filtrar trabajo por mes:', e);
        return false;
      }
    });
    
    console.log(`Trabajos para el mes ${month+1}/${year}:`, filtrados.length);
    return filtrados;
  });
  
  const resumen = computed(() => {
    let totalTrabajos = 0, ingresosTotales = 0, adelantos = 0, saldosPendientes = 0;
    
    trabajosMes.value.forEach(t => {
      totalTrabajos++;
      ingresosTotales += parseFloat(t.costo_total || 0);
      adelantos += parseFloat(t.monto_pagado || 0);
      saldosPendientes += parseFloat(t.saldo_pendiente || 0);
    });
    
    return { totalTrabajos, ingresosTotales, adelantos, saldosPendientes };
  });
  
  // Métodos
  function generarCalendario() {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const primerDiaSemana = primerDia.getDay();
    const totalDias = ultimoDia.getDate();
    
    console.log(`Generando calendario para ${month+1}/${year}`);
    
    const celdas = [];
    
    // Añadir espacios en blanco para los días antes del primer día del mes
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ dia: '', trabajos: [] });
    }
    
    // Añadir los días del mes
    for (let dia = 1; dia <= totalDias; dia++) {
      // Crear fecha para este día (sin hora, solo fecha)
      const trabajosDia = trabajosMes.value.filter(t => {
        try {
          if (!t.fecha_programada) return false;
          
          const fechaTrabajo = new Date(t.fecha_programada);
          return fechaTrabajo.getDate() === dia;
        } catch (e) {
          console.error('Error al filtrar trabajo por día:', e);
          return false;
        }
      });
      
      // Si hay trabajos en este día, log para depurar
      if (trabajosDia.length > 0) {
        console.log(`Día ${dia}: ${trabajosDia.length} trabajos encontrados`);
      }
      
      celdas.push({ dia, trabajos: trabajosDia });
    }
    
    // Completar la última semana con celdas vacías si es necesario
    const celdasRestantes = (7 - (celdas.length % 7)) % 7;
    for (let i = 0; i < celdasRestantes; i++) {
      celdas.push({ dia: '', trabajos: [] });
    }
    
    celdasCalendario.value = celdas;
  }
  
  function changeMonth(offset) {
    const newMonth = new Date(currentMonth.value);
    newMonth.setMonth(newMonth.getMonth() + offset);
    currentMonth.value = newMonth;
    
    // Emitir eventos para actualizar mes y año en el componente padre si es necesario
    emit('update:mes', newMonth.getMonth());
    emit('update:anio', newMonth.getFullYear());
    
    generarCalendario();
  }
  
  function formatMonthYear(date) {
    return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
  
  function formatCurrency(amount) {
    if (!amount) return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(0);
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }
  
  function getEstadoClass(estado) {
    switch (estado) {
      case 'inicio': return 'bg-yellow-100 text-yellow-800';
      case 'proceso': return 'bg-blue-100 text-blue-800';
      case 'espera': return 'bg-orange-100 text-orange-800';
      case 'terminado': return 'bg-green-100 text-green-800';
      case 'entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getEstadoLabel(estado) {
    switch (estado) {
      case 'inicio': return 'Programado';
      case 'proceso': return 'En Progreso';
      case 'espera': return 'En Espera';
      case 'terminado': return 'Completado';
      case 'entregado': return 'Entregado';
      default: return estado || 'Desconocido';
    }
  }
  
  function abrirModalTrabajo(trabajo) {
    modalTrabajo.value = { visible: true, trabajo };
    // Si estaba abierto el modal de lista, lo cerramos
    if (modalListaTrabajos.value.visible) {
      cerrarModalListaTrabajos();
    }
  }
  
  function cerrarModalTrabajo() {
    modalTrabajo.value = { visible: false, trabajo: null };
  }
  
  function abrirModalListaTrabajos(trabajos) {
    modalListaTrabajos.value = { visible: true, trabajos };
  }
  
  function cerrarModalListaTrabajos() {
    modalListaTrabajos.value = { visible: false, trabajos: [] };
  }
  
  function abrirModalCambioEstado(trabajo) {
    modalCambioEstado.value = {
      visible: true,
      trabajo: trabajo,
      nuevoEstado: trabajo.estado,
      observaciones: ''
    };
  }
  
  function cerrarModalCambioEstado() {
    modalCambioEstado.value = {
      visible: false,
      trabajo: null,
      nuevoEstado: '',
      observaciones: ''
    };
  }
  
  function getHoraFromFecha(fechaString) {
    if (!fechaString) return '';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return ''; // Fecha inválida
      
      return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error al obtener hora de fecha:', e);
      return '';
    }
  }
  
  // Inicializar el calendario al montar el componente
  onMounted(() => {
    cargarTrabajos();
  });
  
  async function guardarCambioEstado() {
    try {
      guardandoEstado.value = true;
      error.value = null;
      
      if (!modalCambioEstado.value.trabajo || !modalCambioEstado.value.nuevoEstado) {
        error.value = 'Datos incompletos para actualizar el estado';
        return;
      }
      
      const trabajoId = modalCambioEstado.value.trabajo.id;
      const estadoActual = modalCambioEstado.value.trabajo.estado;
      const nuevoEstado = modalCambioEstado.value.nuevoEstado;
      const observaciones = modalCambioEstado.value.observaciones;
      
      // Si el estado no cambió, no hacemos nada
      if (estadoActual === nuevoEstado) {
        cerrarModalCambioEstado();
        return;
      }
      
      console.log(`Actualizando trabajo #${trabajoId} de estado: ${estadoActual} a ${nuevoEstado}`);
      
      // Preparar datos para enviar al servidor
      const datosActualizacion = {
        estado: nuevoEstado
      };
      
      // Actualizar fechas según el cambio de estado
      const fechaActual = new Date().toISOString();
      
      // Si pasa a "En Progreso" y no tiene fecha_inicio, la establecemos
      if (nuevoEstado === 'proceso' && !modalCambioEstado.value.trabajo.fecha_inicio) {
        datosActualizacion.fecha_inicio = fechaActual;
      }
      
      // Si pasa a "Completado", establecemos la fecha_finalizacion
      if (nuevoEstado === 'terminado') {
        datosActualizacion.fecha_finalizacion = fechaActual;
      }
      
      // Si hay observaciones, incluirlas
      if (observaciones.trim()) {
        datosActualizacion.observaciones = observaciones;
      }
      
      // Enviar actualización al servidor
      const respuesta = await updateTrabajo(trabajoId, datosActualizacion);
      console.log('Respuesta de actualización:', respuesta);
      
      // Actualizar el trabajo en la lista local
      actualizarTrabajoLocal(trabajoId, respuesta);
      
      // Mostrar mensaje de éxito
      mostrarNotificacion('Estado actualizado correctamente', 'success');
      
      // Cerrar el modal
      cerrarModalCambioEstado();
      
      // Si el modal de detalles estaba abierto, actualizar el trabajo mostrado
      if (modalTrabajo.value.visible && modalTrabajo.value.trabajo && modalTrabajo.value.trabajo.id === trabajoId) {
        const trabajoActualizado = todosTrabajos.value.find(t => t.id === trabajoId);
        if (trabajoActualizado) {
          modalTrabajo.value.trabajo = trabajoActualizado;
        }
      }
      
    } catch (err) {
      console.error('Error al guardar el cambio de estado:', err);
      error.value = 'Error al guardar el cambio de estado: ' + (err.message || 'Error desconocido');
      mostrarNotificacion('Error al actualizar el estado', 'error');
    } finally {
      guardandoEstado.value = false;
    }
  }
  
  // Función para mostrar notificaciones
  function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    
    // Estilos según el tipo de notificación
    let clases = 'fixed bottom-4 right-4 px-4 py-3 rounded z-50 shadow-lg';
    
    if (tipo === 'success') {
      clases += ' bg-green-100 border border-green-400 text-green-700';
    } else if (tipo === 'error') {
      clases += ' bg-red-100 border border-red-400 text-red-700';
    } else if (tipo === 'warning') {
      clases += ' bg-yellow-100 border border-yellow-400 text-yellow-700';
    } else {
      clases += ' bg-blue-100 border border-blue-400 text-blue-700';
    }
    
    notificacion.className = clases;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 3000);
  }
  
  // Función para actualizar un trabajo en las listas locales sin recargar todo
  function actualizarTrabajoLocal(id, datosActualizados) {
    // Convertir respuesta a objeto si viene como string
    let datos = datosActualizados;
    if (typeof datosActualizados === 'string') {
      try {
        datos = JSON.parse(datosActualizados);
      } catch (e) {
        console.error('Error al parsear datos actualizados:', e);
        return;
      }
    }
    
    // Buscar el trabajo en todosTrabajos
    const indice = todosTrabajos.value.findIndex(t => t.id == id);
    if (indice !== -1) {
      // Crear un nuevo objeto para mantener reactividad
      const trabajoActualizado = { ...todosTrabajos.value[indice], ...datos };
      
      // Actualizar el trabajo en el array
      todosTrabajos.value[indice] = trabajoActualizado;
      
      console.log('Trabajo actualizado localmente:', trabajoActualizado);
      
      // Refiltrar los trabajos
      filtrarTrabajos();
    } else {
      console.warn(`No se encontró el trabajo #${id} en la lista local`);
    }
  }
  
  const router = useRouter();
  
  function irADetallesCompletos(trabajo) {
    cerrarModalTrabajo();
    router.push({ 
      name: 'trabajos', 
      query: { 
        id: trabajo.id,
        vista: 'tabla' 
      } 
    });
  }
  </script>
  
  <style scoped>
  .calendario-trabajos {
    min-height: 70vh;
  }
  </style>