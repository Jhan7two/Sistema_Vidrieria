import apiClient from "./api";

/**
 * Obtiene todos los trabajos
 * @returns {Promise} Promise con los datos de los trabajos
 */
export async function getAllTrabajos() {
  const response = await apiClient.get("/trabajos");
  return response.data;
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
  const response = await apiClient.put(`/trabajos/${id}`, trabajo);
  return response.data;
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
