-- Audit triggers for critical configuration and user changes

CREATE OR REPLACE FUNCTION public.log_table_audit(
  p_accion text,
  p_tabla text,
  p_registro_id text,
  p_restaurant_id uuid,
  p_valor_anterior jsonb,
  p_valor_nuevo jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (restaurant_id, usuario_id, accion, tabla, registro_id, valor_anterior, valor_nuevo)
  VALUES (p_restaurant_id, auth.uid(), p_accion, p_tabla, p_registro_id, p_valor_anterior, p_valor_nuevo);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_restaurants_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_table_audit(
    'CONFIGURACION_RESTAURANTE',
    TG_TABLE_NAME,
    NEW.id::text,
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_table_audit(
    'CONFIGURACION_TICKET',
    TG_TABLE_NAME,
    NEW.id::text,
    NEW.restaurant_id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_users_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  v_action := CASE
    WHEN TG_OP = 'INSERT' THEN 'USUARIO_CREADO'
    WHEN TG_OP = 'UPDATE' AND NEW.activo = false AND OLD.activo = true THEN 'USUARIO_DESACTIVADO'
    WHEN TG_OP = 'UPDATE' AND NEW.activo = true AND OLD.activo = false THEN 'USUARIO_ACTIVADO'
    ELSE 'USUARIO_ACTUALIZADO'
  END;

  PERFORM public.log_table_audit(
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    COALESCE(NEW.restaurant_id, OLD.restaurant_id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_restaurants_update ON public.restaurants;
CREATE TRIGGER tr_audit_restaurants_update
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.audit_restaurants_change();

DROP TRIGGER IF EXISTS tr_audit_settings_change ON public.settings;
CREATE TRIGGER tr_audit_settings_change
  AFTER INSERT OR UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_settings_change();

DROP TRIGGER IF EXISTS tr_audit_users_change ON public.users;
CREATE TRIGGER tr_audit_users_change
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_users_change();
