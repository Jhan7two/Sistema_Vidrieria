-- Triggers para automatizar operaciones - Procedimientos que se ejecutan automáticamente cuando ocurren ciertos eventos

-- Crear tabla para log de errores
DROP TABLE IF EXISTS log_errores;
CREATE TABLE log_errores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origen VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha DATETIME NOT NULL,
  detalles TEXT NULL
);

-- 1. Trigger para crear venta automáticamente al registrar un cobro
-- Este trigger se ejecuta después de insertar un nuevo registro en la tabla cobros
DELIMITER $$
CREATE TRIGGER after_cobro_insert
AFTER INSERT ON cobros -- Se activa después de cada inserción en la tabla cobros
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  DECLARE trabajo_cliente_id INT; -- Variable para almacenar el ID del cliente asociado al trabajo
  DECLARE tipo_venta ENUM('adelanto', 'pago final', 'venta completa'); -- Variable para determinar el tipo de venta
  
  -- Obtener el cliente_id del trabajo asociado al cobro
  SELECT cliente_id INTO trabajo_cliente_id 
  FROM trabajos 
  WHERE id = NEW.trabajo_id;
  
  -- Determinar tipo de venta basado en el texto de la observación del cobro
  IF LOWER(NEW.observacion) LIKE '%adelanto%' THEN -- Si contiene la palabra 'adelanto'
    SET tipo_venta = 'adelanto';
  ELSEIF LOWER(NEW.observacion) LIKE '%final%' THEN -- Si contiene la palabra 'final'
    SET tipo_venta = 'pago final';
  ELSE -- En cualquier otro caso
    SET tipo_venta = 'venta completa';
  END IF;
  
  -- Crear automáticamente un registro de venta con los datos del cobro
  INSERT INTO ventas (fecha, monto, tipo, descripcion, cliente_id, trabajo_id, cobro_id)
  VALUES (
    NEW.fecha, -- Usa la misma fecha del cobro
    NEW.monto, -- Usa el mismo monto del cobro
    tipo_venta, -- Usa el tipo determinado anteriormente
    CONCAT('Cobro: ', IFNULL(NEW.observacion, '')), -- Crea una descripción basada en la observación
    trabajo_cliente_id, -- Asocia la venta al cliente del trabajo
    NEW.trabajo_id, -- Asocia la venta al mismo trabajo
    NEW.id -- Asocia la venta al cobro que la generó
  );
END$$
DELIMITER ;

-- 2. Trigger para actualizar estado de trabajo cuando se completa el pago
-- Este trigger actualiza automáticamente el estado de un trabajo cuando se registra un cobro
DELIMITER $$
CREATE TRIGGER after_cobro_update_trabajo
AFTER INSERT ON cobros -- Se activa después de cada inserción en la tabla cobros
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  DECLARE total_cobrado DECIMAL(10,2); -- Variable para almacenar la suma total de cobros del trabajo
  DECLARE costo_total_trabajo DECIMAL(10,2); -- Variable para almacenar el costo total del trabajo
  DECLARE estado_actual VARCHAR(20); -- Variable para almacenar el estado actual del trabajo
  
  -- Obtener el estado actual del trabajo asociado al cobro
  SELECT estado INTO estado_actual
  FROM trabajos
  WHERE id = NEW.trabajo_id;
  
  -- Solo proceder si el trabajo no está ya marcado como terminado
  IF estado_actual != 'terminado' THEN
    -- Calcular el total cobrado hasta ahora para este trabajo (incluyendo el nuevo cobro)
    SELECT SUM(monto) INTO total_cobrado
    FROM cobros
    WHERE trabajo_id = NEW.trabajo_id;
    
    -- Obtener el costo total establecido para el trabajo
    SELECT costo_total INTO costo_total_trabajo
    FROM trabajos
    WHERE id = NEW.trabajo_id;

    -- Si el total cobrado cubre o supera el costo total y el trabajo estaba en estado 'inicio',
    -- actualizar automáticamente a estado 'proceso'
    -- No cambiamos directamente a 'terminado' para permitir confirmar manualmente la finalización
    IF total_cobrado >= costo_total_trabajo AND estado_actual = 'inicio' THEN
      UPDATE trabajos
      SET estado = 'proceso'
      WHERE id = NEW.trabajo_id;
    END IF;
  END IF;
END$$
DELIMITER ;

-- 3. Trigger para verificar inventario antes de iniciar un trabajo (ejemplo)
-- Este es un trigger de ejemplo que muestra cómo se podrían implementar validaciones adicionales
DELIMITER $$
CREATE TRIGGER before_trabajo_insert
BEFORE INSERT ON trabajos -- Se activa antes de cada inserción en la tabla trabajos
FOR EACH ROW -- Se ejecuta una vez por cada fila que se va a insertar
BEGIN
  -- Aquí podrías agregar lógica para verificar disponibilidad de materiales
  -- o realizar otras validaciones antes de permitir la creación de un trabajo
  
  -- Por ejemplo, podrías verificar si hay suficiente stock para ciertos productos
  -- o si el cliente tiene pagos pendientes antes de aceptar nuevos trabajos
  
  -- Este es solo un trigger de ejemplo que no realiza ninguna acción real
  -- Simplemente agrega una marca '[Verificado]' a las observaciones del trabajo
  SET NEW.observaciones = CONCAT(IFNULL(NEW.observaciones, ''), ' [Verificado]');
END$$
DELIMITER ;

-- 4. Trigger para registrar ventas en la tabla caja
-- Este trigger se ejecuta después de insertar un nuevo registro en la tabla ventas
DELIMITER $$
CREATE TRIGGER after_venta_insert
AFTER INSERT ON ventas -- Se activa después de cada inserción en la tabla ventas
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  -- Variables para almacenar datos necesarios
  DECLARE forma_pago_usada ENUM('efectivo','transferencia', 'otro');
  DECLARE usuario_actual INT;
  DECLARE saldo_actual DECIMAL(10,2);
  
  -- Obtener el último saldo de caja
  SELECT IFNULL(MAX(saldo_resultante), 0) INTO saldo_actual FROM caja;
  
  -- Determinar forma de pago (podría obtenerse del cobro asociado si existe)
  SET forma_pago_usada = 'efectivo'; -- Valor predeterminado
  
  -- Obtener el usuario actual (podría ser el usuario de sesión o un valor predeterminado)
  -- Aquí usamos 1 como ejemplo, pero debería ser el ID del usuario que realiza la operación
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
    NOW(), -- Fecha y hora actual
    'entrada', -- Las ventas son entradas de dinero
    CASE NEW.tipo
      WHEN 'adelanto' THEN 'Adelanto'
      WHEN 'pago final' THEN 'Pago final'
      ELSE 'Venta completa'
    END,
    NEW.monto, -- Mismo monto de la venta
    saldo_actual + NEW.monto, -- Calcula el nuevo saldo
    NEW.descripcion, -- Misma descripción
    NEW.id, -- ID de la venta como referencia
    'venta', -- Tipo de referencia
    forma_pago_usada, -- Forma de pago determinada anteriormente
    usuario_actual, -- Usuario que realiza la operación
    CONCAT('Venta ID: ', NEW.id, IF(NEW.trabajo_id IS NOT NULL, CONCAT(', Trabajo ID: ', NEW.trabajo_id), ''))
  );
END$$
DELIMITER ;

-- 5. Trigger para registrar gastos en la tabla caja
-- Este trigger se ejecuta después de insertar un nuevo registro en la tabla gastos
DELIMITER $$
CREATE TRIGGER after_gasto_insert
AFTER INSERT ON gastos -- Se activa después de cada inserción en la tabla gastos
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  -- Variables para almacenar datos necesarios
  DECLARE usuario_actual INT;
  DECLARE saldo_actual DECIMAL(10,2);
  
  -- Obtener el último saldo de caja
  SELECT IFNULL(MAX(saldo_resultante), 0) INTO saldo_actual FROM caja;
  
  -- Obtener el usuario actual (podría ser el usuario de sesión o un valor predeterminado)
  -- Aquí usamos 1 como ejemplo, pero debería ser el ID del usuario que realiza la operación
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
    NOW(), -- Fecha y hora actual
    'salida', -- Los gastos son salidas de dinero
    IFNULL(NEW.categoria, 'Gasto general'), -- Concepto basado en la categoría
    NEW.monto, -- Mismo monto del gasto
    saldo_actual - NEW.monto, -- Calcula el nuevo saldo (resta)
    NEW.descripcion, -- Misma descripción
    NEW.id, -- ID del gasto como referencia
    'gasto', -- Tipo de referencia
    'efectivo', -- Forma de pago predeterminada
    usuario_actual, -- Usuario que realiza la operación
    CONCAT('Gasto ID: ', NEW.id, IF(NEW.categoria IS NOT NULL, CONCAT(', Categoría: ', NEW.categoria), ''))
  );
END$$
DELIMITER ;

-- Actualizar el trigger de cobros para actualizar automáticamente el monto_pagado y estado_pago
DELIMITER $$
CREATE TRIGGER after_cobro_insert_updated
AFTER INSERT ON cobros
FOR EACH ROW
BEGIN
  DECLARE total_cobrado DECIMAL(10,2);
  DECLARE costo_total_trabajo DECIMAL(10,2);
  
  -- Calcular el total cobrado hasta ahora para este trabajo (incluyendo el nuevo cobro)
  SELECT SUM(monto) INTO total_cobrado
  FROM cobros
  WHERE trabajo_id = NEW.trabajo_id;
  
  -- Obtener el costo total establecido para el trabajo
  SELECT costo_total INTO costo_total_trabajo
  FROM trabajos
  WHERE id = NEW.trabajo_id;
  
  -- Actualizar el monto_pagado en la tabla trabajos
  UPDATE trabajos
  SET 
    monto_pagado = total_cobrado,
    -- Actualizar automáticamente el estado_pago según el monto pagado
    estado_pago = CASE 
      WHEN total_cobrado >= costo_total_trabajo THEN 'Pagado'
      WHEN total_cobrado > 0 THEN 'Parcial'
      ELSE 'Pendiente'
    END
  WHERE id = NEW.trabajo_id;
  
  -- Si el estado_trabajo es 'Completado' y ahora está pagado totalmente, cambiar a 'Entregado'
  IF total_cobrado >= costo_total_trabajo THEN
    UPDATE trabajos
    SET estado_trabajo = IF(estado_trabajo = 'Completado', 'Entregado', estado_trabajo)
    WHERE id = NEW.trabajo_id AND estado_trabajo = 'Completado';
  END IF;
END$$
DELIMITER ;

-- Crear vistas para facilitar el acceso a los datos de trabajos
CREATE VIEW vista_trabajos AS
SELECT 
  t.id,
  t.descripcion,
  t.tipo,
  t.fecha_programada,
  t.fecha_inicio,
  t.fecha_finalizacion,
  t.fecha_entrega,
  t.estado_trabajo,
  t.direccion_trabajo,
  t.costo_total,
  t.monto_pagado,
  t.saldo_pendiente,
  t.estado_pago,
  t.observaciones,
  c.nombre AS nombre_cliente,
  c.telefono AS telefono_cliente,
  c.direccion AS direccion_cliente
FROM 
  trabajos t
LEFT JOIN 
  clientes c ON t.cliente_id = c.id

-- Crear vista para trabajos pendientes por fecha programada
CREATE VIEW trabajos_pendientes AS
SELECT *
FROM vista_trabajos
WHERE estado_trabajo IN ('Programado', 'En Progreso', 'En Espera')
ORDER BY fecha_programada;

-- 6. Trigger para registrar movimientos de ENTRADA de caja en la tabla ventas
-- Este trigger se ejecuta después de insertar un movimiento de entrada en la tabla caja
DELIMITER $$
CREATE TRIGGER after_caja_insert_entrada
AFTER INSERT ON caja -- Se activa después de cada inserción en la tabla caja
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  -- Verificar que estamos dentro de una transacción para operaciones seguras
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Registrar el error para diagnóstico
    INSERT INTO log_errores (origen, mensaje, fecha)
    VALUES ('Trigger after_caja_insert_entrada', 'Error al procesar movimiento de entrada', NOW());
    
    -- No hacemos ROLLBACK aquí porque los triggers están dentro de la transacción del controlador
  END;

  -- Solo procesar si es un movimiento de entrada y no proviene de una venta existente
  IF NEW.tipo_movimiento = 'entrada' AND (NEW.tipo_referencia IS NULL OR NEW.tipo_referencia != 'venta') THEN
    -- Insertar un registro en la tabla ventas
    INSERT INTO ventas (
      fecha,
      monto,
      tipo,
      descripcion,
      cliente_id,
      forma_pago
    ) VALUES (
      NEW.fecha_hora, -- Usa la misma fecha del movimiento de caja
      NEW.monto, -- Usa el mismo monto
      'venta completa', -- Tipo predeterminado
      CONCAT('Ingreso de caja: ', IFNULL(NEW.concepto, 'Sin concepto')), -- Descripción basada en el concepto
      NULL, -- No hay cliente asociado para movimientos directos
      NEW.forma_pago -- Utiliza la forma de pago registrada en caja
    );
    
    -- Actualizar la referencia en caja para indicar que está vinculado a una venta
    UPDATE caja
    SET 
      referencia_id = LAST_INSERT_ID(),
      tipo_referencia = 'venta'
    WHERE id = NEW.id;
  END IF;
END$$
DELIMITER ;

-- 7. Trigger para registrar movimientos de SALIDA de caja en la tabla gastos
-- Este trigger se ejecuta después de insertar un movimiento de salida en la tabla caja
DELIMITER $$
CREATE TRIGGER after_caja_insert_salida
AFTER INSERT ON caja -- Se activa después de cada inserción en la tabla caja
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  -- Verificar que estamos dentro de una transacción para operaciones seguras
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Registrar el error para diagnóstico
    INSERT INTO log_errores (origen, mensaje, fecha)
    VALUES ('Trigger after_caja_insert_salida', 'Error al procesar movimiento de salida', NOW());
    
    -- No hacemos ROLLBACK aquí porque los triggers están dentro de la transacción del controlador
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
      NEW.fecha_hora, -- Usa la misma fecha del movimiento de caja
      NEW.monto, -- Usa el mismo monto
      NEW.concepto, -- Usa el concepto como categoría
      IFNULL(NEW.descripcion, 'Egreso registrado desde caja') -- Descripción o valor predeterminado
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