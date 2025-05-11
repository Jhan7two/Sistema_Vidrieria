import apiClient from "./api";
import { getDashboardStats } from "./ventasService";
export { getVentasDelMes } from "./ventasService";

// Mock temporal para desarrollo frontend sin backend
// export async function getDashboardStats() {
//   return {
//     ventas: 120,
//     ingresos: 15000,
//     clientes: 35,
//     productos: 80
//   }
// }

// export async function getDashboardSummary() {
//   return {
//     totalVentas: 120,
//     totalIngresos: 15000,
//     totalClientes: 35,
//     totalProductos: 80
//   }
// }

// export async function getDashboardData() {
//   return {
//     ventas: 120,
//     ingresos: 15000,
//     clientes: 35,
//     productos: 80,
//     salesData: { totalMonth: 5000 }
//   }
// }

// export async function getRecentSales(limit = 5) {
//   return [
//     { id: 1, date: '2024-06-01', description: 'Venta A', amount: 1000 },
//     { id: 2, date: '2024-06-02', description: 'Venta B', amount: 2000 },
//     { id: 3, date: '2024-06-03', description: 'Venta C', amount: 1500 },
//     { id: 4, date: '2024-06-04', description: 'Venta D', amount: 800 },
//     { id: 5, date: '2024-06-05', description: 'Venta E', amount: 1200 }
//   ].slice(0, limit)
// }

// Elimina la función getVentasDelMes de aquí, ya que ahora está en ventasService.js
// export async function getVentasDelMes() {
//   const response = await apiClient.get("/ventas/mes");
//   // Se espera que el backend devuelva un objeto con { totalMes, ventas: [{ dia, monto }] }
//   return response.data;
// }

// export async function getRecentExpenses(limit = 5) {
//   return [
//     { id: 1, date: '2024-06-01', description: 'Compra vidrio', amount: 300 },
//     { id: 2, date: '2024-06-02', description: 'Pago luz', amount: 150 },
//     { id: 3, date: '2024-06-03', description: 'Pago agua', amount: 100 },
//     { id: 4, date: '2024-06-04', description: 'Compra herramientas', amount: 400 },
//     { id: 5, date: '2024-06-05', description: 'Pago alquiler', amount: 800 }
//   ].slice(0, limit)
// }

// AVISO: Descomenta las funciones originales y la importación de apiClient cuando el backend esté disponible.
// Puedes agregar más funciones según los endpoints del backend
export { getDashboardStats };