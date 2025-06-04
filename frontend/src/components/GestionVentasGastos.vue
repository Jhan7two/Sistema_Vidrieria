<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <!-- Pestañas para alternar entre Ventas y Gastos -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex">
        <button
          @click="activeTab = 'ventas'"
          :class="[
            activeTab === 'ventas'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm'
          ]"
        >
          Ventas
        </button>
        <button
          @click="activeTab = 'gastos'"
          :class="[
            activeTab === 'gastos'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm'
          ]"
        >
          Gastos
        </button>
      </nav>
    </div>

    <!-- Filtros -->
    <div class="p-4 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Buscador -->
        <div class="col-span-1">
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="activeTab === 'ventas' ? 'Buscar venta...' : 'Buscar gasto...'"
            class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <!-- Filtro de fechas -->
        <div class="col-span-1">
          <input
            type="date"
            v-model="fechaInicio"
            class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <div class="col-span-1">
          <input
            type="date"
            v-model="fechaFin"
            class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>

    <!-- Mensaje de carga -->
    <div v-if="loading" class="p-4 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Cargando datos...</p>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Tabla de Ventas -->
    <div v-if="activeTab === 'ventas' && !loading && !error" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
            <th v-if="isAdmin" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="venta in ventasFiltradas" :key="venta.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(venta.fecha) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ venta.descripcion }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatMonto(venta.monto) }}</td>
            <td v-if="isAdmin" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button
                @click="editarVenta(venta)"
                class="text-primary-600 hover:text-primary-900 mr-3"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="confirmarEliminarVenta(venta)"
                class="text-red-600 hover:text-red-900"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Paginación -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="cambiarPagina(paginaActual - 1)"
            :disabled="paginaActual === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            @click="cambiarPagina(paginaActual + 1)"
            :disabled="paginaActual === totalPaginas"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (paginaActual - 1) * 10 + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(paginaActual * 10, totalRegistros) }}</span>
              de
              <span class="font-medium">{{ totalRegistros }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="cambiarPagina(paginaActual - 1)"
                :disabled="paginaActual === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Números de página -->
              <template v-for="pagina in paginasAMostrar" :key="pagina">
                <button
                  @click="cambiarPagina(pagina)"
                  :class="[
                    pagina === paginaActual
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]"
                >
                  {{ pagina }}
                </button>
              </template>

              <button
                @click="cambiarPagina(paginaActual + 1)"
                :disabled="paginaActual === totalPaginas"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Gastos -->
    <div v-if="activeTab === 'gastos' && !loading && !error" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
            <th v-if="isAdmin" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="gasto in gastosFiltrados" :key="gasto.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(gasto.fecha) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ gasto.categoria }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ gasto.descripcion }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatMonto(gasto.monto) }}</td>
            <td v-if="isAdmin" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button
                @click="editarGasto(gasto)"
                class="text-primary-600 hover:text-primary-900 mr-3"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="confirmarEliminarGasto(gasto)"
                class="text-red-600 hover:text-red-900"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Paginación -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="cambiarPagina(paginaActual - 1)"
            :disabled="paginaActual === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            @click="cambiarPagina(paginaActual + 1)"
            :disabled="paginaActual === totalPaginas"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (paginaActual - 1) * 10 + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(paginaActual * 10, totalRegistros) }}</span>
              de
              <span class="font-medium">{{ totalRegistros }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="cambiarPagina(paginaActual - 1)"
                :disabled="paginaActual === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Números de página -->
              <template v-for="pagina in paginasAMostrar" :key="pagina">
                <button
                  @click="cambiarPagina(pagina)"
                  :class="[
                    pagina === paginaActual
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]"
                >
                  {{ pagina }}
                </button>
              </template>

              <button
                @click="cambiarPagina(paginaActual + 1)"
                :disabled="paginaActual === totalPaginas"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición de Venta -->
    <div v-if="showEditVentaModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Editar Venta</h3>
            <form @submit.prevent="guardarVentaEditada">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  v-model="ventaEditada.fecha"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  v-model="ventaEditada.monto"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  v-model="ventaEditada.descripcion"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </form>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              @click="guardarVentaEditada"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              @click="showEditVentaModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición de Gasto -->
    <div v-if="showEditGastoModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Editar Gasto</h3>
            <form @submit.prevent="guardarGastoEditado">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  v-model="gastoEditado.fecha"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Categoría</label>
                <input
                  type="text"
                  v-model="gastoEditado.categoria"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  v-model="gastoEditado.monto"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  v-model="gastoEditado.descripcion"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </form>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              @click="guardarGastoEditado"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              @click="showEditGastoModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="showDeleteModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
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
                  Confirmar eliminación
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Está seguro que desea eliminar este {{ activeTab === 'ventas' ? 'venta' : 'gasto' }}? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              @click="confirmarEliminacion"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Eliminar
            </button>
            <button
              type="button"
              @click="showDeleteModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getHistoricoVentas, updateVenta, deleteVenta } from '../services/ventasService'
import { getHistoricoGastos, updateGasto, deleteGasto } from '../services/gastosService'
import { useAuthStore } from '../store/auth'

// Estado local
const activeTab = ref('ventas')
const searchQuery = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')
const loading = ref(false)
const error = ref(null)

// Estado de paginación
const paginaActual = ref(1)
const totalRegistros = ref(0)
const totalPaginas = ref(1)

// Datos
const ventas = ref([])
const gastos = ref([])

// Estado para edición y eliminación
const showEditVentaModal = ref(false)
const showEditGastoModal = ref(false)
const showDeleteModal = ref(false)
const ventaEditada = ref({})
const gastoEditado = ref({})
const itemAEliminar = ref(null)

// Auth store
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

// Computed para las páginas a mostrar
const paginasAMostrar = computed(() => {
  const paginas = []
  const maxPaginas = 6
  
  if (totalPaginas.value <= maxPaginas) {
    for (let i = 1; i <= totalPaginas.value; i++) {
      paginas.push(i)
    }
  } else {
    let inicio = Math.max(1, paginaActual.value - Math.floor(maxPaginas / 2))
    let fin = inicio + maxPaginas - 1
    
    if (fin > totalPaginas.value) {
      fin = totalPaginas.value
      inicio = Math.max(1, fin - maxPaginas + 1)
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i)
    }
  }
  
  return paginas
})

// Filtros computados
const ventasFiltradas = computed(() => {
  const filtered = ventas.value.filter(venta => {
    const matchesSearch = venta.descripcion?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDate = (!fechaInicio.value || venta.fecha >= fechaInicio.value) &&
                       (!fechaFin.value || venta.fecha <= fechaFin.value)
    return matchesSearch && matchesDate
  })

  // Actualizar el total de registros
  totalRegistros.value = filtered.length
  totalPaginas.value = Math.ceil(totalRegistros.value / 10)

  // Aplicar paginación
  const inicio = (paginaActual.value - 1) * 10
  const fin = inicio + 10
  return filtered.slice(inicio, fin)
})

const gastosFiltrados = computed(() => {
  const filtered = gastos.value.filter(gasto => {
    const matchesSearch = gasto.categoria?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         gasto.descripcion?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDate = (!fechaInicio.value || gasto.fecha >= fechaInicio.value) &&
                       (!fechaFin.value || gasto.fecha <= fechaFin.value)
    return matchesSearch && matchesDate
  })

  // Actualizar el total de registros
  totalRegistros.value = filtered.length
  totalPaginas.value = Math.ceil(totalRegistros.value / 10)

  // Aplicar paginación
  const inicio = (paginaActual.value - 1) * 10
  const fin = inicio + 10
  return filtered.slice(inicio, fin)
})

// Cargar datos
const cargarDatos = async () => {
  loading.value = true
  error.value = null
  
  try {
    if (activeTab.value === 'ventas') {
      const response = await getHistoricoVentas()
      console.log('Respuesta de ventas:', response) // Para debugging
      
      // Verificar si response es un array o si tiene la propiedad data
      const ventasData = Array.isArray(response) ? response : (response?.data || [])
      
      ventas.value = ventasData
    } else {
      const response = await getHistoricoGastos()
      console.log('Respuesta de gastos:', response) // Para debugging
      
      // Verificar si response es un array o si tiene la propiedad data
      const gastosData = Array.isArray(response) ? response : (response?.data || [])
      
      gastos.value = gastosData
    }
  } catch (err) {
    console.error('Error al cargar datos:', err)
    error.value = 'Error al cargar los datos. Por favor, intente nuevamente.'
    ventas.value = []
    gastos.value = []
  } finally {
    loading.value = false
  }
}

// Cambiar página
const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas.value) {
    paginaActual.value = nuevaPagina
  }
}

// Observar cambios en la pestaña activa
watch(activeTab, () => {
  paginaActual.value = 1
  cargarDatos()
})

// Cargar datos iniciales
onMounted(() => {
  cargarDatos()
})

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

// Función para formatear el monto
const formatMonto = (monto) => {
  if (monto === null || monto === undefined) return '$0.00';
  const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
  return isNaN(numero) ? '$0.00' : `$${numero.toFixed(2)}`;
}

// Métodos para edición y eliminación
const editarVenta = (venta) => {
  ventaEditada.value = { ...venta }
  showEditVentaModal.value = true
}

const editarGasto = (gasto) => {
  gastoEditado.value = { ...gasto }
  showEditGastoModal.value = true
}

const guardarVentaEditada = async () => {
  try {
    await updateVenta(ventaEditada.value.id, ventaEditada.value)
    await cargarDatos()
    showEditVentaModal.value = false
  } catch (err) {
    error.value = 'Error al actualizar la venta'
    console.error('Error:', err)
  }
}

const guardarGastoEditado = async () => {
  try {
    await updateGasto(gastoEditado.value.id, gastoEditado.value)
    await cargarDatos()
    showEditGastoModal.value = false
  } catch (err) {
    error.value = 'Error al actualizar el gasto'
    console.error('Error:', err)
  }
}

const confirmarEliminarVenta = (venta) => {
  itemAEliminar.value = venta
  showDeleteModal.value = true
}

const confirmarEliminarGasto = (gasto) => {
  itemAEliminar.value = gasto
  showDeleteModal.value = true
}

const confirmarEliminacion = async () => {
  try {
    if (activeTab.value === 'ventas') {
      await deleteVenta(itemAEliminar.value.id)
    } else {
      await deleteGasto(itemAEliminar.value.id)
    }
    await cargarDatos()
    showDeleteModal.value = false
  } catch (err) {
    error.value = 'Error al eliminar el registro'
    console.error('Error:', err)
  }
}
</script> 