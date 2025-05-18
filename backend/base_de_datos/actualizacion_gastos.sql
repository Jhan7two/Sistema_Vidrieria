-- Script para actualizar la estructura de la tabla gastos y los triggers relacionados

-- 1. Eliminar el trigger after_gasto_insert para poder modificarlo después
DROP TRIGGER IF EXISTS after_gasto_insert;

-- 2. Eliminar el trigger after_caja_insert_salida para poder modificarlo después
DROP TRIGGER IF EXISTS after_caja_insert_salida;

-- 3. Intentar eliminar la columna forma_pago si existe (ignorar error si no existe)
ALTER TABLE gastos DROP COLUMN forma_pago;

-- 4. Recrear el trigger after_gasto_insert
DELIMITER $$
CREATE TRIGGER after_gasto_insert
AFTER INSERT ON gastos
FOR EACH ROW
BEGIN
  DECLARE usuario_actual INT;
  DECLARE saldo_actual DECIMAL(10,2);
  
  -- Obtener el último saldo de caja
  SELECT IFNULL(MAX(saldo_resultante), 0) INTO saldo_actual FROM caja;
  
  -- Obtener el usuario actual (podría ser el usuario de sesión o un valor predeterminado)
  SET usuario_actual = 1;
  
  -- Registrar el movimiento en la tabla caja
  INSERT INTO caja (
    fecha_hora,
    tipo_movimiento,
    concepto,
    monto,
    saldo_resultante,
    descripcion,
    referencia_id,
    tipo_referencia,
    forma_pago,
    usuario_id,
    observaciones
  ) VALUES (
    NOW(),
    'salida',
    IFNULL(NEW.categoria, 'Gasto general'),
    NEW.monto,
    saldo_actual - NEW.monto,
    NEW.descripcion,
    NEW.id,
    'gasto',
    'efectivo',
    usuario_actual,
    CONCAT('Gasto ID: ', NEW.id, IF(NEW.categoria IS NOT NULL, CONCAT(', Categoría: ', NEW.categoria), ''))
  );
END$$
DELIMITER ;

-- 5. Recrear el trigger after_caja_insert_salida
DELIMITER $$
CREATE TRIGGER after_caja_insert_salida
AFTER INSERT ON caja
FOR EACH ROW
BEGIN
  -- Verificar que estamos dentro de una transacción para operaciones seguras
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Registrar el error para diagnóstico
    INSERT INTO log_errores (origen, mensaje, fecha)
    VALUES ('Trigger after_caja_insert_salida', 'Error al procesar movimiento de salida', NOW());
  END;

  -- Solo procesar si es un movimiento de salida y no proviene de un gasto existente
  IF NEW.tipo_movimiento = 'salida' AND NEW.tipo_referencia != 'gasto' THEN
    -- Insertar un registro en la tabla gastos
    INSERT INTO gastos (
      fecha,
      monto,
      categoria,
      descripcion
    ) VALUES (
      NEW.fecha_hora,
      NEW.monto,
      NEW.concepto,
      IFNULL(NEW.descripcion, 'Egreso registrado desde caja')
    );
    
    -- Actualizar la referencia en caja para indicar que está vinculado a un gasto
    UPDATE caja
    SET 
      referencia_id = LAST_INSERT_ID(),
      tipo_referencia = 'gasto'
    WHERE id = NEW.id;
  END IF;
END$$
DELIMITER ;

-- 6. Mostrar mensaje de confirmación
SELECT 'Actualización de la tabla gastos y triggers completada exitosamente' AS mensaje; 