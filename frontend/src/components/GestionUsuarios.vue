<!-- frontend/src/components/GestionUsuarios.vue -->
<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Gestión de Usuarios</h3>
      
      <!-- Botón para agregar nuevo usuario -->
      <div class="mt-4 flex justify-end">
        <button 
          @click="openModal('create')" 
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>
      
      <!-- Tabla de usuarios -->
      <div class="mt-4 flex flex-col">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" class="relative px-6 py-3">
                      <span class="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="loading">
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                  <tr v-else-if="users.length === 0">
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                  <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ user.nombre_usuario }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ user.nombre_completo }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                        :class="{
                          'bg-purple-100 text-purple-800': user.rol === 'admin',
                          'bg-blue-100 text-blue-800': user.rol === 'vendedor',
                          'bg-green-100 text-green-800': user.rol === 'operario'
                        }">
                        {{ user.rol }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                        :class="user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                        {{ user.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button @click="openModal('edit', user)" class="text-primary-600 hover:text-primary-900 mr-3">
                        Editar
                      </button>
                      <button @click="confirmDelete(user)" class="text-red-600 hover:text-red-900">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal para crear/editar usuario -->
      <div v-if="showModal" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Overlay de fondo -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          
          <!-- Centrado del modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <!-- Contenido del modal -->
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {{ modalMode === 'create' ? 'Crear nuevo usuario' : 'Editar usuario' }}
              </h3>
              
              <form @submit.prevent="saveUser" class="mt-4">
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div class="sm:col-span-3">
                    <label for="nombre_usuario" class="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                    <div class="mt-1">
                      <input type="text" name="nombre_usuario" id="nombre_usuario" v-model="currentUser.nombre_usuario" 
                        class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" required>
                    </div>
                  </div>
                  
                  <div class="sm:col-span-3">
                    <label for="nombre_completo" class="block text-sm font-medium text-gray-700">Nombre completo</label>
                    <div class="mt-1">
                      <input type="text" name="nombre_completo" id="nombre_completo" v-model="currentUser.nombre_completo" 
                        class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" required>
                    </div>
                  </div>
                  
                  <div class="sm:col-span-3">
                    <label for="password" class="block text-sm font-medium text-gray-700">
                      {{ modalMode === 'create' ? 'Contraseña' : 'Nueva contraseña (dejar en blanco para no cambiar)' }}
                    </label>
                    <div class="mt-1">
                      <input type="password" name="password" id="password" v-model="currentUser.password" 
                        :required="modalMode === 'create'"
                        class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    </div>
                  </div>
                  
                  <div class="sm:col-span-3">
                    <label for="rol" class="block text-sm font-medium text-gray-700">Rol</label>
                    <div class="mt-1">
                      <select id="rol" name="rol" v-model="currentUser.rol"
                        class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md">
                        <option value="admin">Administrador</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="operario">Operario</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="sm:col-span-6">
                    <div class="flex items-start">
                      <div class="flex items-center h-5">
                        <input id="activo" name="activo" type="checkbox" v-model="currentUser.activo"
                          class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded">
                      </div>
                      <div class="ml-3 text-sm">
                        <label for="activo" class="font-medium text-gray-700">Usuario activo</label>
                        <p class="text-gray-500">Los usuarios inactivos no podrán iniciar sesión en el sistema.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button type="submit" 
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm">
                    {{ modalMode === 'create' ? 'Crear' : 'Guardar cambios' }}
                  </button>
                  <button type="button" @click="closeModal" 
                    class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de confirmación para eliminar -->
      <div v-if="showDeleteConfirm" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Eliminar usuario
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar al usuario <span class="font-medium">{{ currentUser.nombre_completo }}</span>? 
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button type="button" @click="deleteUser" 
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                Eliminar
              </button>
              <button type="button" @click="showDeleteConfirm = false" 
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import userService from '../services/user.service'

// Estado
const users = ref([])
const loading = ref(true)
const error = ref(null)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalMode = ref('create') // 'create' o 'edit'
const currentUser = reactive({
  id: null,
  nombre_usuario: '',
  nombre_completo: '',
  password: '',
  rol: 'operario',
  activo: true
})

// Cargar usuarios al montar el componente
onMounted(async () => {
  await fetchUsers()
})

// Métodos
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await userService.getAllUsers()
    console.log('Datos de usuarios recibidos:', response)
    users.value = response.data
  } catch (err) {
    error.value = 'Error al cargar los usuarios'
    console.error('Error al cargar usuarios:', err)
  } finally {
    loading.value = false
  }
}

const openModal = (mode, user = null) => {
  modalMode.value = mode
  
  if (mode === 'create') {
    // Resetear el formulario para un nuevo usuario
    Object.assign(currentUser, {
      id: null,
      nombre_usuario: '',
      nombre_completo: '',
      password: '',
      rol: 'operario',
      activo: true
    })
  } else if (mode === 'edit' && user) {
    // Copiar los datos del usuario para edición
    Object.assign(currentUser, {
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      nombre_completo: user.nombre_completo,
      password: '', // No mostrar la contraseña actual
      rol: user.rol,
      activo: user.activo !== false // Si no está definido, asumir true
    })
  }
  
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUser = async () => {
  try {
    let response
    
    if (modalMode.value === 'create') {
      response = await userService.createUser(currentUser)
    } else {
      // Si estamos editando y no hay contraseña, no la enviamos
      const userData = { ...currentUser }
      if (!userData.password) {
        delete userData.password
      }
      
      response = await userService.updateUser(currentUser.id, userData)
    }
    
    // Actualizar la lista de usuarios
    await fetchUsers()
    
    // Cerrar el modal
    closeModal()
  } catch (err) {
    error.value = `Error al ${modalMode.value === 'create' ? 'crear' : 'actualizar'} el usuario`
    console.error(`Error al ${modalMode.value === 'create' ? 'crear' : 'actualizar'} usuario:`, err)
  }
}

const confirmDelete = (user) => {
  // Copiar los datos del usuario para confirmar eliminación
  Object.assign(currentUser, {
    id: user.id,
    nombre_usuario: user.nombre_usuario,
    nombre_completo: user.nombre_completo
  })
  
  showDeleteConfirm.value = true
}

const deleteUser = async () => {
  try {
    // Llamar al servicio para eliminar usuario
    await userService.deleteUser(currentUser.id)
    
    // Actualizar la lista de usuarios
    await fetchUsers()
    
    // Cerrar el modal de confirmación
    showDeleteConfirm.value = false
  } catch (err) {
    error.value = 'Error al eliminar el usuario'
    console.error('Error al eliminar usuario:', err)
  }
}
</script> 