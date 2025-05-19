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
    
    return response;
  } catch (error) {
    console.error("ERROR en crearGasto:", error);
    throw error; // Relanzamos el error para que se maneje en el componente
  }
}

// Puedes agregar aquí más funciones relacionadas a gastos en el futuro
