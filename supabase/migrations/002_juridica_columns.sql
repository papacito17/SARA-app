-- ============================================================
-- MIGRACIÓN 002: Columnas del representante legal y condición
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

ALTER TABLE empresas_juridicas
  ADD COLUMN IF NOT EXISTS tipo_propietario        TEXT,
  ADD COLUMN IF NOT EXISTS cedula_representante    TEXT,
  ADD COLUMN IF NOT EXISTS direccion_representante TEXT,
  ADD COLUMN IF NOT EXISTS ciudad_representante    TEXT,
  ADD COLUMN IF NOT EXISTS email_representante     TEXT,
  ADD COLUMN IF NOT EXISTS telefono_representante  TEXT;

-- Verificar que se crearon
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'empresas_juridicas'
ORDER BY ordinal_position;
