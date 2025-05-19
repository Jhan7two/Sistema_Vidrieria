-- Datos ficticios para la base de datos del sistema de Vidriería
-- Este script debe ejecutarse después de crear las tablas y los triggers

-- Insertar clientes ficticios
INSERT INTO clientes (nombre, telefono) VALUES 
('Carlos Pérez', '75812345'),
('María Gómez', '69854321'),
('Roberto Mendoza', '72156789'),
('Ana Flores', '65478932'),
('Juan Rodríguez', '73269851'),
('Patricia López', '68123478'),
('Alejandro Torres', '71234567'),
('Lucía Vargas', '62345678'),
('Fernando Mendoza', '74563219'),
('Daniela Castro', '67891234');

-- Insertar usuarios del sistema
INSERT INTO usuarios (nombre_usuario, password_hash, nombre_completo, rol) VALUES
('admin', '$2a$10$h9hLKALMKj/K7IWQjZD3L.8XKzG.dFl2ZzZVwPTFNRaZ10TYlrPSm', 'Administrador del Sistema', 'admin'), -- Contraseña: admin123
('vendedor1', '$2a$10$8PuZv.VL.5cqdgqzwSGiheJj19l0rI3nU99RTVgzfxM8mXSiKaaSe', 'Juan Ventas', 'vendedor'), -- Contraseña: venta123
('operario1', '$2a$10$hLuB9oXxG5K8XjyqWPS1.eCGjMgTZkZUjkRYaG1WvIYWc7C9wMgtu', 'Pedro Operaciones', 'operario'); -- Contraseña: opera123

-- Insertar trabajos ficticios
INSERT INTO trabajos (cliente_id, descripcion, tipo, fecha_programada, fecha_inicio, estado, direccion_trabajo, costo_total) VALUES
(1, 'Instalación de ventana corrediza 1.5x1.0m', 'Instalación', '2023-08-15', '2023-08-15', 'inicio', 'Av. América #123', 850.00),
(2, 'Cambio de vidrios rotos en puerta', 'Reparación', '2023-08-16', '2023-08-16', 'proceso', 'Calle Los Pinos #456', 320.00),
(3, 'Fabricación e instalación de puerta de vidrio templado', 'Fabricación', '2023-08-18', NULL, 'inicio', 'Av. Banzer #789', 1200.00),
(4, 'Espejo para baño 80x60cm', 'Corte', '2023-08-10', '2023-08-10', 'terminado', 'Tienda cliente', 150.00),
(5, 'Mampara de ducha vidrio templado', 'Instalación', '2023-08-20', NULL, 'inicio', 'Urb. Las Palmas #234', 950.00),
(6, 'Vitrina de exhibición 2x1.5m', 'Fabricación', '2023-08-25', NULL, 'inicio', 'C. Comercio #567', 1800.00),
(7, 'Reemplazo de vidrio en ventanal', 'Reparación', '2023-08-12', '2023-08-12', 'proceso', 'Av. Centenario #890', 420.00),
(8, 'Mesa de vidrio templado 10mm', 'Fabricación', '2023-08-28', NULL, 'inicio', 'Tienda cliente', 750.00),
(9, 'Espejos decorativos sala (3 unidades)', 'Instalación', '2023-08-15', '2023-08-15', 'terminado', 'Cond. Norte #123', 680.00),
(10, 'Fachada de vidrio para local comercial', 'Instalación', '2023-09-05', NULL, 'inicio', 'Av. Principal #567', 3500.00);

-- Insertar productos en stock
INSERT INTO stock (nombre_producto, cantidad, unidad, precio_referencia, stock_minimo, categoria) VALUES
('Vidrio 4mm transparente', 50, 'm²', 45.00, 20, 'Vidrios'),
('Vidrio 6mm transparente', 40, 'm²', 65.00, 15, 'Vidrios'),
('Vidrio 8mm transparente', 30, 'm²', 85.00, 10, 'Vidrios'),
('Vidrio templado 10mm', 25, 'm²', 120.00, 5, 'Vidrios'),
('Silicona transparente', 25, 'unidad', 35.00, 10, 'Insumos'),
('Perfil de aluminio', 100, 'm', 25.00, 30, 'Perfiles'),
('Bisagras vidrio-vidrio', 40, 'par', 18.00, 15, 'Accesorios'),
('Manijas para puerta', 30, 'par', 45.00, 10, 'Accesorios'),
('Ruedas para ventana', 50, 'juego', 12.00, 20, 'Accesorios'),
('Espejo 4mm', 30, 'm²', 60.00, 10, 'Espejos');

-- Insertar registros de caja (que automáticamente generarán ventas a través del trigger)
-- Entradas (generan ventas)
INSERT INTO caja (tipo_movimiento, concepto, monto, saldo_resultante, descripcion, tipo_referencia, forma_pago, usuario_id) VALUES
('entrada', 'Venta completa', 150.00, 150.00, 'Venta de espejo 1x1m', 'ajuste', 'efectivo', 1),
('entrada', 'Adelanto', 500.00, 650.00, 'Adelanto por instalación de ventanas', 'ajuste', 'transferencia', 2),
('entrada', 'Venta completa', 85.00, 735.00, 'Venta de vidrio cortado 6mm', 'ajuste', 'efectivo', 2),
('entrada', 'Pago final', 700.00, 1435.00, 'Pago final de puerta de vidrio', 'ajuste', 'transferencia', 1),
('entrada', 'Venta completa', 230.00, 1665.00, 'Venta de accesorios varios', 'ajuste', 'efectivo', 2);

-- Salidas (generan gastos)
INSERT INTO caja (tipo_movimiento, concepto, monto, saldo_resultante, descripcion, tipo_referencia, forma_pago, usuario_id) VALUES
('salida', 'Servicios', 200.00, 1465.00, 'Pago de electricidad', 'ajuste', 'transferencia', 1),
('salida', 'Materiales', 800.00, 665.00, 'Compra de vidrio al proveedor', 'ajuste', 'transferencia', 1),
('salida', 'Salarios', 350.00, 315.00, 'Pago parcial a instalador', 'ajuste', 'efectivo', 1),
('salida', 'Transporte', 100.00, 215.00, 'Combustible para entregas', 'ajuste', 'efectivo', 2),
('salida', 'Insumos', 150.00, 65.00, 'Compra de silicona y adhesivos', 'ajuste', 'efectivo', 2);

-- Insertar cobros - estos actualizarán automáticamente el monto_pagado y estado_pago en trabajos
INSERT INTO cobros (trabajo_id, monto, fecha, tipo_pago, observacion) VALUES
(1, 400.00, '2023-08-15', 'efectivo', 'Adelanto 50%'),
(4, 150.00, '2023-08-10', 'efectivo', 'Pago completo'),
(7, 200.00, '2023-08-12', 'transferencia', 'Adelanto por reparación'),
(9, 680.00, '2023-08-15', 'transferencia', 'Pago completo'),
(2, 150.00, '2023-08-16', 'efectivo', 'Adelanto por reparación');

-- Insertar algunos cierres de caja
INSERT INTO cierres_caja (fecha, total_ventas, total_gastos, saldo_final, usuario_id) VALUES
('2023-08-10', 150.00, 0.00, 150.00, 1),
('2023-08-12', 200.00, 100.00, 100.00, 1),
('2023-08-15', 1080.00, 0.00, 1080.00, 2),
('2023-08-16', 150.00, 350.00, -200.00, 1);

-- Insertar movimientos de inventario
INSERT INTO movimientos_inventario (inventario_id, tipo_movimiento, cantidad, fecha, motivo, referencia_trabajo_id) VALUES
(1, 'salida', 3, '2023-08-10', 'Uso en proyecto', 4),
(4, 'salida', 2, '2023-08-15', 'Uso en proyecto', 9),
(5, 'salida', 2, '2023-08-12', 'Uso en proyecto', 7),
(2, 'salida', 4, '2023-08-16', 'Uso en proyecto', 2),
(1, 'entrada', 10, '2023-08-14', 'Compra a proveedor', NULL),
(3, 'entrada', 5, '2023-08-18', 'Compra a proveedor', NULL); 