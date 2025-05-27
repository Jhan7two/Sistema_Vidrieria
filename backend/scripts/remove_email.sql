-- Eliminar la columna email si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE usuarios DROP COLUMN email;
    END IF;
END $$; 