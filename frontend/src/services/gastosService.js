import apiClient from "./api";

/**
 * Obtiene los gastos del mes actual
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise<{gastos: Array, totalMes: number}>}
 */
export async function getGastosDelMes(page = 1, limit = 10) {
  try {
    const response = await apiClient.get(`/gastos?page=${page}&limit=${limit}&sort=fecha:desc`);
    
    // Asegurarnos de que devolvemos un array
    let gastosData = [];
    if (Array.isArray(response.data)) {
      gastosData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      gastosData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return { gastos: [], totalMes: 0 };
    }

    // Procesar los datos para asegurar que los montos sean números
    const gastosProcesados = gastosData.map(gasto => ({
      ...gasto,
      monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto,
      fecha: gasto.fecha ? new Date(gasto.fecha) : null
    }));

    // Calcular el total del mes
    const totalMes = gastosProcesados.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);

    return {
      gastos: gastosProcesados,
      totalMes: parseFloat(totalMes.toFixed(2))
    };
  } catch (error) {
    console.error("Error en getGastosDelMes:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener los gastos del mes');
  }
}

/**
 * Obtiene el histórico completo de gastos
 * @returns {Promise<Array>}
 */
export async function getHistoricoGastos() {
  try {
    const response = await apiClient.get(`/gastos?sort=fecha:desc`);
    
    let gastosData = [];
    if (Array.isArray(response.data)) {
      gastosData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      gastosData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return [];
    }

    return gastosData.map(gasto => ({
      ...gasto,
      monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto,
      fecha: gasto.fecha ? new Date(gasto.fecha) : null
    }));
  } catch (error) {
    console.error("Error en getHistoricoGastos:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener el histórico de gastos');
  }
}

/**
 * Obtiene las estadísticas de gastos por categoría
 * @returns {Promise<Object>}
 */
export async function getGastosPorCategoria() {
  try {
    const response = await apiClient.get("/gastos/categorias");
    return response.data;
  } catch (error) {
    console.error("Error en getGastosPorCategoria:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener gastos por categoría');
  }
}

/**
 * Crea un nuevo gasto
 * @param {Object} gasto - Datos del gasto a crear
 * @returns {Promise<Object>}
 */
export async function crearGasto(gasto) {
  try {
    // Validar datos requeridos
    if (!gasto.fecha || !gasto.monto || !gasto.descripcion) {
      throw new Error('Faltan datos requeridos: fecha, monto y descripción son obligatorios');
    }

    // Preparar los datos del gasto
    const gastoData = {
      fecha: new Date(gasto.fecha).toISOString().split('T')[0],
      monto: parseFloat(gasto.monto),
      descripcion: gasto.descripcion,
      categoria: gasto.categoria || 'General',
      forma_pago: gasto.forma_pago || 'efectivo'
    };

    const response = await apiClient.post("/gastos", gastoData);
    
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }

    return response;
  } catch (error) {
    console.error("Error en crearGasto:", error);
    throw new Error(error.response?.data?.message || 'Error al crear el gasto');
  }
}

/**
 * Obtiene las estadísticas del dashboard
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  try {
    const response = await apiClient.get("/gastos/stats");
    return response.data;
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener las estadísticas');
  }
}

// Puedes agregar aquí más funciones relacionadas a gastos en el futuro
