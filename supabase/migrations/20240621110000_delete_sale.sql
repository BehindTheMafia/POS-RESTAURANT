-- Permite eliminar permanentemente una venta (solo admin).
-- Si la venta está completada, primero revierte inventario vía cancel_sale.

CREATE OR REPLACE FUNCTION public.delete_sale(
  p_sale_id uuid,
  p_usuario_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale sales%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden eliminar ventas';
  END IF;

  SELECT * INTO v_sale
  FROM sales
  WHERE id = p_sale_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_sale.restaurant_id IS DISTINCT FROM public.get_my_restaurant_id() THEN
    RAISE EXCEPTION 'No autorizado para eliminar esta venta';
  END IF;

  IF v_sale.estado = 'completada' THEN
    PERFORM public.cancel_sale(
      p_sale_id,
      'Eliminación permanente de venta',
      p_usuario_id
    );
  END IF;

  PERFORM public.log_table_audit(
    'VENTA_ELIMINADA',
    'sales',
    v_sale.id::text,
    v_sale.restaurant_id,
    to_jsonb(v_sale),
    NULL
  );

  DELETE FROM payments WHERE sale_id = p_sale_id;
  DELETE FROM sales WHERE id = p_sale_id;

  RETURN json_build_object('success', true, 'sale_id', p_sale_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_sale(uuid, uuid) TO authenticated;
