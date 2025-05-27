-- Crear el tipo ENUM si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_usuarios_rol') THEN
        CREATE TYPE enum_usuarios_rol AS ENUM ('admin', 'vendedor', 'operario');
    END IF;
END $$;

-- Verificar y agregar columnas si no existen
DO $$ 
BEGIN
    -- Verificar y agregar columna nombre_usuario si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'nombre_usuario'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN nombre_usuario VARCHAR(50) NOT NULL;
    END IF;

    -- Verificar y agregar columna password_hash si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN password_hash VARCHAR(255) NOT NULL;
    END IF;

    -- Verificar y agregar columna nombre_completo si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'nombre_completo'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN nombre_completo VARCHAR(100) NOT NULL;
    END IF;

    -- Verificar y agregar columna rol si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'rol'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN rol enum_usuarios_rol NOT NULL DEFAULT 'operario';
    END IF;

    -- Verificar y agregar columna activo si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'activo'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Verificar y agregar columna ultimo_acceso si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'ultimo_acceso'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN ultimo_acceso TIMESTAMP;
    END IF;

    -- Verificar y agregar columna email si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN email VARCHAR(100);
    END IF;
END $$;

-- Crear índices si no existen
DO $$ 
BEGIN
    -- Índice para nombre_usuario
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'usuarios' 
        AND indexname = 'idx_usuario_nombre'
    ) THEN
        CREATE UNIQUE INDEX idx_usuario_nombre ON usuarios(nombre_usuario);
    END IF;

    -- Índice para rol
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'usuarios' 
        AND indexname = 'idx_usuario_rol'
    ) THEN
        CREATE INDEX idx_usuario_rol ON usuarios(rol);
    END IF;

    -- Índice para activo
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'usuarios' 
        AND indexname = 'idx_usuario_activo'
    ) THEN
        CREATE INDEX idx_usuario_activo ON usuarios(activo);
    END IF;
END $$; 