
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cliente_nombre ON clientes(nombre);

CREATE TABLE trabajos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_inicio DATE,
  fecha_finalizacion DATE,
  fecha_entrega DATE,
  estado VARCHAR(20) DEFAULT 'inicio' CHECK (estado IN ('inicio', 'proceso', 'terminado')),
  direccion_trabajo TEXT,
  costo_total DECIMAL(10,2) NOT NULL,
  monto_pagado DECIMAL(10,2) DEFAULT 0.00,
  saldo_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (costo_total - monto_pagado) STORED,
  estado_pago VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente', 'Parcial', 'Pagado')),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trabajo_cliente ON trabajos(cliente_id);
CREATE INDEX idx_trabajo_estado ON trabajos(estado);
CREATE INDEX idx_trabajo_estado_pago ON trabajos(estado_pago);
CREATE INDEX idx_trabajo_fecha_programada ON trabajos(fecha_programada);
CREATE INDEX idx_trabajo_tipo ON trabajos(tipo);

CREATE TABLE cobros (
  id SERIAL PRIMARY KEY,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  tipo_pago VARCHAR(50) NOT NULL,
  observacion VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cobro_trabajo ON cobros(trabajo_id);
CREATE INDEX idx_cobro_fecha ON cobros(fecha);

CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('adelanto', 'pago final', 'venta completa')),
  descripcion TEXT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  trabajo_id INTEGER REFERENCES trabajos(id) ON DELETE SET NULL,
  cobro_id INTEGER UNIQUE REFERENCES cobros(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venta_fecha ON ventas(fecha);
CREATE INDEX idx_venta_cliente ON ventas(cliente_id);

CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gasto_fecha ON gastos(fecha);
CREATE INDEX idx_gasto_categoria ON gastos(categoria);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'vendedor', 'operario')),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuario_rol ON usuarios(rol);

CREATE TABLE caja (
  id SERIAL PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida')),
  concepto VARCHAR(50) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  saldo_resultante DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  referencia_id INTEGER,
  tipo_referencia VARCHAR(20) NOT NULL CHECK (tipo_referencia IN ('venta', 'gasto', 'cobro', 'ajuste')),
  forma_pago VARCHAR(20) NOT NULL CHECK (forma_pago IN ('efectivo', 'transferencia', 'otro')),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caja_fecha ON caja(fecha_hora);
CREATE INDEX idx_caja_usuario ON caja(usuario_id);
CREATE INDEX idx_caja_tipo ON caja(tipo_movimiento);
CREATE INDEX idx_caja_concepto ON caja(concepto);

CREATE TABLE cierres_caja (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  total_ventas DECIMAL(10,2) NOT NULL,
  total_gastos DECIMAL(10,2) NOT NULL,
  saldo_final DECIMAL(10,2) NOT NULL,
  observaciones TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cierre_fecha ON cierres_caja(fecha);
CREATE UNIQUE INDEX idx_cierre_fecha_unico ON cierres_caja(fecha);


CREATE TABLE log_errores (
  id SERIAL PRIMARY KEY,
  origen VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  detalles TEXT NULL
);

CREATE VIEW vista_trabajos AS
SELECT 
  t.id,
  t.descripcion,
  t.tipo,
  t.fecha_programada,
  t.fecha_inicio,
  t.fecha_finalizacion,
  t.fecha_entrega,
  t.estado,
  t.direccion_trabajo,
  t.costo_total,
  t.monto_pagado,
  t.saldo_pendiente,
  t.estado_pago,
  t.observaciones,
  c.nombre AS nombre_cliente,
  c.telefono AS telefono_cliente
FROM 
  trabajos t
LEFT JOIN 
  clientes c ON t.cliente_id = c.id;

CREATE VIEW trabajos_pendientes AS
SELECT *
FROM vista_trabajos
WHERE estado IN ('inicio', 'proceso')
ORDER BY fecha_programada;

-- 2. Trigger para actualizar estado de trabajo cuando se completa el pago
DELIMITER $$
CREATE TRIGGER after_cobro_update_trabajo
AFTER INSERT ON cobros
FOR EACH ROW
BEGIN
  DECLARE total_cobrado DECIMAL(10,2);
  DECLARE costo_total_trabajo DECIMAL(10,2);
  DECLARE estado_actual VARCHAR(20);
  
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
    IF total_cobrado >= costo_total_trabajo AND estado_actual = 'inicio' THEN
      UPDATE trabajos
      SET estado = 'proceso'
      WHERE id = NEW.trabajo_id;
    END IF;
  END IF;
END$$
DELIMITER ;

-- 4. Trigger para registrar gastos en la tabla caja
DELIMITER $$
CREATE TRIGGER after_gasto_insert
AFTER INSERT ON gastos
FOR EACH ROW
BEGIN
  DECLARE usuario_actual INT;
  DECLARE saldo_actual DECIMAL(10,2);
  
  -- Obtener el último saldo de caja
  SELECT IFNULL(MAX(saldo_resultante), 0) INTO saldo_actual FROM caja;
  
  -- Obtener el usuario actual (predeterminado)
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

-- 5. Actualizar el trigger de cobros para actualizar automáticamente el monto_pagado y estado_pago
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
  
  -- Si el estado es 'proceso' y ahora está pagado totalmente, cambiar a 'terminado'
  IF total_cobrado >= costo_total_trabajo THEN
    UPDATE trabajos
    SET estado = IF(estado = 'proceso', 'terminado', estado)
    WHERE id = NEW.trabajo_id AND estado = 'proceso';
  END IF;
END$$
DELIMITER ;

-- 6. Trigger para registrar movimientos de ENTRADA de caja en la tabla ventas
DELIMITER $$
CREATE TRIGGER after_caja_insert_entrada
AFTER INSERT ON caja
FOR EACH ROW
BEGIN
  -- Verificar que estamos dentro de una transacción para operaciones seguras
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Registrar el error para diagnóstico
    INSERT INTO log_errores (origen, mensaje, fecha)
    VALUES ('Trigger after_caja_insert_entrada', 'Error al procesar movimiento de entrada', NOW());
  END;

  -- Solo procesar si es un movimiento de entrada y no proviene de una venta existente
  IF NEW.tipo_movimiento = 'entrada' AND NEW.tipo_referencia != 'venta' THEN
    -- Insertar un registro en la tabla ventas
    INSERT INTO ventas (
      fecha,
      monto,
      tipo,
      descripcion,
      cliente_id
    ) VALUES (
      NEW.fecha_hora,
      NEW.monto,
      'venta completa',
      CONCAT('Ingreso de caja: ', IFNULL(NEW.concepto, 'Sin concepto')),
      NULL
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