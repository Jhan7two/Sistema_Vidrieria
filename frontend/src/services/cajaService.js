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
 * @param {Object} cierre - Datos del cierre de caja
 * @returns {Promise} Promise con los datos del cierre registrado
 */
export async function cerrarCaja(cierre) {
  const data = await apiClient.post("/caja/cerrar", cierre);
  return data;
}

/**
 * Obtiene los cobros del día actual
 * @returns {Promise} Promise con los cobros del día
 */
export async function getCobrosDiarios() {
  const data = await apiClient.get("/cobros/diarios");
  return data;
}

/**
 * Busca trabajos por cliente o ID para registrar cobros
 * @param {string} termino - Término de búsqueda (nombre de cliente o ID)
 * @returns {Promise} Promise con los trabajos encontrados
 */
export async function buscarTrabajosPorCobrar(termino) {
  const data = await apiClient.get(`/trabajos/buscar?termino=${termino}`);
  return data;
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
