<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold text-gray-700">Cotización de Trabajo</h2>
    </div>
    
    <div v-if="mensaje.visible" :class="['mb-4 p-4 rounded-md', mensaje.esError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
      {{ mensaje.texto }}
    </div>
    
    <!-- Formulario de cotización -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <form @submit.prevent="guardarCotizacion">
        <!-- Información del cliente -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 border-b pb-2">Información del Cliente</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
              <div class="flex space-x-4">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="tipoCliente" value="existente" class="form-radio h-4 w-4 text-blue-600" />
                  <span class="ml-2">Cliente Existente</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" v-model="tipoCliente" value="nuevo" class="form-radio h-4 w-4 text-blue-600" />
                  <span class="ml-2">Cliente Nuevo</span>
                </label>
              </div>
            </div>
            
            <div v-if="cargandoClientes" class="flex items-center">
              <svg class="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Cargando clientes...</span>
            </div>
          </div>
          
          <!-- Cliente existente -->
          <div v-if="tipoCliente === 'existente'" class="mb-4">
            <div class="flex space-x-2">
              <div class="flex-grow">
                <label class="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
                <select 
                  v-model="formulario.cliente_id" 
                  class="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Seleccionar cliente</option>
                  <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                    {{ cliente.nombre }} {{ cliente.telefono ? `(${cliente.telefono})` : '' }}
                  </option>
                </select>
              </div>
              
              <div class="w-72">
                <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div class="relative">
                  <input 
                    type="text" 
                    v-model="busquedaCliente" 
                    @input="filtrarClientes"
                    class="w-full border rounded-md px-3 py-2 pr-8" 
                    placeholder="Buscar por nombre..."
                  />
                  <span v-if="busquedaCliente" @click="limpiarBusqueda" class="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600">
                    ✕
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="busquedaCliente && clientesFiltrados.length === 0" class="mt-2 text-sm text-red-600">
              No se encontraron clientes con ese nombre. ¿Desea crear un <button type="button" @click="tipoCliente = 'nuevo'" class="text-blue-600 hover:underline">cliente nuevo</button>?
            </div>
            
            <div v-if="formulario.cliente_id" class="mt-3 bg-blue-50 p-3 rounded-md">
              <p class="text-sm font-medium">Cliente seleccionado:</p>
              <p class="text-sm">{{ clienteSeleccionado }}</p>
            </div>
          </div>
          
          <!-- Cliente nuevo -->
          <div v-if="tipoCliente === 'nuevo'" class="bg-gray-50 p-4 rounded-md mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input 
                  type="text" 
                  v-model="nuevoCliente.nombre" 
                  required 
                  class="w-full border rounded-md px-3 py-2" 
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  v-model="nuevoCliente.telefono" 
                  class="w-full border rounded-md px-3 py-2" 
                  placeholder="Teléfono de contacto"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Detalles del trabajo -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 border-b pb-2">Detalles del Trabajo</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Trabajo *</label>
              <select v-model="formulario.tipo" required class="w-full border rounded-md px-3 py-2">
                <option value="">Seleccionar tipo</option>
                <option value="Instalación">Instalación</option>
                <option value="Corte">Corte</option>
                <option value="Pulido">Pulido</option>
                <option value="Servicio">Servicio</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Programada *</label>
              <input 
                type="date" 
                v-model="formulario.fecha_programada" 
                required 
                class="w-full border rounded-md px-3 py-2"
              />
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea 
                v-model="formulario.descripcion" 
                required 
                rows="3" 
                class="w-full border rounded-md px-3 py-2" 
                placeholder="Describa el trabajo a realizar"
              ></textarea>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Dirección del Trabajo</label>
              <input 
                type="text" 
                v-model="formulario.direccion_trabajo" 
                class="w-full border rounded-md px-3 py-2" 
                placeholder="Dirección donde se realizará el trabajo"
              />
            </div>
          </div>
        </div>
        
        <!-- Información Financiera -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 border-b pb-2">Información Financiera</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Costo Total (Bs) *</label>
              <input 
                type="number" 
                v-model.number="formulario.costo_total" 
                required 
                min="0" 
                step="0.01" 
                class="w-full border rounded-md px-3 py-2"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Anticipo (BS)</label>
              <input 
                type="number" 
                v-model.number="formulario.monto_pagado" 
                min="0" 
                max="formulario.costo_total" 
                step="0.01" 
                class="w-full border rounded-md px-3 py-2"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Saldo Pendiente</label>
              <input 
                type="number" 
                :value="saldoPendiente" 
                disabled 
                class="w-full border rounded-md px-3 py-2 bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        <!-- Observaciones -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 border-b pb-2">Observaciones</h3>
          
          <div>
            <textarea 
              v-model="formulario.observaciones" 
              rows="3" 
              class="w-full border rounded-md px-3 py-2" 
              placeholder="Observaciones adicionales"
            ></textarea>
          </div>
          
          <div class="mt-4">
            <label class="flex items-center">
              <input type="checkbox" v-model="enviarCotizacion" class="form-checkbox h-5 w-5 text-blue-600" />
              <span class="ml-2 text-sm text-gray-700">Enviar cotización al cliente</span>
            </label>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="flex justify-end space-x-3 mt-8">
          <button 
            type="button" 
            @click="limpiarFormulario" 
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button 
            type="button" 
            @click="guardarBorrador" 
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Guardar Borrador
          </button>
          <button 
            type="submit" 
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            :disabled="enviando"
          >
            {{ enviando ? 'Guardando...' : 'Crear Cotización' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { createTrabajo } from '../../services/trabajoService';
import { getAllClientes, createCliente } from '../../services/clienteService';

// Estado del formulario
const formulario = ref({
  cliente_id: '',
  tipo: '',
  descripcion: '',
  fecha_programada: '',
  direccion_trabajo: '',
  costo_total: '',
  monto_pagado: 0,
  observaciones: '',
  estado: 'inicio'  // Por defecto, estado "Programado"
});

// Estado para clientes
const tipoCliente = ref('existente'); // 'existente' o 'nuevo'
const clientes = ref([]);
const clientesOriginal = ref([]); // Mantener la lista original para filtrar
const clientesFiltrados = ref([]);
const busquedaCliente = ref('');
const cargandoClientes = ref(false);

const nuevoCliente = ref({
  nombre: '',
  telefono: ''
});

// Estado UI
const enviando = ref(false);
const enviarCotizacion = ref(false);
const mensaje = ref({ visible: false, texto: '', esError: false });

// Calcular saldo pendiente
const saldoPendiente = computed(() => {
  const total = parseFloat(formulario.value.costo_total) || 0;
  const pagado = parseFloat(formulario.value.monto_pagado) || 0;
  return total - pagado;
});

// Mostrar información del cliente seleccionado
const clienteSeleccionado = computed(() => {
  if (!formulario.value.cliente_id) return '';
  
  const cliente = clientes.value.find(c => c.id == formulario.value.cliente_id);
  if (!cliente) return '';
  
  let info = cliente.nombre;
  if (cliente.telefono) info += ` • Tel: ${cliente.telefono}`;
  
  return info;
});

// Cargar lista de clientes
async function cargarClientes() {
  try {
    cargandoClientes.value = true;
    const response = await getAllClientes();
    
    if (Array.isArray(response)) {
      clientes.value = response;
      clientesOriginal.value = [...response];
      console.log('Clientes cargados:', clientes.value.length);
    } else {
      console.error('Respuesta de clientes no es un array:', response);
      mostrarMensaje('Formato de respuesta de clientes incorrecto', true);
    }
  } catch (error) {
    console.error('Error al cargar clientes:', error);
    mostrarMensaje('Error al cargar la lista de clientes', true);
  } finally {
    cargandoClientes.value = false;
  }
}

// Filtrar clientes por búsqueda
function filtrarClientes() {
  if (!busquedaCliente.value.trim()) {
    clientes.value = [...clientesOriginal.value];
    return;
  }
  
  const busqueda = busquedaCliente.value.toLowerCase().trim();
  clientes.value = clientesOriginal.value.filter(cliente => 
    cliente.nombre.toLowerCase().includes(busqueda) || 
    (cliente.telefono && cliente.telefono.includes(busqueda))
  );
}

// Limpiar búsqueda
function limpiarBusqueda() {
  busquedaCliente.value = '';
  clientes.value = [...clientesOriginal.value];
}

// Crear nuevo cliente
async function crearNuevoCliente() {
  if (!nuevoCliente.value.nombre) {
    mostrarMensaje('El nombre del cliente es obligatorio', true);
    return null;
  }
  
  try {
    const response = await createCliente(nuevoCliente.value);
    console.log('Cliente creado:', response);
    
    // Agregar el nuevo cliente a la lista
    if (response && response.id) {
      clientesOriginal.value.push(response);
      clientes.value = [...clientesOriginal.value];
      
      // Mostrar mensaje de éxito
      mostrarMensaje('Cliente creado correctamente', false);
      return response.id;
    } else {
      mostrarMensaje('Error: Respuesta del servidor incompleta', true);
      return null;
    }
  } catch (error) {
    console.error('Error al crear nuevo cliente:', error);
    mostrarMensaje('Error al crear el cliente: ' + (error.message || 'Error desconocido'), true);
    return null;
  }
}

// Guardar cotización como trabajo
async function guardarCotizacion() {
  try {
    enviando.value = true;
    
    // Validación básica de los datos del trabajo
    if (!formulario.value.tipo || !formulario.value.descripcion || !formulario.value.fecha_programada || !formulario.value.costo_total) {
      mostrarMensaje('Por favor complete todos los campos obligatorios del trabajo', true);
      return;
    }
    
    // Manejar el cliente según el tipo seleccionado
    if (tipoCliente.value === 'nuevo') {
      // Crear el cliente nuevo
      const clienteId = await crearNuevoCliente();
      if (!clienteId) {
        enviando.value = false;
        return;
      }
      
      // Asignar el ID del cliente creado
      formulario.value.cliente_id = clienteId;
    } else {
      // Validar que se haya seleccionado un cliente existente
      if (!formulario.value.cliente_id) {
        mostrarMensaje('Por favor seleccione un cliente', true);
        enviando.value = false;
        return;
      }
    }
    
    // Preparar datos para enviar
    const trabajo = {
      ...formulario.value,
      estado_pago: formulario.value.monto_pagado > 0 ? 
        (formulario.value.monto_pagado < formulario.value.costo_total ? 'Parcial' : 'Pagado') : 
        'Pendiente'
    };
    
    // Enviar a la API
    const response = await createTrabajo(trabajo);
    console.log('Cotización creada:', response);
    
    // Mostrar mensaje de éxito
    mostrarMensaje('Cotización guardada correctamente', false);
    
    // Limpiar formulario después de guardar
    limpiarFormulario();
    
    // Aquí se podría implementar la funcionalidad de enviar la cotización por email
    if (enviarCotizacion.value) {
      // Código para enviar cotización al cliente
      console.log('Enviar cotización al cliente...');
      mostrarMensaje('La función de enviar cotización está en desarrollo', true);
    }
    
  } catch (error) {
    console.error('Error al guardar cotización:', error);
    mostrarMensaje('Error al guardar la cotización: ' + (error.message || 'Error desconocido'), true);
  } finally {
    enviando.value = false;
  }
}

// Guardar como borrador (implementación básica)
function guardarBorrador() {
  // Aquí se podría implementar la funcionalidad de guardar como borrador
  // Por ahora, solo mostramos un mensaje
  mostrarMensaje('Función de guardar borrador en desarrollo', true);
}

// Limpiar formulario
function limpiarFormulario() {
  formulario.value = {
    cliente_id: '',
    tipo: '',
    descripcion: '',
    fecha_programada: '',
    direccion_trabajo: '',
    costo_total: '',
    monto_pagado: 0,
    observaciones: '',
    estado: 'inicio'
  };
  
  nuevoCliente.value = {
    nombre: '',
    telefono: ''
  };
  
  busquedaCliente.value = '';
  tipoCliente.value = 'existente';
  enviarCotizacion.value = false;
  
  // Restaurar la lista original de clientes
  clientes.value = [...clientesOriginal.value];
}

// Mostrar mensaje
function mostrarMensaje(texto, esError = false) {
  mensaje.value = {
    visible: true,
    texto,
    esError
  };
  
  // Ocultar mensaje después de 5 segundos
  setTimeout(() => {
    mensaje.value.visible = false;
  }, 5000);
}

// Observar cambios en tipoCliente
watch(tipoCliente, (nuevo) => {
  if (nuevo === 'existente') {
    // Si cambia a cliente existente, restablecer el formulario de nuevo cliente
    nuevoCliente.value = {
      nombre: '',
      telefono: ''
    };
  } else {
    // Si cambia a cliente nuevo, limpiar la selección de cliente existente
    formulario.value.cliente_id = '';
  }
});

// Al montar el componente
onMounted(() => {
  cargarClientes();
});
</script>