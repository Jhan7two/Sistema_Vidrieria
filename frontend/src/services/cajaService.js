import apiClient from "./api";

/**
 * Obtiene los movimientos de caja del día actual
 * @returns {Promise} Promise con los movimientos de caja del día
 */
export async function getMovimientosDiarios() {
  try {
    // Para depuración, vamos a simplificar este código
    console.log("Llamando a endpoint /caja/movimientos/diarios");
    const response = await apiClient.get("/caja/movimientos/diarios");
    console.log("Respuesta directa del endpoint:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en getMovimientosDiarios:", error);
    // Devolvemos un valor predeterminado en caso de error
    return { movimientos: [] };
  }
}

/**
 * Registra un nuevo movimiento en la caja (ingreso o egreso)
 * @param {Object} movimiento - Datos del movimiento a registrar
 * @returns {Promise} Promise con los datos del movimiento registrado
 */
export async function registrarMovimiento(movimiento) {
  try {
    // Nos aseguramos de que el monto sea un número
    if (movimiento.monto !== undefined) {
      movimiento.monto = parseFloat(movimiento.monto);
      if (isNaN(movimiento.monto)) {
        throw new Error("El monto debe ser un número válido");
      }
    }
    
    console.log("Datos enviados a /caja:", movimiento);
    const response = await apiClient.post("/caja", movimiento);
    console.log("Respuesta del endpoint /caja:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en registrarMovimiento:", error);
    throw error; // Relanzamos el error para que se maneje en el componente
  }
}

/**
 * Obtiene el saldo actual de la caja
 * @returns {Promise} Promise con el saldo actual de la caja
 */
export async function getSaldoActual() {
  try {
    console.log("Llamando a endpoint /caja/saldo-actual");
    const response = await apiClient.get("/caja/saldo-actual");
    console.log("Respuesta directa del endpoint de saldo:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en getSaldoActual:", error);
    return { saldo: 0 }; // Valor predeterminado en caso de error
  }
}

/**
 * Realiza el cierre de caja del día
 * @param {Object} cierre - Datos del cierre de caja (observaciones)
 * @returns {Promise} Promise con los datos del cierre registrado
 */
export async function cerrarCaja(cierre = {}) {
  try {
    console.log("Llamando a endpoint /caja/cerrar con datos:", cierre);
    const response = await apiClient.post("/caja/cerrar", cierre);
    console.log("Respuesta del endpoint de cierre de caja:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en cerrarCaja:", error);
    throw error; // Relanzamos el error para que se maneje en el componente
  }
}

/**
 * Obtiene los cobros del día actual
 * @returns {Promise} Promise con los cobros del día
 */
export async function getCobrosDiarios() {
  try {
    console.log("Llamando a endpoint /cobros/diarios");
    const response = await apiClient.get("/cobros/diarios");
    console.log("Respuesta directa del endpoint de cobros diarios:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en getCobrosDiarios:", error);
    // Devolvemos un valor predeterminado en caso de error
    return { cobros: [], totalCobrado: 0 };
  }
}

/**
 * Busca trabajos por cliente o ID para registrar cobros
 * @param {string} termino - Término de búsqueda (nombre de cliente o ID)
 * @returns {Promise} Promise con los trabajos encontrados
 */
export async function buscarTrabajosPorCobrar(termino) {
  try {
    console.log("Buscando trabajos con término:", termino);
    
    // Codificar el término de búsqueda para manejar caracteres especiales
    const terminoEncoded = encodeURIComponent(termino);
    
    const response = await apiClient.get(`/trabajos/buscar?termino=${terminoEncoded}`);
    console.log("Respuesta de búsqueda de trabajos:", response);
    
    // Verifica si los datos tienen el formato esperado
    if (!response || typeof response !== 'object') {
      console.error("Respuesta inválida del servidor:", response);
      return { trabajos: [], mensaje: "Formato de respuesta inválido" };
    }
    
    return response;
  } catch (error) {
    console.error("ERROR en buscarTrabajosPorCobrar:", error);
    
    // Personalizar mensaje de error según el tipo
    let mensaje = "Error al buscar trabajos";
    
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
    
    // Devolver un objeto con el formato esperado y un mensaje de error
    return { 
      trabajos: [],
      error: true,
      mensaje
    };
  }
}

/**
 * Registra un cobro para un trabajo
 * @param {Object} cobro - Datos del cobro (trabajo_id, monto, metodo_pago, observaciones)
 * @returns {Promise} Promise con los datos del cobro registrado y el trabajo actualizado
 */
export async function registrarCobroTrabajo(cobro) {
  // Asegurarse de que el monto sea un número
  if (cobro.monto && typeof cobro.monto === 'string') {
    cobro.monto = parseFloat(cobro.monto);
  }
  
  const data = await apiClient.post("/cobros", cobro);
  return data;
}

/**
 * Obtiene el historial de cierres de caja
 * @param {Object} params - Parámetros de consulta (page, limit, desde, hasta)
 * @returns {Promise} Promise con los cierres de caja
 */
export async function getHistorialCierres(params = {}) {
  try {
    // Asegurarse de que los parámetros sean válidos
    const validParams = {
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 10,
      desde: params.desde || '',
      hasta: params.hasta || ''
    };
    
    // Construir query string
    const queryParams = new URLSearchParams();
    
    if (validParams.page) queryParams.append('page', validParams.page);
    if (validParams.limit) queryParams.append('limit', validParams.limit);
    if (validParams.desde) queryParams.append('desde', validParams.desde);
    if (validParams.hasta) queryParams.append('hasta', validParams.hasta);
    
    const queryString = queryParams.toString();
    const url = `/caja/cierres${queryString ? `?${queryString}` : ''}`;
    
    console.log("Llamando a endpoint con parámetros:", url, validParams);
    const response = await apiClient.get(url);
    console.log("Respuesta del historial de cierres:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en getHistorialCierres:", error);
    console.error("Detalles del error:", error.response?.data || error.message);
    // Devolvemos un valor predeterminado en caso de error
    return { 
      cierres: [], 
      meta: { 
        total: 0, 
        pages: 0, 
        currentPage: 1,
        totalEntradas: 0,
        totalSalidas: 0,
        totalSaldo: 0
      } 
    };
  }
}

/**
 * Verifica si existe un cierre de caja para el día actual
 * @returns {Promise} Promise con la información del cierre si existe
 */
export async function verificarCierreDiario() {
  try {
    console.log("Verificando si existe cierre para el día actual");
    const response = await apiClient.get("/caja/verificar-cierre-diario");
    console.log("Respuesta de verificación de cierre diario:", response);
    
    return response;
  } catch (error) {
    console.error("ERROR en verificarCierreDiario:", error);
    // Devolvemos un valor predeterminado en caso de error
    return { existeCierre: false, cierre: null };
  }
}
