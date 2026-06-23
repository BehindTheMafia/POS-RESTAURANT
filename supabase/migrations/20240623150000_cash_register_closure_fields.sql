-- Add closure details and audit fields to cash_registers table
ALTER TABLE cash_registers
ADD COLUMN IF NOT EXISTS monto_cierre_real NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS monto_cierre_esperado NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS diferencia NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS detalles_cierre JSONB;
