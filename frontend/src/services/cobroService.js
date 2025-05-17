import apiClient from "./api";

/**
 * Obtiene todos los cobros
 * @returns {Promise} Promise con los datos de los cobros
 */
export async function getAllCobros() {
  const response = await apiClient.get("/cobros");
  return response.data;
}

/**
 * Obtiene un cobro por su ID
 * @param {number} id - ID del cobro
 * @returns {Promise} Promise con los datos del cobro
 */
export async function getCobroById(id) {
  const response = await apiClient.get(`/cobros/${id}`);
  return response.data;
}

/**
 * Obtiene los cobros asociados a un trabajo específico
 * @param {number} trabajoId - ID del trabajo
 * @returns {Promise} Promise con los cobros del trabajo
 */
export async function getCobrosByTrabajoId(trabajoId) {
  const response = await apiClient.get(`/cobros/trabajo/${trabajoId}`);
  return response.data;
}

/**
 * Crea un nuevo cobro
 * @param {Object} cobro - Datos del cobro a crear
 * @returns {Promise} Promise con los datos del cobro creado
 */
export async function createCobro(cobro) {
  const response = await apiClient.post("/cobros", cobro);
  return response.data;
}

/**
 * Actualiza un cobro existente
 * @param {number} id - ID del cobro a actualizar
 * @param {Object} cobro - Datos actualizados del cobro
 * @returns {Promise} Promise con los datos del cobro actualizado
 */
export async function updateCobro(id, cobro) {
  const response = await apiClient.put(`/cobros/${id}`, cobro);
  return response.data;
}

/**
 * Elimina un cobro
 * @param {number} id - ID del cobro a eliminar
 * @returns {Promise} Promise con el resultado de la eliminación
 */
export async function deleteCobro(id) {
  const response = await apiClient.delete(`/cobros/${id}`);
  return response.data;
}

/**
 * Obtiene los cobros del día actual
 * @returns {Promise} Promise con los cobros del día y el total cobrado
 */
export async function getCobrosDiarios() {
  const response = await apiClient.get("/cobros/diarios");
  return response.data;
}
