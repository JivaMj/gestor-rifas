-- =====================================================
-- GESTOR RIFAS - Database Schema
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: raffles
-- =====================================================
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize_image_url TEXT,
  raffle_date TIMESTAMPTZ NOT NULL,
  terms TEXT,
  number_from INTEGER NOT NULL,
  number_to INTEGER NOT NULL,
  ticket_price NUMERIC(10, 2) NOT NULL,
  whatsapp TEXT NOT NULL,
  winner_method TEXT NOT NULL DEFAULT 'random' CHECK (winner_method IN ('random', 'manual')),
  winner_number INTEGER,
  winner_source TEXT,
  admin_code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: tickets
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'sold' CHECK (status IN ('reserved', 'sold')),
  participant_name TEXT,
  participant_phone TEXT,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  fully_paid BOOLEAN DEFAULT false,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, number)
);

-- =====================================================
-- TABLE: creation_codes
-- =====================================================
CREATE TABLE IF NOT EXISTS creation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  used_by_raffle_id UUID REFERENCES raffles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_raffles_slug ON raffles(slug);
CREATE INDEX IF NOT EXISTS idx_raffles_status ON raffles(status);
CREATE INDEX IF NOT EXISTS idx_tickets_raffle_id ON tickets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(raffle_id, number);
CREATE INDEX IF NOT EXISTS idx_creation_codes_code ON creation_codes(code);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_raffles_updated_at
  BEFORE UPDATE ON raffles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS but allow all operations through service role
-- The application uses server-side service role for all admin operations
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE creation_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to raffles (for public page)
CREATE POLICY "Public can view active raffles"
  ON raffles FOR SELECT
  USING (true);

-- Allow public read access to tickets (for public page)
CREATE POLICY "Public can view tickets"
  ON tickets FOR SELECT
  USING (true);

-- creation_codes: no public SELECT policy (validated server-side via service role)

-- =====================================================
-- FIADOS TABLE
-- =====================================================
-- Publicaciones de actividades fiadas (venta a credito)

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

-- =====================================================
-- PROMOTIONS TABLE
-- =====================================================
-- Publicaciones de promociones

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

-- All write operations go through server-side service role (bypasses RLS)

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
-- Create the storage bucket via Supabase Dashboard:
-- Go to Storage > New Bucket
-- Name: raffle-images
-- Public: Yes (or configure appropriate policies)
