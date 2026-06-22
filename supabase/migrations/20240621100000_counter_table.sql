  -- Add tipo column to distinguish physical tables from counter (mostrador)
  ALTER TABLE tables_restaurant
    ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'mesa'
    CHECK (tipo IN ('mesa', 'mostrador'));

  -- One counter table per restaurant
  CREATE UNIQUE INDEX IF NOT EXISTS tables_restaurant_one_counter_per_restaurant
    ON tables_restaurant (restaurant_id)
    WHERE tipo = 'mostrador';

  -- Seed counter table for each existing restaurant
  INSERT INTO tables_restaurant (restaurant_id, numero, nombre, capacidad, estado, tipo)
  SELECT r.id, 0, 'Mostrador', 1, 'libre', 'mostrador'
  FROM restaurants r
  WHERE NOT EXISTS (
    SELECT 1 FROM tables_restaurant t
    WHERE t.restaurant_id = r.id AND t.tipo = 'mostrador'
  );
