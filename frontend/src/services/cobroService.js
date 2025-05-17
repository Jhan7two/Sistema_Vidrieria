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
  try {
    console.log("Enviando datos de cobro al backend:", cobro);
    
    // Asegurarse de que el monto es un número
    if (cobro.monto && typeof cobro.monto === 'string') {
      cobro.monto = parseFloat(cobro.monto);
    }
    
    // Si el cobro tiene metodo_pago pero no tipo_pago, hacer la conversión
    if (cobro.metodo_pago && !cobro.tipo_pago) {
      cobro.tipo_pago = cobro.metodo_pago;
      delete cobro.metodo_pago;
    }
    
    const response = await apiClient.post("/cobros", cobro);
    console.log("Respuesta del servidor al crear cobro:", response);
    return response;
  } catch (error) {
    console.error("ERROR en createCobro:", error);
    
    // Personalizar mensaje de error según el tipo
    let mensaje = "Error al crear cobro";
    
    if (error.response) {
      // Error del servidor
      console.error("Error del servidor:", error.response.status, error.response.data);
      mensaje = error.response.data?.message || `Error ${error.response.status} del servidor`;
    } else if (error.request) {
      // Error de red
      console.error("Error de red - no se recibió respuesta");
      mensaje = "No se pudo conectar con el servidor";
    } else {
      // Otro tipo de error
      console.error("Error al procesar la solicitud:", error.message);
      mensaje = error.message || "Error desconocido";
    }
    
    throw {
      ...error,
      message: mensaje
    };
  }
}

/**
 * Actualiza un cobro existente
 * @param {number} id - ID del cobro a actualizar
 * @param {Object} cobro - Datos actualizados del cobro
 * @returns {Promise} Promise con los datos del cobro actualizado
 */
export async function updateCobro(id, cobro) {
  // Si el cobro tiene metodo_pago pero no tipo_pago, hacer la conversión
  if (cobro.metodo_pago && !cobro.tipo_pago) {
    cobro.tipo_pago = cobro.metodo_pago;
    delete cobro.metodo_pago;
  }
  
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
