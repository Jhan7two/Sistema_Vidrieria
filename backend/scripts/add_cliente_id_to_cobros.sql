-- Agregar columna cliente_id a la tabla cobros
ALTER TABLE cobros ADD COLUMN cliente_id INT;

-- Añadir el índice para mejorar las búsquedas por cliente
ALTER TABLE cobros ADD INDEX idx_cobro_cliente (cliente_id);

-- Añadir la clave foránea que referencia a la tabla clientes
ALTER TABLE cobros ADD CONSTRAINT fk_cobros_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

-- Actualizar los registros existentes con el cliente_id correspondiente basado en el trabajo_id
-- Esta sentencia debe ejecutarse después de agregar la columna
UPDATE cobros c
JOIN trabajos t ON c.trabajo_id = t.id
SET c.cliente_id = t.cliente_id
WHERE c.cliente_id IS NULL; 