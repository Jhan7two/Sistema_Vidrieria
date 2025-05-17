-- Tabla de clientes - Almacena información de los clientes de la vidriería
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada cliente, se incrementa automáticamente
  nombre VARCHAR(100) NOT NULL, -- Nombre del cliente, campo obligatorio, máximo 100 caracteres
  telefono VARCHAR(20), -- Número de teléfono del cliente, opcional, máximo 20 caracteres
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro, se establece automáticamente
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización, se actualiza automáticamente
  INDEX idx_cliente_nombre (nombre) -- Índice para optimizar búsquedas por nombre de cliente
);

-- Tabla de trabajos rediseñada - Registra los trabajos o servicios realizados por la vidriería
CREATE TABLE trabajos (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único para cada trabajo
  cliente_id INT, -- Referencia al cliente que solicitó el trabajo
  descripcion TEXT NOT NULL, -- Descripción detallada del trabajo a realizar
  tipo VARCHAR(50) NOT NULL, -- Tipo de trabajo (instalación, corte, pulido, etc.)
  fecha_programada DATE NOT NULL, -- Fecha en que está programado el trabajo
  fecha_inicio DATE, -- Fecha en que se comenzó el trabajo
  fecha_finalizacion DATE, -- Fecha en que se terminó el trabajo
  fecha_entrega DATE, -- Fecha estimada o real de entrega al cliente
  estado ENUM('inicio', 'proceso', 'terminado') DEFAULT 'inicio', -- Estado del avance físico del trabajo
  direccion_trabajo TEXT, -- Dirección donde se realizará el trabajo (puede ser diferente a la del cliente)
  costo_total DECIMAL(10,2) NOT NULL, -- Precio total del trabajo
  monto_pagado DECIMAL(10,2) DEFAULT 0.00, -- Cuánto ha pagado el cliente hasta el momento
  saldo_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (costo_total - monto_pagado) STORED, -- Campo calculado: saldo pendiente de pago
  estado_pago ENUM('Pendiente', 'Parcial', 'Pagado') DEFAULT 'Pendiente', -- Estado del pago
  observaciones TEXT, -- Notas adicionales sobre el trabajo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del registro
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha y hora de última actualización
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL, -- Si se elimina el cliente, se mantiene el trabajo sin cliente asociado
  
  INDEX idx_trabajo_cliente (cliente_id), -- Índice para optimizar búsquedas por cliente
  INDEX idx_trabajo_estado (estado), -- Índice para filtrar por estado del trabajo
  INDEX idx_trabajo_estado_pago (estado_pago), -- Índice para filtrar por estado de pago
  INDEX idx_trabajo_fecha_programada (fecha_programada), -- Índice para búsquedas por fecha programada
  INDEX idx_trabajo_tipo (tipo) -- Índice para búsquedas por tipo de trabajo
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
CREATE TABLE stock (
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
  FOREIGN KEY (inventario_id) REFERENCES stock(id) ON DELETE CASCADE, -- Si se elimina el producto, se eliminan todos sus movimientos
  FOREIGN KEY (referencia_trabajo_id) REFERENCES trabajos(id) ON DELETE SET NULL, -- Si se elimina el trabajo, se mantiene el movimiento pero sin trabajo asociado
  FOREIGN KEY (referencia_venta_id) REFERENCES ventas(id) ON DELETE SET NULL, -- Si se elimina la venta, se mantiene el movimiento pero sin venta asociada
  INDEX idx_movimiento_fecha (fecha), -- Índice para optimizar reportes filtrados por fecha
  INDEX idx_movimiento_tipo (tipo_movimiento), -- Índice para optimizar filtros por tipo de movimiento
  INDEX idx_movimiento_inventario (inventario_id) -- Índice para optimizar filtros por producto
);

-- Nuevo trigger para registrar en ventas/gastos cuando se inserta en caja
DELIMITER $$
CREATE TRIGGER after_caja_insert
AFTER INSERT ON caja -- Se activa después de cada inserción en la tabla caja
FOR EACH ROW -- Se ejecuta una vez por cada fila insertada
BEGIN
  -- Si es una entrada de dinero, crear registro en ventas
  IF NEW.tipo_movimiento = 'entrada' THEN
    INSERT INTO ventas (
      fecha,
      monto,
      tipo,
      descripcion,
      cliente_id,
      trabajo_id
    ) VALUES (
      DATE(NEW.fecha_hora), -- Fecha del movimiento de caja
      NEW.monto, -- Monto del movimiento
      CASE 
        WHEN NEW.concepto = 'Adelanto' THEN 'adelanto'
        WHEN NEW.concepto = 'Pago final' THEN 'pago final'
        ELSE 'venta completa'
      END, -- Tipo basado en el concepto de caja
      NEW.descripcion, -- Descripción del movimiento
      NULL, -- Cliente_id (si se necesita, debería pasarse desde la interfaz)
      CASE 
        WHEN NEW.tipo_referencia = 'cobro' THEN (SELECT trabajo_id FROM cobros WHERE id = NEW.referencia_id)
        ELSE NULL
      END -- Trabajo_id si la referencia es un cobro
    );
    
    -- No se puede actualizar la tabla caja desde su propio trigger
    -- La actualización debe hacerse desde la aplicación o con otro mecanismo
    
  -- Si es una salida de dinero, crear registro en gastos
  ELSEIF NEW.tipo_movimiento = 'salida' THEN
    INSERT INTO gastos (
      fecha,
      monto,
      descripcion,
      categoria
    ) VALUES (
      DATE(NEW.fecha_hora), -- Fecha del movimiento de caja
      NEW.monto, -- Monto del movimiento
      NEW.descripcion, -- Descripción del movimiento
      NEW.concepto -- Categoría basada en el concepto de caja
    );
    
    -- No se puede actualizar la tabla caja desde su propio trigger
    -- La actualización debe hacerse desde la aplicación o con otro mecanismo
  END IF;
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
  
  -- Si el estado es 'proceso' y ahora está pagado totalmente, cambiar a 'terminado'
  IF total_cobrado >= costo_total_trabajo THEN
    UPDATE trabajos
    SET estado = IF(estado = 'proceso', 'terminado', estado)
    WHERE id = NEW.trabajo_id AND estado = 'proceso';
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

-- Crear vista para trabajos pendientes por fecha programada
CREATE VIEW trabajos_pendientes AS
SELECT *
FROM vista_trabajos
WHERE estado IN ('inicio', 'proceso')
ORDER BY fecha_programada;