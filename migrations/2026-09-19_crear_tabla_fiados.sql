-- =====================================================
-- MIGRATION: 2026-09-19 - Crear tabla fiados
-- =====================================================
-- Descripcion: Tabla para publicaciones de actividades fiadas
-- (venta de comida, servicios, productos a credito).
-- Cada publicacion tiene un codigo de administracion propio
-- para que el dueno pueda editar sus datos.
-- =====================================================

CREATE TABLE IF NOT EXISTS fiados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(10, 2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'immediate' CHECK (payment_type IN ('immediate', 'scheduled')),
  payment_date TEXT,
  whatsapp TEXT NOT NULL,
  discount_info TEXT,
  admin_code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiados_slug ON fiados(slug);
CREATE INDEX IF NOT EXISTS idx_fiados_status ON fiados(status);

CREATE TRIGGER update_fiados_updated_at
  BEFORE UPDATE ON fiados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fiados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active fiados"
  ON fiados FOR SELECT
  USING (true);
