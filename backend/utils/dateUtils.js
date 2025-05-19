/**
 * Utilidades para el manejo de fechas con zona horaria de Bolivia (GMT-4)
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Bolivia (America/La_Paz)
 * @returns {Date} Objeto Date ajustado a la zona horaria de Bolivia
 */
const getBoliviaDateTime = () => {
  // CORRECCIÓN: La fecha se está guardando con 4 horas de más en la base de datos
  // Necesitamos restar 4 horas para compensar
  const now = new Date();
  return new Date(now.getTime() - (4 * 60 * 60 * 1000));
};

/**
 * Convierte una fecha a formato de Bolivia (America/La_Paz)
 * @param {Date} date - Fecha a convertir
 * @returns {Date} - Fecha convertida a la zona horaria de Bolivia
 */
const convertToBoliviaTime = (date) => {
  if (!date) return null;
  
  // CORRECCIÓN: Necesitamos restar 4 horas para compensar el problema de zona horaria
  return new Date(new Date(date).getTime() - (4 * 60 * 60 * 1000));
};

/**
 * Obtiene la fecha de inicio del día actual en Bolivia
 * @returns {Date} - Fecha de inicio del día en Bolivia
 */
const getBoliviaStartOfDay = () => {
  // Obtener la fecha actual ajustada para Bolivia
  const boliviaDate = getBoliviaDateTime();
  console.log('Fecha actual en Bolivia:', boliviaDate.toString());
  
  // Crear una fecha que represente las 00:00:00 del día actual en Bolivia
  const startDate = new Date(
    boliviaDate.getFullYear(),
    boliviaDate.getMonth(),
    boliviaDate.getDate(),
    0, 0, 0, 0
  );
  console.log('Inicio del día en hora local:', startDate.toString());
  
  return startDate;
};

/**
 * Obtiene la fecha de fin del día actual en Bolivia
 * @returns {Date} - Fecha de fin del día en Bolivia
 */
const getBoliviaEndOfDay = () => {
  // Obtener la fecha actual ajustada para Bolivia
  const boliviaDate = getBoliviaDateTime();
  
  // Crear una fecha que represente las 23:59:59.999 del día actual en Bolivia
  const endDate = new Date(
    boliviaDate.getFullYear(),
    boliviaDate.getMonth(),
    boliviaDate.getDate(),
    23, 59, 59, 999
  );
  console.log('Fin del día en hora local:', endDate.toString());
  
  return endDate;
};

module.exports = {
  getBoliviaDateTime,
  convertToBoliviaTime,
  getBoliviaStartOfDay,
  getBoliviaEndOfDay
}; 