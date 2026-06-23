-- Add tipo column to inventory_items to distinguish between ingredients and sauces
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'ingrediente'
  CHECK (tipo IN ('ingrediente', 'salsa'));

-- Seed some default sauces if they don't exist
INSERT INTO inventory_items (restaurant_id, nombre, unidad, stock_actual, stock_minimo, costo_unitario, tipo, activo)
SELECT 
  r.id,
  s.nombre,
  'ml' as unidad,
  1000 as stock_actual,
  200 as stock_minimo,
  15 as costo_unitario,
  'salsa' as tipo,
  true as activo
FROM restaurants r
CROSS JOIN (
  VALUES 
    ('Salsa Ranch'),
    ('Salsa BBQ'),
    ('Salsa Buffalo')
) AS s(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items i 
  WHERE i.restaurant_id = r.id 
    AND i.nombre = s.nombre
    AND i.tipo = 'salsa'
);

