import apiClient from "./api";

// Servicio especializado para ventas
export async function getVentasDelMes() {
  const response = await apiClient.get("/ventas/mes");
  // Se espera que el backend devuelva un objeto con { totalMes, ventas: [{ dia, monto }] }
  return response;
}

export async function getDashboardStats() {
  const response = await apiClient.get("/dashboard/stats");
  return response.data;
}

// Puedes agregar aquí más funciones relacionadas a ventas en el futuro