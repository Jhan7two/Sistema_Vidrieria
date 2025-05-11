import apiClient from "./api";

// Servicio especializado para gastos
export async function getGastosDelMes() {
  const response = await apiClient.get("/gastos/mes");
  // Se espera que el backend devuelva un objeto con { totalMes, gastos: [{ dia, monto, descripcion, categoria }] }
  return response;
}

export async function getGastosPorCategoria() {
  const response = await apiClient.get("/gastos/categorias");
  return response;
}

export async function getDashboardStats() {
  const response = await apiClient.get("/gastos/stats");
  return response.data;
}

// Puedes agregar aquí más funciones relacionadas a gastos en el futuro
