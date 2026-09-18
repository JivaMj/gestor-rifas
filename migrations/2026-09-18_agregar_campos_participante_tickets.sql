-- =====================================================
-- MIGRATION: 2026-09-18 - Agregar campos de participante a tickets
-- =====================================================
-- Descripcion: Agrega columnas para guardar nombre del participante,
-- telefono, monto pagado, estado de pago completo y direccion de entrega.
-- Permite al administrador llevar un registro detallado de cada boleto
-- asignado, incluyendo informacion de pago y entrega del premio.
-- =====================================================

-- Campo: nombre del participante/comprador
ALTER TABLE tickets ADD COLUMN participant_name TEXT;

-- Campo: telefono del participante
ALTER TABLE tickets ADD COLUMN participant_phone TEXT;

-- Campo: cuánto ha pagado el participante
ALTER TABLE tickets ADD COLUMN amount_paid NUMERIC(10, 2) DEFAULT 0;

-- Campo: si el pago está completo
ALTER TABLE tickets ADD COLUMN fully_paid BOOLEAN DEFAULT false;

-- Campo: dirección donde se debe entregar el premio
ALTER TABLE tickets ADD COLUMN delivery_address TEXT;

-- Campo: notas adicionales del administrador
ALTER TABLE tickets ADD COLUMN notes TEXT;
