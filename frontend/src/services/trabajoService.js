import apiClient from "./api";

/**
 * Obtiene todos los trabajos
 * @returns {Promise} Promise con los datos de los trabajos
 */
export async function getAllTrabajos() {
  try {
    console.log('Iniciando solicitud para obtener todos los trabajos');
    const response = await apiClient.get("/trabajos");
    console.log('Respuesta recibida:', response);
    return response;
  } catch (error) {
    console.error('Error en getAllTrabajos:', error);
    if (error.response) {
      console.error('Respuesta de error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error de configuración:', error.message);
    }
    throw error;
  }
}

/**
 * Obtiene un trabajo por su ID
 * @param {number} id - ID del trabajo
 * @returns {Promise} Promise con los datos del trabajo
 */
export async function getTrabajoById(id) {
  const response = await apiClient.get(`/trabajos/${id}`);
  return response.data;
}

/**
 * Crea un nuevo trabajo
 * @param {Object} trabajo - Datos del trabajo a crear
 * @returns {Promise} Promise con los datos del trabajo creado
 */
export async function createTrabajo(trabajo) {
  const response = await apiClient.post("/trabajos", trabajo);
  return response.data;
}

/**
 * Actualiza un trabajo existente
 * @param {number} id - ID del trabajo a actualizar
 * @param {Object} trabajo - Datos actualizados del trabajo
 * @returns {Promise} Promise con los datos del trabajo actualizado
 */
export async function updateTrabajo(id, trabajo) {
  try {
    console.log('Enviando actualización de trabajo:', id, trabajo);
    const response = await apiClient.put(`/trabajos/${id}`, trabajo);
    console.log('Respuesta de actualización recibida:', response);
    return response;
  } catch (error) {
    console.error('Error en updateTrabajo:', error);
    if (error.response) {
      console.error('Respuesta de error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error de configuración:', error.message);
    }
    throw error;
  }
}

/**
 * Elimina un trabajo
 * @param {number} id - ID del trabajo a eliminar
 * @returns {Promise} Promise con el resultado de la eliminación
 */
export async function deleteTrabajo(id) {
  const response = await apiClient.delete(`/trabajos/${id}`);
  return response.data;
}

/**
 * Obtiene el conteo de trabajos por estado para el dashboard
 * @returns {Promise} Promise con los conteos de trabajos por estado
 */
export async function getTrabajosPorEstado() {
  const response = await apiClient.get("/trabajos/estado");
  return response;
}

/**
 * Obtiene los trabajos recientes
 * @param {number} limit - Cantidad de trabajos a obtener (opcional, por defecto 5)
 * @returns {Promise} Promise con los trabajos recientes
 */
export async function getTrabajosRecientes(limit = 5) {
  const response = await apiClient.get(`/trabajos/recientes?limit=${limit}`);
  return response.data;
}
