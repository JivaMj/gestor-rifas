-- =====================================================
-- MIGRATION: 2026-09-20 - Crear tabla promotions
-- =====================================================
-- Descripcion: Tabla para publicaciones de promociones.
-- Cada promocion tiene un codigo de administracion propio
-- para que el dueno pueda editar sus datos.
-- =====================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  availability TEXT,
  address TEXT,
  conditions TEXT,
  whatsapp TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  website TEXT,
  admin_code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_slug ON promotions(slug);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view promotions"
  ON promotions FOR SELECT
  USING (true);
