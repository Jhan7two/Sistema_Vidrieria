import apiClient from "./api";
import { convertToBoliviaTime } from "../utils/dateUtils";

/**
 * Obtiene los movimientos de caja del día actual
 * @returns {Promise} Promise con los movimientos de caja del día
 */
export async function getMovimientosDiarios() {
  try {
    const response = await apiClient.get("/caja/movimientos/diarios");
    console.log('Respuesta del servidor:', response); // Para debug
    
    // Procesar las fechas y montos en los movimientos
    if (response.data && Array.isArray(response.data.movimientos)) {
      response.data.movimientos = response.data.movimientos.map(mov => {
        let fechaProcesada = null;
        
        // Procesar la fecha
        if (mov.fecha_hora) {
          try {
            if (typeof mov.fecha_hora === 'string' && mov.fecha_hora.includes('/')) {
              const [datePart, timePart] = mov.fecha_hora.split(', ');
              const [day, month, year] = datePart.split('/');
              const [hours, minutes] = timePart.split(':');
              fechaProcesada = new Date(year, month - 1, day, hours, minutes);
            } else {
              fechaProcesada = new Date(mov.fecha_hora);
            }
            fechaProcesada = convertToBoliviaTime(fechaProcesada);
          } catch (error) {
            console.error('Error procesando fecha:', error, 'Fecha original:', mov.fecha_hora);
          }
        }

        // Asegurar que los montos sean números
        const monto = typeof mov.monto === 'string' ? parseFloat(mov.monto) : mov.monto;
        const saldoResultante = typeof mov.saldo_resultante === 'string' ? parseFloat(mov.saldo_resultante) : mov.saldo_resultante;
        
        return {
          ...mov,
          fecha_hora: fechaProcesada,
          monto: monto,
          saldo_resultante: saldoResultante
        };
      });

      // Ordenar movimientos por fecha (más recientes primero)
      response.data.movimientos.sort((a, b) => {
        if (!a.fecha_hora || !b.fecha_hora) return 0;
        return b.fecha_hora - a.fecha_hora;
      });
    }
    
    return response;
  } catch (error) {
    console.error("ERROR en getMovimientosDiarios:", error);
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
    
    const response = await apiClient.post("/caja", movimiento);
    return response.movimiento;
  } catch (error) {
    console.error("ERROR en registrarMovimiento:", error);
    throw new Error(error.response?.data?.message || 'Error al registrar el movimiento');
  }
}

/**
 * Obtiene el saldo actual de la caja
 * @returns {Promise} Promise con el saldo actual de la caja
 */
export async function getSaldoActual() {
  try {
    const response = await apiClient.get("/caja/saldo-actual");
    return response;
  } catch (error) {
    console.error("ERROR en getSaldoActual:", error);
    return { saldo: 0 };
  }
}

/**
 * Realiza el cierre de caja del día
 * @param {Object} cierre - Datos del cierre de caja (observaciones)
 * @returns {Promise} Promise con los datos del cierre registrado
 */
export async function cerrarCaja(cierre = {}) {
  try {
    const response = await apiClient.post("/caja/cerrar", cierre);
    return response;
  } catch (error) {
    console.error("ERROR en cerrarCaja:", error);
    throw new Error(error.response?.data?.message || 'Error al cerrar la caja');
  }
}

/**
 * Obtiene los cobros del día actual
 * @returns {Promise} Promise con los cobros del día
 */
export async function getCobrosDiarios() {
  try {
    const response = await apiClient.get("/cobros/diarios");
    return response;
  } catch (error) {
    console.error("ERROR en getCobrosDiarios:", error);
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
    const terminoEncoded = encodeURIComponent(termino);
    const response = await apiClient.get(`/trabajos/buscar?termino=${terminoEncoded}`);
    return response;
  } catch (error) {
    console.error("ERROR en buscarTrabajosPorCobrar:", error);
    return { 
      trabajos: [],
      error: true,
      mensaje: error.response?.data?.message || 'Error al buscar trabajos'
    };
  }
}

/**
 * Registra un cobro para un trabajo
 * @param {Object} cobro - Datos del cobro (trabajo_id, monto, metodo_pago, observaciones)
 * @returns {Promise} Promise con los datos del cobro registrado y el trabajo actualizado
 */
export async function registrarCobroTrabajo(cobro) {
  try {
    // Validación de datos
    if (!cobro || !cobro.trabajo_id) {
      throw new Error('Datos del cobro incompletos');
    }

    // Asegurar que el monto sea un número válido
    if (cobro.monto) {
      cobro.monto = parseFloat(cobro.monto);
      if (isNaN(cobro.monto)) {
        throw new Error('El monto debe ser un número válido');
      }
    }

    // Validar método de pago
    if (!cobro.metodo_pago) {
      cobro.metodo_pago = 'efectivo'; // valor por defecto
    }

    console.log('Enviando datos del cobro:', cobro);
    const response = await apiClient.post("/cobros", cobro);
    
    if (!response || !response.data) {
      throw new Error('Respuesta inválida del servidor');
    }

    return response.data;
  } catch (error) {
    console.error("ERROR en registrarCobroTrabajo:", error);
    throw new Error(error.response?.data?.message || 'Error al registrar el cobro');
  }
}

/**
 * Obtiene el historial de cierres de caja
 * @param {Object} params - Parámetros de consulta (page, limit, desde, hasta)
 * @returns {Promise} Promise con los cierres de caja
 */
export async function getHistorialCierres(params = {}) {
  try {
    const validParams = {
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 10,
      desde: params.desde || '',
      hasta: params.hasta || ''
    };
    
    const queryParams = new URLSearchParams();
    if (validParams.page) queryParams.append('page', validParams.page);
    if (validParams.limit) queryParams.append('limit', validParams.limit);
    if (validParams.desde) queryParams.append('desde', validParams.desde);
    if (validParams.hasta) queryParams.append('hasta', validParams.hasta);
    
    const queryString = queryParams.toString();
    const url = `/caja/cierres${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error("ERROR en getHistorialCierres:", error);
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
    const response = await apiClient.get("/caja/verificar-cierre-diario");
    return response;
  } catch (error) {
    console.error("ERROR en verificarCierreDiario:", error);
    return { existeCierre: false, cierre: null };
  }
}
