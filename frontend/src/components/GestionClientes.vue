<!-- frontend/src/components/GestionClientes.vue -->
<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
      <div>
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Gestión de Clientes
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          Lista de todos los clientes registrados en el sistema
        </p>
      </div>
      <button @click="mostrarFormularioNuevo" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Cliente
      </button>
    </div>

    <!-- Barra de búsqueda -->
    <div class="px-4 py-3 border-b border-gray-200">
      <div class="max-w-lg">
        <div class="relative">
          <input
            type="text"
            v-model="terminoBusqueda"
            @input="realizarBusqueda"
            placeholder="Buscar por nombre o teléfono..."
            class="block w-full pr-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de clientes -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teléfono
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="cliente in clientesOrdenados" :key="cliente.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ cliente.nombre }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ cliente.telefono || 'No especificado' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="editarCliente(cliente)" class="text-primary-600 hover:text-primary-900 mr-3">
                Editar
              </button>
              <button @click="confirmarEliminarCliente(cliente)" class="text-red-600 hover:text-red-900">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de formulario -->
    <div v-if="mostrarFormulario" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="guardarCliente" class="p-6">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ clienteSeleccionado ? 'Editar Cliente' : 'Nuevo Cliente' }}
              </h3>
              <div class="mt-4 space-y-4">
                <div>
                  <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    v-model="formCliente.nombre"
                    required
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="telefono" class="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    v-model="formCliente.telefono"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
              >
                {{ clienteSeleccionado ? 'Actualizar' : 'Crear' }}
              </button>
              <button
                type="button"
                @click="cerrarFormulario"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div v-if="mostrarModalEliminar" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Eliminar Cliente
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar al cliente {{ clienteAEliminar?.nombre }}? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="eliminarCliente" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
              Eliminar
            </button>
            <button @click="mostrarModalEliminar = false" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllClientes, deleteCliente, buscarClientes, createCliente, updateCliente } from '../services/clienteService'

// Estado local
const clientes = ref([])
const terminoBusqueda = ref('')
const mostrarModalEliminar = ref(false)
const clienteAEliminar = ref(null)
const mostrarFormulario = ref(false)
const clienteSeleccionado = ref(null)
const formCliente = ref({
  nombre: '',
  telefono: ''
})

// Computed property para ordenar clientes por nombre
const clientesOrdenados = computed(() => {
  return [...clientes.value].sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// Función para cargar clientes
const cargarClientes = async () => {
  try {
    const response = await getAllClientes()
    clientes.value = response
  } catch (error) {
    console.error('Error al cargar clientes:', error)
  }
}

// Función para buscar clientes
const realizarBusqueda = async () => {
  try {
    if (terminoBusqueda.value.trim() === '') {
      await cargarClientes()
      return
    }
    const response = await buscarClientes(terminoBusqueda.value)
    clientes.value = response
  } catch (error) {
    console.error('Error al buscar clientes:', error)
  }
}

// Funciones para gestionar clientes
const mostrarFormularioNuevo = () => {
  clienteSeleccionado.value = null
  formCliente.value = {
    nombre: '',
    telefono: ''
  }
  mostrarFormulario.value = true
}

const editarCliente = (cliente) => {
  clienteSeleccionado.value = cliente
  formCliente.value = {
    nombre: cliente.nombre,
    telefono: cliente.telefono || ''
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  clienteSeleccionado.value = null
  formCliente.value = {
    nombre: '',
    telefono: ''
  }
}

const guardarCliente = async () => {
  try {
    if (clienteSeleccionado.value) {
      const response = await updateCliente(clienteSeleccionado.value.id, formCliente.value)
      if (response) {
        await cargarClientes()
        cerrarFormulario()
      }
    } else {
      const response = await createCliente(formCliente.value)
      if (response) {
        await cargarClientes()
        cerrarFormulario()
      }
    }
  } catch (error) {
    console.error('Error al guardar cliente:', error)
  }
}

const confirmarEliminarCliente = (cliente) => {
  clienteAEliminar.value = cliente
  mostrarModalEliminar.value = true
}

const eliminarCliente = async () => {
  try {
    if (!clienteAEliminar.value) return
    
    const response = await deleteCliente(clienteAEliminar.value.id)
    if (response) {
      await cargarClientes()
      mostrarModalEliminar.value = false
      clienteAEliminar.value = null
    }
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
  }
}

// Cargar clientes al montar el componente
onMounted(() => {
  cargarClientes()
})
</script> 