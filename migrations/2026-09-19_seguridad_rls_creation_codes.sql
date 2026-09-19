-- =====================================================
-- MIGRATION: 2026-09-19 - Seguridad: RLS creation_codes +admin_code_hash
-- =====================================================
-- Descripcion: Elimina la politica publica de SELECT en creation_codes
-- que permitia a cualquiera enumerar los codigos de creacion.
-- La validacion de codigos se hace server-side con service role,
-- por lo que no se necesita acceso publico a esta tabla.
-- =====================================================

-- Eliminar la politica publica que permitia leer todos los creation_codes
DROP POLICY IF EXISTS "Public can view unused creation codes" ON creation_codes;

-- La tabla creation_codes ahora solo es accesible via service role (bypasses RLS)
