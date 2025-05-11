-- Tabla de clientes - Almacena información de los clientes de la vidriería
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada cliente, se incrementa automáticamente
  nombre VARCHAR(100) NOT NULL, -- Nombre del cliente, campo obligatorio, máximo 100 caracteres
  telefono VARCHAR(20), -- Número de teléfono del cliente, opcional, máximo 20 caracteres
  direccion TEXT, -- Dirección física del cliente, campo de texto sin límite fijo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro, se establece automáticamente
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización, se actualiza automáticamente
  INDEX idx_cliente_nombre (nombre) -- Índice para optimizar búsquedas por nombre de cliente
);

-- Tabla de trabajos - Registra los trabajos o servicios realizados por la vidriería
CREATE TABLE trabajos (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada trabajo, se incrementa automáticamente
  cliente_id INT, -- Referencia al cliente que solicitó el trabajo, puede ser NULL
  descripcion TEXT NOT NULL, -- Descripción detallada del trabajo a realizar, campo obligatorio
  estado ENUM('inicio', 'proceso', 'terminado') DEFAULT 'inicio', -- Estado actual del trabajo con tres posibles valores y valor predeterminado 'inicio'
  costo_total DECIMAL(10,2) NOT NULL, -- Costo total del trabajo con 2 decimales, campo obligatorio
  fecha_inicio DATE NOT NULL, -- Fecha en que se inicia el trabajo, campo obligatorio
  fecha_entrega DATE, -- Fecha estimada de entrega, campo opcional
  observaciones TEXT, -- Notas adicionales sobre el trabajo, campo opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL, -- Relación con la tabla clientes, si se elimina el cliente, se mantiene el trabajo pero sin cliente asociado
  INDEX idx_trabajo_cliente (cliente_id), -- Índice para optimizar búsquedas por cliente
  INDEX idx_trabajo_estado (estado) -- Índice para optimizar filtros por estado del trabajo
);

-- Tabla de cobros - Registra los pagos recibidos por los trabajos realizados
CREATE TABLE cobros (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada cobro, se incrementa automáticamente
  trabajo_id INT NOT NULL, -- Referencia al trabajo por el que se realiza el cobro, campo obligatorio
  monto DECIMAL(10,2) NOT NULL, -- Cantidad cobrada con 2 decimales, campo obligatorio
  fecha DATE NOT NULL, -- Fecha en que se realizó el cobro, campo obligatorio
  tipo_pago VARCHAR(50) NOT NULL, -- Método de pago utilizado (efectivo, tarjeta, transferencia, etc.), campo obligatorio
  observacion VARCHAR(100), -- Notas adicionales sobre el cobro, campo opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE, -- Relación con la tabla trabajos, si se elimina el trabajo, se eliminan todos sus cobros asociados
  INDEX idx_cobro_trabajo (trabajo_id), -- Índice para optimizar búsquedas por trabajo
  INDEX idx_cobro_fecha (fecha) -- Índice para optimizar reportes filtrados por fecha
);

-- Tabla de ventas - Registra las transacciones financieras de la vidriería
CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada venta, se incrementa automáticamente
  fecha DATE NOT NULL, -- Fecha en que se realizó la venta, campo obligatorio
  monto DECIMAL(10,2) NOT NULL, -- Importe de la venta con 2 decimales, campo obligatorio
  tipo ENUM('adelanto', 'pago final', 'venta completa') NOT NULL, -- Clasificación del tipo de venta con tres opciones posibles
  descripcion TEXT, -- Descripción detallada de la venta, campo opcional
  cliente_id INT, -- Referencia al cliente asociado a la venta, puede ser NULL
  trabajo_id INT, -- Referencia al trabajo asociado a la venta, puede ser NULL
  cobro_id INT UNIQUE, -- Referencia al cobro que generó la venta, garantiza que cada cobro solo genere una venta
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL, -- Si se elimina el cliente, se mantiene la venta pero sin cliente asociado
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE SET NULL, -- Si se elimina el trabajo, se mantiene la venta pero sin trabajo asociado
  FOREIGN KEY (cobro_id) REFERENCES cobros(id) ON DELETE SET NULL, -- Si se elimina el cobro, se mantiene la venta pero sin cobro asociado
  INDEX idx_venta_fecha (fecha), -- Índice para optimizar reportes filtrados por fecha
  INDEX idx_venta_cliente (cliente_id) -- Índice para optimizar búsquedas por cliente
);

-- Tabla de gastos - Registra todos los egresos o gastos del negocio (versión unificada y completa)
CREATE TABLE gastos (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada gasto, se incrementa automáticamente
  fecha DATE NOT NULL, -- Fecha en que se realizó el gasto, campo obligatorio
  monto DECIMAL(10,2) NOT NULL, -- Importe del gasto con 2 decimales, campo obligatorio
  descripcion TEXT NOT NULL, -- Descripción detallada del gasto, campo obligatorio
  categoria VARCHAR(50), -- Clasificación del gasto (materiales, servicios, salarios, etc.), campo opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  INDEX idx_gasto_fecha (fecha), -- Índice para optimizar reportes filtrados por fecha
  INDEX idx_gasto_categoria (categoria) -- Índice para optimizar filtros por categoría de gasto
);

-- Tabla de inventario - Registra los productos y materiales disponibles en el negocio
CREATE TABLE inventario (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada producto, se incrementa automáticamente
  nombre_producto VARCHAR(100) NOT NULL, -- Nombre del producto, campo obligatorio, máximo 100 caracteres
  cantidad INT NOT NULL DEFAULT 0, -- Cantidad disponible del producto, campo obligatorio, valor predeterminado 0
  unidad VARCHAR(20) NOT NULL, -- Unidad de medida del producto (piezas, metros, litros, etc.), campo obligatorio
  precio_referencia DECIMAL(10,2), -- Precio de referencia del producto con 2 decimales, campo opcional
  stock_minimo INT DEFAULT 0, -- Nivel mínimo de stock para alertar de reposición, campo opcional, valor predeterminado 0
  categoria VARCHAR(50), -- Categoría del producto (materiales, herramientas, etc.), campo opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  INDEX idx_inventario_nombre (nombre_producto), -- Índice para optimizar búsquedas por nombre de producto
  INDEX idx_inventario_categoria (categoria) -- Índice para optimizar filtros por categoría de producto
);

-- Tabla de usuarios - Almacena la información de los usuarios del sistema
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada usuario, se incrementa automáticamente
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL, -- Nombre de usuario para iniciar sesión, debe ser único, campo obligatorio
  password_hash VARCHAR(255) NOT NULL, -- Contraseña encriptada del usuario, campo obligatorio
  nombre_completo VARCHAR(100) NOT NULL, -- Nombre real del usuario, campo obligatorio
  rol ENUM('admin', 'vendedor', 'operario') NOT NULL, -- Rol del usuario en el sistema, determina los permisos
  activo BOOLEAN DEFAULT true, -- Indica si el usuario está activo en el sistema, valor predeterminado true
  ultimo_acceso DATETIME, -- Fecha y hora del último inicio de sesión del usuario, campo opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  INDEX idx_usuario_rol (rol) -- Índice para optimizar filtros por rol de usuario
);
-- Tabla de caja - Registra todos los movimientos de dinero del negocio
CREATE TABLE caja (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada movimiento de caja
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Momento exacto del movimiento
  tipo_movimiento ENUM('entrada', 'salida') NOT NULL, -- Tipo de flujo de caja
  concepto VARCHAR(50) NOT NULL, -- Categorización general: 'venta', 'gasto', 'adelanto', etc.
  monto DECIMAL(10,2) NOT NULL, -- Cantidad del movimiento
  saldo_resultante DECIMAL(10,2) NOT NULL, -- Saldo después del movimiento (facilita auditoría)
  descripcion TEXT, -- Detalles adicionales
  referencia_id INT, -- ID genérico para referenciar ventas, gastos, etc.
  tipo_referencia ENUM('venta', 'gasto', 'cobro', 'ajuste') NOT NULL, -- Tabla a la que refiere
  forma_pago ENUM('efectivo', 'transferencia', 'otro') NOT NULL, -- Método de pago
  usuario_id INT NOT NULL, -- Quién realizó la operación
  observaciones TEXT, -- Notas adicionales
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT, -- No permite eliminar usuarios que hayan registrado movimientos
  INDEX idx_caja_fecha (fecha_hora), -- Índice para optimizar búsquedas por fecha
  INDEX idx_caja_usuario (usuario_id), -- Índice para optimizar búsquedas por usuario
  INDEX idx_caja_tipo (tipo_movimiento), -- Índice para optimizar filtros por tipo de movimiento
  INDEX idx_caja_concepto (concepto) -- Índice para optimizar búsquedas por concepto
);

-- Tabla de cierres de caja - Registra los cierres diarios de operaciones financieras
CREATE TABLE cierres_caja (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada cierre, se incrementa automáticamente
  fecha DATE NOT NULL, -- Fecha del cierre de caja, campo obligatorio
  total_ventas DECIMAL(10,2) NOT NULL, -- Suma total de ventas del día con 2 decimales, campo obligatorio
  total_gastos DECIMAL(10,2) NOT NULL, -- Suma total de gastos del día con 2 decimales, campo obligatorio
  saldo_final DECIMAL(10,2) NOT NULL, -- Saldo resultante al final del día con 2 decimales, campo obligatorio
  observaciones TEXT, -- Notas adicionales sobre el cierre, campo opcional
  usuario_id INT, -- Referencia al usuario que realizó el cierre, puede ser NULL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL, -- Si se elimina el usuario, se mantiene el cierre pero sin usuario asociado
  INDEX idx_cierre_fecha (fecha), -- Índice para optimizar búsquedas por fecha
  UNIQUE INDEX idx_cierre_fecha_unico (fecha) -- Garantiza que solo exista un cierre por día
);

-- Tabla para movimientos de inventario - Registra todas las entradas y salidas de productos del inventario
CREATE TABLE movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada movimiento, se incrementa automáticamente
  inventario_id INT NOT NULL, -- Referencia al producto del inventario afectado, campo obligatorio
  tipo_movimiento ENUM('entrada', 'salida') NOT NULL, -- Tipo de movimiento (entrada o salida de stock), campo obligatorio
  cantidad INT NOT NULL, -- Cantidad de unidades que entran o salen, campo obligatorio
  fecha DATETIME NOT NULL, -- Fecha y hora exacta del movimiento, campo obligatorio
  motivo VARCHAR(100), -- Razón del movimiento (venta, compra, ajuste, etc.), campo opcional
  referencia_trabajo_id INT NULL, -- Referencia al trabajo relacionado con el movimiento, si aplica
  referencia_venta_id INT NULL, -- Referencia a la venta relacionada con el movimiento, si aplica
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  FOREIGN KEY (inventario_id) REFERENCES inventario(id) ON DELETE CASCADE, -- Si se elimina el producto, se eliminan todos sus movimientos
  FOREIGN KEY (referencia_trabajo_id) REFERENCES trabajos(id) ON DELETE SET NULL, -- Si se elimina el trabajo, se mantiene el movimiento pero sin trabajo asociado
  FOREIGN KEY (referencia_venta_id) REFERENCES ventas(id) ON DELETE SET NULL, -- Si se elimina la venta, se mantiene el movimiento pero sin venta asociada
  INDEX idx_movimiento_fecha (fecha), -- Índice para optimizar reportes filtrados por fecha
  INDEX idx_movimiento_tipo (tipo_movimiento), -- Índice para optimizar filtros por tipo de movimiento
  INDEX idx_movimiento_inventario (inventario_id) -- Índice para optimizar filtros por producto
);

-- Triggers para automatizar operaciones - Procedimientos que se ejecutan automáticamente cuando ocurren ciertos eventos

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
  DECLARE forma_pago_usada ENUM('efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro');
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
  DECLARE forma_pago_usada ENUM('efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro');
  DECLARE usuario_actual INT;
  DECLARE saldo_actual DECIMAL(10,2);
  
  -- Obtener el último saldo de caja
  SELECT IFNULL(MAX(saldo_resultante), 0) INTO saldo_actual FROM caja;
  
  -- Determinar forma de pago (predeterminado para gastos)
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
    'salida', -- Los gastos son salidas de dinero
    IFNULL(NEW.categoria, 'Gasto general'), -- Concepto basado en la categoría
    NEW.monto, -- Mismo monto del gasto
    saldo_actual - NEW.monto, -- Calcula el nuevo saldo (resta)
    NEW.descripcion, -- Misma descripción
    NEW.id, -- ID del gasto como referencia
    'gasto', -- Tipo de referencia
    forma_pago_usada, -- Forma de pago determinada anteriormente
    usuario_actual, -- Usuario que realiza la operación
    CONCAT('Gasto ID: ', NEW.id, IF(NEW.categoria IS NOT NULL, CONCAT(', Categoría: ', NEW.categoria), ''))
  );
END$$
DELIMITER ;