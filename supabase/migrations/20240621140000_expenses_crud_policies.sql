-- RLS policies for expenses CRUD (admin manage, authenticated read)

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expenses_select ON expenses;
DROP POLICY IF EXISTS expenses_insert ON expenses;
DROP POLICY IF EXISTS expenses_update ON expenses;
DROP POLICY IF EXISTS expenses_delete ON expenses;

CREATE OR REPLACE FUNCTION public.user_restaurant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM users WHERE id = auth.uid();
$$;

CREATE POLICY expenses_select ON expenses
  FOR SELECT TO authenticated
  USING (restaurant_id = public.user_restaurant_id());

CREATE POLICY expenses_insert ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    restaurant_id = public.user_restaurant_id()
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND (
          r.nombre = 'admin'
          OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = r.id AND p.codigo = 'reports.view'
          )
        )
    )
  );

CREATE POLICY expenses_update ON expenses
  FOR UPDATE TO authenticated
  USING (
    restaurant_id = public.user_restaurant_id()
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.nombre = 'admin'
    )
  )
  WITH CHECK (restaurant_id = public.user_restaurant_id());

CREATE POLICY expenses_delete ON expenses
  FOR DELETE TO authenticated
  USING (
    restaurant_id = public.user_restaurant_id()
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.nombre = 'admin'
    )
  );
