-- Adds business rules for restaurant cash registers:
-- 1. Prevent sales if no open cash register exists for the cashier (complete_sale check).
-- 2. Prevent modifying or deleting sales that belong to a closed cash register session (trigger).

-- Recreate complete_sale with cash register validation
CREATE OR REPLACE FUNCTION public.complete_sale(
  p_order_id       uuid,
  p_cajero_id      uuid,
  p_descuento      numeric DEFAULT 0,
  p_iva_porcentaje numeric DEFAULT 15,
  p_payments       jsonb   DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order         orders%ROWTYPE;
  v_existing_sale sales%ROWTYPE;
  v_sale_id       uuid;
  v_subtotal      numeric;
  v_base          numeric;
  v_impuestos     numeric;
  v_total         numeric;
  v_payments_sum  numeric := 0;
  v_pay           jsonb;
  v_pm_id         uuid;
  v_monto         numeric;
  v_chk           RECORD;
BEGIN
  -- ── Order ownership check ─────────────────────────────────────────────────
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.restaurant_id IS DISTINCT FROM public.get_my_restaurant_id() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- ── Idempotency: return existing sale if already completed ────────────────
  SELECT * INTO v_existing_sale FROM sales WHERE order_id = p_order_id LIMIT 1;
  IF FOUND THEN
    RETURN json_build_object(
      'sale_id',    v_existing_sale.id,
      'idempotent', true,
      'total',      v_existing_sale.total
    );
  END IF;

  -- ── Cash register check ───────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM cash_registers
    WHERE restaurant_id = v_order.restaurant_id
      AND usuario_id = p_cajero_id
      AND estado = 'abierta'
  ) THEN
    RAISE EXCEPTION 'No hay una caja abierta para este cajero. Debe abrir caja antes de completar la venta.';
  END IF;

  -- ── Stock validation 1: direct product stock ──────────────────────────────
  -- Only products where stock IS NOT NULL are tracked.
  FOR v_chk IN
    SELECT p.nombre, p.stock, oi.cantidad
    FROM   order_items oi
    JOIN   products p ON p.id = oi.product_id
    WHERE  oi.order_id = p_order_id
      AND  p.stock IS NOT NULL
  LOOP
    IF v_chk.stock < v_chk.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %',
        v_chk.nombre, v_chk.stock, v_chk.cantidad;
    END IF;
  END LOOP;

  -- ── Stock validation 2: recipe ingredient stock (aggregated) ─────────────
  -- Aggregate total required per ingredient across all items in the order,
  -- then compare against current inventory_items.stock_actual.
  FOR v_chk IN
    SELECT
      inv.nombre        AS ingredient,
      inv.stock_actual,
      SUM(r.cantidad_consumida * oi.cantidad) AS required
    FROM   order_items    oi
    JOIN   recipes        r   ON r.product_id        = oi.product_id
    JOIN   inventory_items inv ON inv.id              = r.inventory_item_id
    WHERE  oi.order_id = p_order_id
    GROUP  BY inv.id, inv.nombre, inv.stock_actual
  LOOP
    IF v_chk.stock_actual < v_chk.required THEN
      RAISE EXCEPTION 'Ingrediente insuficiente "%": disponible %, requerido %',
        v_chk.ingredient, v_chk.stock_actual, v_chk.required;
    END IF;
  END LOOP;

  -- ── Calculate totals ──────────────────────────────────────────────────────
  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
  FROM   order_items
  WHERE  order_id = p_order_id;

  v_base      := GREATEST(v_subtotal - COALESCE(p_descuento, 0), 0);
  v_impuestos := ROUND(v_base * COALESCE(p_iva_porcentaje, 15) / 100, 2);
  v_total     := v_base + v_impuestos;

  -- ── Payment validation ────────────────────────────────────────────────────
  IF v_total > 0 AND jsonb_array_length(COALESCE(p_payments, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'Debe registrar al menos un pago';
  END IF;

  FOR v_pay IN SELECT * FROM jsonb_array_elements(COALESCE(p_payments, '[]'::jsonb))
  LOOP
    v_monto := (v_pay->>'monto')::numeric;
    IF v_monto IS NULL OR v_monto <= 0 THEN
      RAISE EXCEPTION 'Cada pago debe tener un monto mayor a cero';
    END IF;
    v_payments_sum := v_payments_sum + v_monto;
  END LOOP;

  v_payments_sum := ROUND(v_payments_sum, 2);

  IF v_total > 0 AND v_payments_sum < v_total - 0.01 THEN
    RAISE EXCEPTION 'Pago insuficiente: falta C$ %', ROUND(v_total - v_payments_sum, 2);
  END IF;

  -- ── Insert sale ───────────────────────────────────────────────────────────
  INSERT INTO sales (
    order_id, restaurant_id, cajero_id, subtotal, descuento, impuestos, total, estado
  ) VALUES (
    p_order_id, v_order.restaurant_id, p_cajero_id,
    v_subtotal, COALESCE(p_descuento, 0), v_impuestos, v_total, 'completada'
  )
  RETURNING id INTO v_sale_id;

  FOR v_pay IN SELECT * FROM jsonb_array_elements(COALESCE(p_payments, '[]'::jsonb))
  LOOP
    v_pm_id := (v_pay->>'payment_method_id')::uuid;
    v_monto := (v_pay->>'monto')::numeric;

    INSERT INTO payments (
      sale_id, payment_method_id, bank_id, referencia, nota, monto
    ) VALUES (
      v_sale_id,
      v_pm_id,
      NULLIF(v_pay->>'bank_id', '')::uuid,
      NULLIF(v_pay->>'referencia', ''),
      NULLIF(v_pay->>'nota', ''),
      v_monto
    );
  END LOOP;

  UPDATE orders SET estado = 'cerrado' WHERE id = p_order_id;

  -- ── Deduct inventory (best-effort; validation already passed above) ───────
  BEGIN
    PERFORM public.process_sale_inventory(v_sale_id);
    UPDATE sales SET inventory_processed = true WHERE id = v_sale_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN json_build_object(
    'sale_id',    v_sale_id,
    'idempotent', false,
    'total',      v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale(uuid, uuid, numeric, numeric, jsonb) TO authenticated;

-- 2. Trigger to block sale updates and deletes on closed registers
CREATE OR REPLACE FUNCTION public.check_sale_modification_allowed()
RETURNS TRIGGER AS $$
DECLARE
  v_cajero_id uuid;
  v_restaurant_id uuid;
  v_fecha timestamp with time zone;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cajero_id := OLD.cajero_id;
    v_restaurant_id := OLD.restaurant_id;
    v_fecha := OLD.fecha;
  ELSE
    v_cajero_id := OLD.cajero_id;
    v_restaurant_id := OLD.restaurant_id;
    v_fecha := OLD.fecha;
  END IF;

  -- Verify if there is a closed cash register for this cashier and date
  IF EXISTS (
    SELECT 1 FROM cash_registers
    WHERE restaurant_id = v_restaurant_id
      AND usuario_id = v_cajero_id
      AND estado = 'cerrada'
      AND v_fecha BETWEEN fecha_apertura AND fecha_cierre
  ) THEN
    RAISE EXCEPTION 'No se puede modificar ni eliminar una venta que pertenece a un cierre de caja completado';
  END IF;

  -- If updating, block modification of critical fields
  IF TG_OP = 'UPDATE' THEN
    -- Allow changing simple audit details if needed, but not financial totals
    IF NEW.total IS DISTINCT FROM OLD.total OR NEW.cajero_id IS DISTINCT FROM OLD.cajero_id OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id THEN
      -- If it's already closed, it's blocked. But even if it's open, restrict editing completed sales
      IF OLD.estado = 'completada' AND NEW.estado = 'completada' THEN
        RAISE EXCEPTION 'Las ventas completadas no pueden ser modificadas directamente';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_sale_modification ON sales;

CREATE TRIGGER trg_check_sale_modification
BEFORE UPDATE OR DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION public.check_sale_modification_allowed();
