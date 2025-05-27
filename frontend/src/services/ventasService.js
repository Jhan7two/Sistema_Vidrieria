import apiClient from "./api";

/**
 * Obtiene las ventas del mes actual
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise<{ventas: Array, totalMes: number}>}
 */
export async function getVentasDelMes(page = 1, limit = 10) {
  try {
    const response = await apiClient.get(`/ventas?page=${page}&limit=${limit}&sort=fecha:desc`);
    
    // Asegurarnos de que devolvemos un array
    let ventasData = [];
    if (Array.isArray(response.data)) {
      ventasData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      ventasData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return { ventas: [], totalMes: 0 };
    }

    // Procesar los datos para asegurar que los montos sean números
    const ventasProcesadas = ventasData.map(venta => ({
      ...venta,
      monto: typeof venta.monto === 'string' ? parseFloat(venta.monto) : venta.monto,
      fecha: venta.fecha ? new Date(venta.fecha) : null
    }));

    // Calcular el total del mes
    const totalMes = ventasProcesadas.reduce((sum, venta) => sum + (venta.monto || 0), 0);

    return {
      ventas: ventasProcesadas,
      totalMes: parseFloat(totalMes.toFixed(2))
    };
  } catch (error) {
    console.error("Error en getVentasDelMes:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener las ventas del mes');
  }
}

/**
 * Obtiene el histórico completo de ventas
 * @returns {Promise<Array>}
 */
export async function getHistoricoVentas() {
  try {
    const response = await apiClient.get(`/ventas?sort=fecha:desc`);
    
    let ventasData = [];
    if (Array.isArray(response.data)) {
      ventasData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      ventasData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return [];
    }

    return ventasData.map(venta => ({
      ...venta,
      monto: typeof venta.monto === 'string' ? parseFloat(venta.monto) : venta.monto,
      fecha: venta.fecha ? new Date(venta.fecha) : null
    }));
  } catch (error) {
    console.error("Error en getHistoricoVentas:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener el histórico de ventas');
  }
}

/**
 * Obtiene las estadísticas del dashboard
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  try {
    const response = await apiClient.get("/dashboard/stats");
    return response;
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener las estadísticas');
  }
}

/**
 * Crea una nueva venta
 * @param {Object} venta - Datos de la venta a crear
 * @returns {Promise<Object>} Promise con los datos de la venta creada
 */
export async function createVenta(venta) {
  try {
    const response = await apiClient.post("/ventas", venta);
    return response.data;
  } catch (error) {
    console.error("Error en createVenta:", error);
    throw new Error(error.response?.data?.message || 'Error al crear la venta');
  }
}

// Puedes agregar aquí más funciones relacionadas a ventas en el futuro