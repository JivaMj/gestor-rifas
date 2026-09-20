-- =====================================================
-- MIGRATION: 2026-09-20 - Sistema de usuarios y JWT
-- =====================================================
-- Descripcion: Crea tabla de usuarios, agrega owner_id
-- a todas las tablas de contenido, elimina admin_code_hash
-- y tablas de codigos de creacion.
-- =====================================================

-- TABLA USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT,
  location TEXT,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- OWNER_ID en tablas de contenido
ALTER TABLE raffles ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE fiados ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE promotions ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Eliminar admin_code_hash de tablas de contenido
ALTER TABLE raffles DROP COLUMN IF EXISTS admin_code_hash;
ALTER TABLE fiados DROP COLUMN IF EXISTS admin_code_hash;
ALTER TABLE promotions DROP COLUMN IF EXISTS admin_code_hash;

-- Eliminar tabla de codigos de creacion
DROP TABLE IF EXISTS creation_codes;

-- RLS: usuarios autenticados ven todo el contenido publico
-- El filtrado por owner_id se hace en server actions con service role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (true);

-- =====================================================
-- USUARIO ADMIN POR DEFECTO
-- =====================================================
-- Email: admin@gestorrifas.com
-- Password: admin123 (CAMBIAR EN PRODUCCION)
INSERT INTO users (id, email, name, password_hash, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@gestorrifas.com',
  'Administrador',
  '$2b$12$ueEivkL/jn5WWH.WEWgYF.CJJqKdIFzjJk1TUtFs0M5A6jlkMjszu',
  true
) ON CONFLICT (email) DO NOTHING;
