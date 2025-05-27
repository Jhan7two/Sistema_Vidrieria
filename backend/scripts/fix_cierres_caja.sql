-- Eliminar el índice si existe
DROP INDEX IF EXISTS idx_cierre_estado;

-- Eliminar la columna estado si existe
ALTER TABLE cierres_caja DROP COLUMN IF EXISTS estado;

-- Eliminar la columna fecha_cierre si existe
ALTER TABLE cierres_caja DROP COLUMN IF EXISTS fecha_cierre;

-- Eliminar el tipo ENUM si existe
DROP TYPE IF EXISTS enum_cierres_caja_estado;

-- Verificar y crear el tipo ENUM si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_cierres_caja_estado') THEN
        CREATE TYPE enum_cierres_caja_estado AS ENUM ('abierto', 'cerrado', 'anulado');
    END IF;
END $$;

-- Verificar y agregar la columna estado si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cierres_caja' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE cierres_caja 
        ADD COLUMN estado enum_cierres_caja_estado NOT NULL DEFAULT 'abierto';
    END IF;
END $$;

-- Verificar y agregar la columna fecha_cierre si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cierres_caja' 
        AND column_name = 'fecha_cierre'
    ) THEN
        ALTER TABLE cierres_caja 
        ADD COLUMN fecha_cierre TIMESTAMP;
    END IF;
END $$;

-- Verificar y crear el índice si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'cierres_caja' 
        AND indexname = 'idx_cierre_estado'
    ) THEN
        CREATE INDEX idx_cierre_estado ON cierres_caja(estado);
    END IF;
END $$;

-- Actualizar registros existentes
UPDATE cierres_caja 
SET estado = 'cerrado',
    fecha_cierre = created_at
WHERE created_at IS NOT NULL 
AND (estado IS NULL OR fecha_cierre IS NULL);

-- Verificar y agregar la restricción si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'check_estado'
    ) THEN
        ALTER TABLE cierres_caja 
        ADD CONSTRAINT check_estado 
        CHECK (estado IN ('abierto', 'cerrado', 'anulado'));
    END IF;
END $$;