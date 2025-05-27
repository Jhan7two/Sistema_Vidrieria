import apiClient from "./api";

/**
 * Obtiene todos los clientes
 * @returns {Promise} Promise con los datos de los clientes
 */
export async function getAllClientes() {
  try {
    console.log('Solicitando lista de clientes');
    const response = await apiClient.get("/clientes");
    console.log('Respuesta de clientes recibida:', response);
    return response;
  } catch (error) {
    console.error('Error en getAllClientes:', error);
    throw error;
  }
}

/**
 * Obtiene un cliente por su ID
 * @param {number} id - ID del cliente
 * @returns {Promise} Promise con los datos del cliente
 */
export async function getClienteById(id) {
  try {
    const response = await apiClient.get(`/clientes/${id}`);
    return response;
  } catch (error) {
    console.error('Error al obtener cliente por ID:', error);
    throw error;
  }
}

/**
 * Crea un nuevo cliente
 * @param {Object} cliente - Datos del cliente a crear (nombre, telefono)
 * @returns {Promise} Promise con los datos del cliente creado
 */
export async function createCliente(cliente) {
  try {
    console.log('Creando cliente:', cliente);
    const response = await apiClient.post("/clientes", cliente);
    console.log('Respuesta completa del servidor:', response);
    console.log('Datos del cliente creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Actualiza un cliente existente
 * @param {number} id - ID del cliente a actualizar
 * @param {Object} cliente - Datos actualizados del cliente
 * @returns {Promise} Promise con los datos del cliente actualizado
 */
export async function updateCliente(id, cliente) {
  try {
    const response = await apiClient.put(`/clientes/${id}`, cliente);
    return response;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

/**
 * Elimina un cliente
 * @param {number} id - ID del cliente a eliminar
 * @returns {Promise} Promise con el resultado de la eliminación
 */
export async function deleteCliente(id) {
  try {
    const response = await apiClient.delete(`/clientes/${id}`);
    return response;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}

/**
 * Busca clientes por nombre o teléfono
 * @param {string} termino - Término de búsqueda
 * @returns {Promise} Promise con los resultados de la búsqueda
 */
export async function buscarClientes(termino) {
  try {
    const response = await apiClient.get(`/clientes/buscar?termino=${encodeURIComponent(termino)}`);
    return response;
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    throw error;
  }
} 