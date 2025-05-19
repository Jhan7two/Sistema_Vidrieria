/**
 * Utilidades para el manejo de fechas con zona horaria de Bolivia (GMT-4) en el frontend
 */

/**
 * Verifica si una fecha ya está en zona horaria de Bolivia
 * @param {Date|String} date - Fecha a verificar
 * @returns {Boolean} - true si la fecha ya está en zona horaria de Bolivia
 */
export const isBoliviaTimeZone = (date) => {
  if (!date) return false;
  
  const dateStr = date.toString();
  return dateStr.includes('GMT-0400') || dateStr.includes('hora de Bolivia');
};

/**
 * Obtiene la fecha y hora actual en la zona horaria de Bolivia
 * @returns {Date} Objeto Date ajustado a la zona horaria de Bolivia
 */
export const getBoliviaDateTime = () => {
  // CORRECCIÓN: La fecha se está guardando con 4 horas de más en la base de datos
  // Necesitamos restar 4 horas para compensar
  const now = new Date();
  return new Date(now.getTime() - (4 * 60 * 60 * 1000));
};

/**
 * Convierte una fecha a formato de Bolivia (America/La_Paz)
 * @param {Date|String} date - Fecha a convertir
 * @returns {Date} - Fecha convertida a la zona horaria de Bolivia
 */
export const convertToBoliviaTime = (date) => {
  if (!date) return null;
  
  // Si es un string, convertir a Date
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Si ya está en zona horaria de Bolivia, no es necesario convertirla
  if (isBoliviaTimeZone(dateObj)) {
    return fixWeekday(dateObj);
  }
  
  // CORRECCIÓN: Necesitamos restar 4 horas para compensar el problema de zona horaria
  return fixWeekday(new Date(dateObj.getTime() - (4 * 60 * 60 * 1000)));
};

/**
 * Corrige el día de la semana para fechas con formato incorrecto
 * @param {Date} date - Fecha a corregir
 * @returns {Date} - Fecha con el día de la semana corregido
 */
export const fixWeekday = (date) => {
  if (!date) return null;
  
  // Obtenemos los componentes de la fecha
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Creamos una nueva fecha con los mismos componentes
  // Esto fuerza a recalcular el día de la semana correctamente
  return new Date(year, month, day, hours, minutes, seconds);
};

/**
 * Formatea una fecha para mostrarla en formato día/mes hora:minuto
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Fecha formateada
 */
export const formatDateDDMMHHMM = (date) => {
  if (!date) return '-';
  
  try {
    // Asegurarnos de que la fecha esté en hora de Bolivia y con el día de la semana correcto
    const fechaBolivia = convertToBoliviaTime(date);
    
    // Formatear la fecha manualmente
    const dia = fechaBolivia.getDate().toString().padStart(2, '0');
    const mes = (fechaBolivia.getMonth() + 1).toString().padStart(2, '0');
    const hora = fechaBolivia.getHours().toString().padStart(2, '0');
    const minuto = fechaBolivia.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes} ${hora}:${minuto}`;
  } catch (e) {
    console.error("Error formateando fecha:", e);
    return typeof date === 'string' ? date : '-';
  }
};

/**
 * Formatea una hora para mostrarla en formato hora:minuto
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Hora formateada
 */
export const formatTimeHHMM = (date) => {
  if (!date) return '-';
  
  try {
    // Asegurarnos de que la fecha esté en hora de Bolivia y con el día de la semana correcto
    const fechaBolivia = convertToBoliviaTime(date);
    
    // Formatear solo la hora
    const hora = fechaBolivia.getHours().toString().padStart(2, '0');
    const minuto = fechaBolivia.getMinutes().toString().padStart(2, '0');
    
    return `${hora}:${minuto}`;
  } catch (e) {
    console.error("Error formateando hora:", e);
    return typeof date === 'string' ? date : '-';
  }
}; 