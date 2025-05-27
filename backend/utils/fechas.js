// Función para ajustar fechas a la zona horaria de Bolivia (UTC-4)
const ajustarFechaBolivia = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  // Ajustar a UTC-4 (Bolivia)
  fecha.setHours(fecha.getHours() - 4);
  return fecha;
};

// Función para crear fechas en zona horaria de Bolivia (UTC-4)
const crearFechaBolivia = () => {
  const fecha = new Date();
  // Ajustar a UTC-4 (Bolivia)
  fecha.setHours(fecha.getHours() - 4);
  return fecha;
};

// Función para formatear fecha para mostrar (opcional)
const formatearFechaBolivia = (fecha) => {
  return fecha.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    hour12: false
  });
};

module.exports = {
  ajustarFechaBolivia,
  crearFechaBolivia,
  formatearFechaBolivia
}; 