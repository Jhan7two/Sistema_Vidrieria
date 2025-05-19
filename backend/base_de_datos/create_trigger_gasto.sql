-- Script para crear el trigger after_gasto_insert
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