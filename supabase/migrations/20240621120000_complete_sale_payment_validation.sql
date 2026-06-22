-- Valida que la suma de pagos cubra el total antes de completar la venta.
-- Reemplaza complete_sale con validación de pagos múltiples.

DROP FUNCTION IF EXISTS public.complete_sale(uuid, uuid, numeric, numeric, jsonb);

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_order_id uuid,
  p_cajero_id uuid,
  p_descuento numeric DEFAULT 0,
  p_iva_porcentaje numeric DEFAULT 15,
  p_payments jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_sale_id uuid;
  v_subtotal numeric;
  v_base numeric;
  v_impuestos numeric;
  v_total numeric;
  v_existing_sale sales%ROWTYPE;
  v_payments_sum numeric := 0;
  v_pay jsonb;
  v_pm_id uuid;
  v_monto numeric;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.restaurant_id IS DISTINCT FROM public.get_my_restaurant_id() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_existing_sale FROM sales WHERE order_id = p_order_id LIMIT 1;
  IF FOUND THEN
    RETURN json_build_object(
      'sale_id', v_existing_sale.id,
      'idempotent', true,
      'total', v_existing_sale.total
    );
  END IF;

  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
  FROM order_items WHERE order_id = p_order_id;

  v_base := GREATEST(v_subtotal - COALESCE(p_descuento, 0), 0);
  v_impuestos := ROUND(v_base * COALESCE(p_iva_porcentaje, 15) / 100, 2);
  v_total := v_base + v_impuestos;

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

  BEGIN
    PERFORM public.process_sale_inventory(v_sale_id);
    UPDATE sales SET inventory_processed = true WHERE id = v_sale_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN json_build_object(
    'sale_id', v_sale_id,
    'idempotent', false,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale(uuid, uuid, numeric, numeric, jsonb) TO authenticated;
