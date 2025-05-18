/**
 * Utilidades para el manejo de fechas con zona horaria de Bolivia (GMT-4)
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Bolivia (America/La_Paz)
 * @returns {Date} Objeto Date ajustado a la zona horaria de Bolivia
 */
const getBoliviaDateTime = () => {
  // Obtener la fecha y hora actual en UTC
  const now = new Date();
  
  // Restar 4 horas para convertir a GMT-4 (Bolivia)
  // Bolivia está en UTC-4, por lo que restamos 4 horas
  return new Date(now.getTime() - (4 * 60 * 60 * 1000));
};

/**
 * Convierte una fecha a formato de Bolivia (America/La_Paz)
 * @param {Date} date - Fecha a convertir
 * @returns {Date} - Fecha convertida a la zona horaria de Bolivia
 */
const convertToBoliviaTime = (date) => {
  if (!date) return null;
  
  // Obtener el timestamp y restar 4 horas
  return new Date(date.getTime() - (4 * 60 * 60 * 1000));
};

/**
 * Obtiene la fecha de inicio del día actual en Bolivia
 * @returns {Date} - Fecha de inicio del día en Bolivia
 */
const getBoliviaStartOfDay = () => {
  // Obtener la fecha actual en Bolivia
  const boliviaDate = getBoliviaDateTime();
  console.log('Fecha actual en Bolivia:', boliviaDate.toString());
  console.log('Día de Bolivia:', boliviaDate.getDate());
  console.log('Día de la semana en Bolivia (0=Dom, 1=Lun):', boliviaDate.getDay());
  
  // Crear una fecha que represente las 00:00:00 del día actual en Bolivia
  // Usamos getFullYear(), getMonth() y getDate() de la fecha en Bolivia
  const startDate = new Date(
    boliviaDate.getFullYear(),
    boliviaDate.getMonth(),
    boliviaDate.getDate(),
    0, 0, 0, 0
  );
  console.log('Inicio del día en hora local:', startDate.toString());
  
  // Convertir a UTC para la base de datos (añadir 4 horas)
  const utcStartDate = new Date(startDate.getTime() + (4 * 60 * 60 * 1000));
  console.log('Inicio del día en UTC:', utcStartDate.toString());
  console.log('Inicio del día en ISO:', utcStartDate.toISOString());
  
  return utcStartDate;
};

/**
 * Obtiene la fecha de fin del día actual en Bolivia
 * @returns {Date} - Fecha de fin del día en Bolivia
 */
const getBoliviaEndOfDay = () => {
  // Obtener la fecha actual en Bolivia
  const boliviaDate = getBoliviaDateTime();
  
  // Crear una fecha que represente las 23:59:59.999 del día actual en Bolivia
  const endDate = new Date(
    boliviaDate.getFullYear(),
    boliviaDate.getMonth(),
    boliviaDate.getDate(),
    23, 59, 59, 999
  );
  console.log('Fin del día en hora local:', endDate.toString());
  
  // Convertir a UTC para la base de datos (añadir 4 horas)
  const utcEndDate = new Date(endDate.getTime() + (4 * 60 * 60 * 1000));
  console.log('Fin del día en UTC:', utcEndDate.toString());
  console.log('Fin del día en ISO:', utcEndDate.toISOString());
  
  return utcEndDate;
};

module.exports = {
  getBoliviaDateTime,
  convertToBoliviaTime,
  getBoliviaStartOfDay,
  getBoliviaEndOfDay
}; 