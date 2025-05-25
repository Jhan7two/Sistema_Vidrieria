import apiClient from "./api";

// Servicio especializado para ventas del mes (usado en dashboard)
export async function getVentasDelMes(page = 1, limit = 10) {
  try {
    const response = await apiClient.get(`/ventas?page=${page}&limit=${limit}&sort=fecha:desc`);
    console.log('Respuesta completa de ventas:', response);
    
    // Asegurarnos de que devolvemos un array
    let ventasData = [];
    if (response.data && Array.isArray(response.data)) {
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
      monto: typeof venta.monto === 'string' ? parseFloat(venta.monto) : venta.monto
    }));

    // Calcular el total del mes
    const totalMes = ventasProcesadas.reduce((sum, venta) => sum + venta.monto, 0);

    return {
      ventas: ventasProcesadas,
      totalMes: totalMes
    };
  } catch (error) {
    console.error("Error en getVentasDelMes:", error);
    throw error;
  }
}

// Servicio para obtener el histórico completo de ventas (usado en panel de control)
export async function getHistoricoVentas() {
  try {
    const response = await apiClient.get(`/ventas?sort=fecha:desc`);
    console.log('Respuesta completa de histórico de ventas:', response);
    
    let ventasData = [];
    if (response.data && Array.isArray(response.data)) {
      ventasData = response.data;
    } else if (Array.isArray(response.data?.data)) {
      ventasData = response.data.data;
    } else {
      console.warn('Formato de respuesta inesperado:', response);
      return [];
    }

    return ventasData.map(venta => ({
      ...venta,
      monto: typeof venta.monto === 'string' ? parseFloat(venta.monto) : venta.monto
    }));
  } catch (error) {
    console.error("Error en getHistoricoVentas:", error);
    throw error;
  }
}

export async function getDashboardStats() {
  try {
    const response = await apiClient.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    throw error;
  }
}

// Puedes agregar aquí más funciones relacionadas a ventas en el futuro