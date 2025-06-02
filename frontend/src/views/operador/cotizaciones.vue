<template>
  <div id="cotizaciones-component" class="max-w-6xl mx-auto p-6">
    <!-- Mensaje de estado -->
    <div v-if="mensaje.visible" 
         :class="['mb-4 p-4 rounded-md', mensaje.esError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
      {{ mensaje.texto }}
    </div>

    <form @submit.prevent="guardarCotizacion" class="space-y-6">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Sección Cliente -->
        <div class="flex-1 rounded-xl shadow-md bg-white/60 backdrop-blur-md">
          <div class="rounded-t-xl px-6 py-3 mb-4 flex items-center gap-2"
               style="background: linear-gradient(90deg, #2563eb 80%, #1e40af 100%);">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h3 class="text-lg font-semibold text-white">Información del Cliente</h3>
          </div>
          <div class="px-6 pb-6">
            <div class="mb-4">
              <div class="flex space-x-4">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="tipoCliente" value="existente" class="form-radio">
                  <span class="ml-2">Cliente Existente</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" v-model="tipoCliente" value="nuevo" class="form-radio">
                  <span class="ml-2">Nuevo Cliente</span>
                </label>
              </div>
            </div>
            <!-- Cliente Existente -->
            <div v-if="tipoCliente === 'existente'" class="space-y-4">
              <div>
                <label for="busquedaCliente" class="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
                <input
                  id="busquedaCliente"
                  v-model="busquedaCliente"
                  @input="debounceFiltrar"
                  placeholder="Ingrese nombre o teléfono del cliente"
                  class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <!-- Lista de Clientes Filtrados -->
              <div v-if="clientesFiltrados.length > 0" class="max-h-60 overflow-y-auto border rounded-md">
                <div 
                  v-for="cliente in clientesFiltrados" 
                  :key="cliente.id"
                  @click="seleccionarCliente(cliente)"
                  class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  :class="{'bg-blue-50': clienteSeleccionado === cliente.id}"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-900">{{ cliente.nombre }}</p>
                      <p class="text-sm text-gray-600">{{ cliente.telefono }}</p>
                    </div>
                    <button 
                      v-if="clienteSeleccionado === cliente.id"
                      @click.stop="deseleccionarCliente"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Mensaje cuando no hay resultados -->
              <div v-else-if="busquedaCliente && !cargando" class="text-center py-4 text-gray-500">
                No se encontraron clientes que coincidan con la búsqueda
              </div>
              <!-- Cliente Seleccionado -->
              <div v-if="clienteSeleccionado" class="bg-blue-50 p-4 rounded-md">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-blue-900">Cliente Seleccionado</h4>
                    <p class="text-blue-800">{{ obtenerNombreCliente(clienteSeleccionado) }}</p>
                    <p class="text-sm text-blue-700">{{ obtenerTelefonoCliente(clienteSeleccionado) }}</p>
                  </div>
                  <button 
                    @click="deseleccionarCliente"
                    class="text-blue-400 hover:text-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <!-- Nuevo Cliente -->
            <div v-if="tipoCliente === 'nuevo'" class="space-y-4">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                  <input type="text" v-model="nuevoCliente.nombre" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400" required>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" v-model="nuevoCliente.telefono" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400">
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Sección Trabajo -->
        <div class="flex-1 rounded-xl shadow-md bg-white/60 backdrop-blur-md mt-6 md:mt-0">
          <div class="rounded-t-xl px-6 py-3 mb-4 flex items-center gap-2"
               style="background: linear-gradient(90deg, #22c55e 80%, #15803d 100%);">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2a4 4 0 014-4h3m4 4v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2h3a4 4 0 014 4v2" /></svg>
            <h3 class="text-lg font-semibold text-white">Detalles del Trabajo</h3>
          </div>
          <div class="px-6 pb-6">
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Trabajo</label>
                  <select v-model="trabajo.tipo" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400" required>
                    <option value="">Seleccione tipo</option>
                    <option value="Ventana">Ventana</option>
                    <option value="Puerta">Puerta</option>
                    <option value="Espejo">Espejo</option>
                    <option value="Vidrio">Vidrio</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Programada</label>
                  <input type="date" v-model="trabajo.fecha_programada" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400" required>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo</label>
                <textarea v-model="trabajo.descripcion" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400" rows="3" required 
                          placeholder="Describa detalladamente el trabajo a realizar..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección del Trabajo</label>
                <textarea v-model="trabajo.direccion_trabajo" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400" rows="2"
                          placeholder="Especifique la dirección donde se realizará el trabajo..."></textarea>
              </div>
              <!-- Sección de Costos y Pagos -->
              <div class="bg-gray-50/70 backdrop-blur-sm p-4 rounded-lg">
                <h4 class="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
                  Información de Costos y Pagos
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Costo Total</label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-gray-500">$</span>
                      <input type="number" v-model="trabajo.costo_total" step="0.01" 
                             class="w-full border rounded-md pl-7 pr-3 py-2 focus:ring-2 focus:ring-yellow-400" required>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Anticipo</label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-gray-500">$</span>
                      <input type="number" v-model="trabajo.monto_pagado" step="0.01" 
                             class="w-full border rounded-md pl-7 pr-3 py-2 focus:ring-2 focus:ring-yellow-400" required>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Saldo Pendiente</label>
                    <div class="bg-white border rounded-md px-3 py-2 text-right font-medium">
                      {{ calcularSaldoPendiente }}
                    </div>
                  </div>
                </div>
                <div class="mt-3">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Estado del Pago</label>
                  <select v-model="trabajo.estado_pago" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-400" required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea v-model="trabajo.observaciones" class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400" rows="2"
                          placeholder="Agregue cualquier observación adicional..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Botones de Acción -->
      <div class="flex justify-end space-x-4 mt-6">
        <button type="submit" 
                class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          Guardar Cotización
        </button>
      </div>
    </form>
    <!-- Agregar indicador de carga y mensajes de error -->
    <div v-if="cargando" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-2 text-gray-600">Cargando...</p>
      </div>
    </div>
    <div v-if="error" class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAllClientes, buscarClientes, createCliente } from '../../services/clienteService';
import { createTrabajo } from '../../services/trabajoService';
import { createVenta } from '../../services/ventasService';
import { registrarMovimiento } from '../../services/cajaService';

const router = useRouter();

// Estado del formulario
const tipoCliente = ref('existente');
const clienteSeleccionado = ref('');
const busquedaCliente = ref('');
const clientes = ref([]);
const clientesFiltrados = ref([]);
const cargando = ref(false);
const error = ref(null);
const mensaje = ref({ visible: false, texto: '', esError: false });

const nuevoCliente = ref({
  nombre: '',
  telefono: ''
});

const trabajo = ref({
  cliente_id: null,
  tipo: '',
  descripcion: '',
  fecha_programada: '',
  fecha_inicio: null,
  fecha_finalizacion: null,
  fecha_entrega: null,
  estado: 'inicio',
  direccion_trabajo: '',
  costo_total: 0,
  monto_pagado: 0,
  saldo_pendiente: 0,
  estado_pago: 'Pendiente',
  observaciones: ''
});

// Computed properties
const calcularSaldoPendiente = computed(() => {
  const total = parseFloat(trabajo.value.costo_total) || 0;
  const pagado = parseFloat(trabajo.value.monto_pagado) || 0;
  const saldo = total - pagado;
  trabajo.value.saldo_pendiente = saldo; // Actualizar el saldo pendiente en el objeto trabajo
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(saldo);
});

// Métodos de búsqueda y selección de clientes
const filtrarClientes = async () => {
  try {
    cargando.value = true;
    error.value = null;
    
    if (!busquedaCliente.value) {
      await cargarClientes();
      return;
    }

    const data = await buscarClientes(busquedaCliente.value);
    clientesFiltrados.value = data;
  } catch (err) {
    console.error('Error al buscar clientes:', err);
    mostrarMensaje('Error al buscar clientes. Por favor, intente nuevamente.', true);
    clientesFiltrados.value = [];
  } finally {
    cargando.value = false;
  }
};

// Debounce para filtrar clientes (se ejecuta solo cuando el usuario deja de escribir)
let debounceTimer = null;
const debounceFiltrar = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { filtrarClientes(); }, 300);
};

const seleccionarCliente = (cliente) => {
  clienteSeleccionado.value = cliente.id;
  trabajo.value.cliente_id = cliente.id;
  busquedaCliente.value = '';
  clientesFiltrados.value = [];
};

const deseleccionarCliente = () => {
  clienteSeleccionado.value = '';
  trabajo.value.cliente_id = null;
};

// Métodos para obtener información del cliente
const obtenerNombreCliente = (id) => {
  const cliente = clientes.value.find(c => c.id === id);
  return cliente ? cliente.nombre : '';
};

const obtenerTelefonoCliente = (id) => {
  const cliente = clientes.value.find(c => c.id === id);
  return cliente ? cliente.telefono : '';
};

const cargarClientes = async () => {
  try {
    cargando.value = true;
    error.value = null;
    const data = await getAllClientes();
    clientes.value = data;
    clientesFiltrados.value = data;
  } catch (err) {
    console.error('Error al cargar clientes:', err);
    mostrarMensaje('Error al cargar la lista de clientes. Por favor, intente nuevamente.', true);
    clientes.value = [];
    clientesFiltrados.value = [];
  } finally {
    cargando.value = false;
  }
};

const guardarCliente = async () => {
  try {
    cargando.value = true;
    error.value = null;
    
    if (!nuevoCliente.value.nombre) {
      mostrarMensaje('El nombre del cliente es obligatorio', true);
      return null;
    }

    const clienteCreado = await createCliente(nuevoCliente.value);
    console.log('Cliente creado:', clienteCreado);

    if (!clienteCreado) {
      mostrarMensaje('Error al crear el cliente: No se recibió respuesta válida', true);
      return null;
    }

    // Verificar si la respuesta tiene la estructura esperada
    const clienteId = clienteCreado.id || (clienteCreado.data && clienteCreado.data.id);
    console.log('ID del cliente creado:', clienteId);
    
    if (!clienteId) {
      console.error('Estructura de respuesta inesperada:', clienteCreado);
      mostrarMensaje('Error al crear el cliente: No se recibió ID válido', true);
      return null;
    }

    // Establecer el ID del cliente en el trabajo
    trabajo.value.cliente_id = clienteId;
    clienteSeleccionado.value = clienteId;
    
    // Limpiar el formulario de nuevo cliente
    nuevoCliente.value = {
      nombre: '',
      telefono: ''
    };
    
    await cargarClientes();
    tipoCliente.value = 'existente';
    mostrarMensaje('Cliente creado correctamente', false);
    return clienteId;
  } catch (err) {
    console.error('Error al guardar cliente:', err);
    mostrarMensaje('Error al guardar el cliente: ' + (err.message || 'Error desconocido'), true);
    return null;
  } finally {
    cargando.value = false;
  }
};

const validarFormulario = () => {
  if (tipoCliente.value === 'nuevo' && !nuevoCliente.value.nombre) {
    mostrarMensaje('El nombre del cliente es obligatorio', true);
    return false;
  }
  
  if (tipoCliente.value === 'existente' && !clienteSeleccionado.value) {
    mostrarMensaje('Debe seleccionar un cliente existente', true);
    return false;
  }

  if (!trabajo.value.tipo) {
    mostrarMensaje('El tipo de trabajo es obligatorio', true);
    return false;
  }
  if (!trabajo.value.descripcion) {
    mostrarMensaje('La descripción del trabajo es obligatoria', true);
    return false;
  }
  if (!trabajo.value.fecha_programada) {
    mostrarMensaje('La fecha programada es obligatoria', true);
    return false;
  }
  if (!trabajo.value.costo_total || trabajo.value.costo_total <= 0) {
    mostrarMensaje('El costo total debe ser mayor a 0', true);
    return false;
  }
  return true;
};

const guardarCotizacion = async () => {
  try {
    if (!validarFormulario()) {
      return;
    }

    cargando.value = true;
    error.value = null;

    // Si es cliente nuevo, primero guardarlo
    if (tipoCliente.value === 'nuevo') {
      console.log('Creando nuevo cliente...');
      const clienteId = await guardarCliente();
      console.log('ID del cliente creado:', clienteId);
      
      if (!clienteId) {
        mostrarMensaje('No se pudo crear el cliente. No se puede continuar.', true);
        return;
      }
      
      // Asegurarse de que el cliente_id esté establecido
      trabajo.value.cliente_id = clienteId;
      console.log('Cliente ID establecido en el trabajo:', trabajo.value.cliente_id);
    }

    // Verificar que el cliente_id esté establecido
    if (!trabajo.value.cliente_id) {
      console.error('No hay cliente_id establecido:', trabajo.value);
      mostrarMensaje('Debe seleccionar o crear un cliente', true);
      return;
    }

    // Actualizar estado de pago basado en el monto pagado
    const total = parseFloat(trabajo.value.costo_total) || 0;
    const pagado = parseFloat(trabajo.value.monto_pagado) || 0;
    
    if (pagado >= total) {
      trabajo.value.estado_pago = 'Pagado';
    } else if (pagado > 0) {
      trabajo.value.estado_pago = 'Parcial';
    } else {
      trabajo.value.estado_pago = 'Pendiente';
    }

    // Preparar los datos del trabajo según el modelo
    const trabajoData = {
      ...trabajo.value,
      fecha_programada: new Date(trabajo.value.fecha_programada).toISOString(),
      costo_total: parseFloat(trabajo.value.costo_total),
      monto_pagado: parseFloat(trabajo.value.monto_pagado),
      saldo_pendiente: parseFloat(trabajo.value.saldo_pendiente)
    };

    console.log('Datos del trabajo a guardar:', trabajoData);

    // Enviar a la API
    const response = await createTrabajo(trabajoData);
    console.log('Respuesta completa del servidor:', response);
    
    // Obtener el ID del trabajo de la respuesta
    let trabajoId;
    if (response && response.data) {
      trabajoId = response.data.id;
      console.log('ID del trabajo obtenido de response.data:', trabajoId);
    } else if (response && response.id) {
      trabajoId = response.id;
      console.log('ID del trabajo obtenido de response:', trabajoId);
    } else {
      console.error('Estructura de respuesta inesperada:', response);
      throw new Error('No se pudo obtener el ID del trabajo de la respuesta del servidor');
    }

    if (!trabajoId) {
      console.error('No se pudo obtener el ID del trabajo de la respuesta:', response);
      throw new Error('Error al obtener el ID del trabajo creado');
    }
    
    // Si hay un anticipo, registrar como venta y en caja
    if (pagado > 0) {
      const ventaData = {
        fecha: new Date().toISOString().split('T')[0],
        monto: pagado,
        tipo: pagado >= total ? 'venta completa' : 'adelanto',
        descripcion: `Anticipo para trabajo #${trabajoId}`,
        cliente_id: trabajo.value.cliente_id,
        trabajo_id: trabajoId
      };
      
      try {
        // Registrar la venta
        const ventaResponse = await createVenta(ventaData);
        console.log('Respuesta de la venta creada:', ventaResponse);

        // Registrar el movimiento en caja
        const movimientoCaja = {
          tipo_movimiento: 'entrada',
          concepto: `Anticipo trabajo #${trabajoId}`,
          monto: pagado,
          descripcion: `Anticipo para trabajo #${trabajoId} - ${ventaData.tipo}`,
          forma_pago: 'efectivo', // Por defecto, se puede modificar según necesidad
          referencia: `Trabajo #${trabajoId}`
        };

        await registrarMovimiento(movimientoCaja);
        console.log('Movimiento en caja registrado:', movimientoCaja);
      } catch (error) {
        console.error('Error al registrar la venta o el movimiento en caja:', error);
        // No interrumpimos el flujo si falla el registro de la venta o el movimiento
      }
    }
    
    mostrarMensaje('Cotización guardada correctamente', false);
    router.push('/operador/cotizaciones');
  } catch (err) {
    console.error('Error al guardar la cotización:', err);
    mostrarMensaje('Error al guardar la cotización: ' + (err.message || 'Error desconocido'), true);
  } finally {
    cargando.value = false;
  }
};

const mostrarMensaje = (texto, esError = false) => {
  mensaje.value = {
    visible: true,
    texto,
    esError
  };
  
  setTimeout(() => {
    mensaje.value.visible = false;
  }, 5000);
};

// Recibir el costo total desde la cotización
const recibirCostoTotal = (costo) => {
  trabajo.value.costo_total = costo;
};

// Exponer la función para que pueda ser llamada desde el componente de cotización
defineExpose({
  recibirCostoTotal
});

onMounted(() => {
  cargarClientes();
  
  // Obtener el total de la cotización si existe
  const cotizacionTotal = localStorage.getItem('cotizacionTotal');
  if (cotizacionTotal) {
    trabajo.value.costo_total = Number(cotizacionTotal);
    // Limpiar el localStorage después de usarlo
    localStorage.removeItem('cotizacionTotal');
  }
});
</script>