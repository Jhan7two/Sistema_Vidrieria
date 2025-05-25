import apiClient from "./api";

// Servicio especializado para gastos del mes (usado en dashboard)
export async function getGastosDelMes(page = 1, limit = 10) {
  try {
    const response = await apiClient.get(`/gastos?page=${page}&limit=${limit}&sort=fecha:desc`);
    console.log('Respuesta completa de gastos:', response);
    
    // Asegurarnos de que devolvemos un array
    let gastosData = [];
    if (response.data && Array.isArray(response.data)) {
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
      monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto
    }));

    // Calcular el total del mes
    const totalMes = gastosProcesados.reduce((sum, gasto) => sum + gasto.monto, 0);

    return {
      gastos: gastosProcesados,
      totalMes: totalMes
    };
  } catch (error) {
    console.error("Error en getGastosDelMes:", error);
    throw error;
  }
}

// Servicio para obtener el histórico completo de gastos (usado en panel de control)
export async function getHistoricoGastos() {
  try {
    const response = await apiClient.get(`/gastos?sort=fecha:desc`);
    console.log('Respuesta completa de histórico de gastos:', response);
    
    let gastosData = [];
    if (response.data && Array.isArray(response.data)) {
      gastosData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      gastosData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return [];
    }

    return gastosData.map(gasto => ({
      ...gasto,
      monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto
    }));
  } catch (error) {
    console.error("Error en getHistoricoGastos:", error);
    throw error;
  }
}

export async function getGastosPorCategoria() {
  try {
    const response = await apiClient.get("/gastos/categorias");
    return response.data;
  } catch (error) {
    console.error("Error en getGastosPorCategoria:", error);
    throw error;
  }
}

export async function getDashboardStats() {
  try {
    const response = await apiClient.get("/gastos/stats");
    return response.data;
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    throw error;
  }
}

// Función para crear un nuevo gasto
export async function crearGasto(gasto) {
  try {
    // Asegurarse de que el monto sea un número
    if (gasto.monto && typeof gasto.monto === 'string') {
      gasto.monto = parseFloat(gasto.monto);
    }
    
    console.log("Datos enviados a /gastos:", gasto);
    const response = await apiClient.post("/gastos", gasto);
    console.log("Respuesta del endpoint /gastos:", response);
    
    return response.data;
  } catch (error) {
    console.error("ERROR en crearGasto:", error);
    throw error;
  }
}

// Puedes agregar aquí más funciones relacionadas a gastos en el futuro
