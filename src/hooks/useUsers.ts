import { useState, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesUpdate } from '../lib/database.types';

export type UserWithRole = Tables<'users'> & {
  roles: Pick<Tables<'roles'>, 'id' | 'nombre'> | null;
};

export function useUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Tables<'roles'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [usersResult, rolesResult] = await Promise.all([
      supabase
        .from('users')
        .select('*, roles(id, nombre)')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('nombre', { ascending: true }),
      supabase.from('roles').select('*').order('nombre'),
    ]);
    if (usersResult.error) setError(usersResult.error.message);
    else setUsers((usersResult.data ?? []) as unknown as UserWithRole[]);
    if (!rolesResult.error) setRoles(rolesResult.data ?? []);
    setLoading(false);
  }, []);

  const createUser = useCallback(async (data: {
    nombre: string;
    correo: string;
    telefono?: string;
    role_id: string;
    password: string;
  }) => {
    const { data: result, error: fnErr } = await supabase.functions.invoke('create-user', {
      body: { ...data, restaurant_id: RESTAURANT_ID },
    });

    if (fnErr) {
      if (import.meta.env.DEV) {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: data.correo,
          password: data.password,
          options: { data: { nombre: data.nombre } },
        });
        if (authErr) throw authErr;
        if (!authData.user) throw new Error('No se pudo crear el usuario de autenticación');

        const { error: profileErr } = await supabase.from('users').insert({
          id: authData.user.id,
          restaurant_id: RESTAURANT_ID,
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono ?? null,
          role_id: data.role_id,
          activo: true,
        });
        if (profileErr) throw profileErr;
        await fetchUsers();
        return authData.user.id;
      }
      throw fnErr;
    }

    if (result?.error) throw new Error(result.error);
    await fetchUsers();
    return result.id as string;
  }, [fetchUsers]);

  const resetUserPassword = useCallback(async (userId: string, password: string) => {
    const { data: result, error: fnErr } = await supabase.functions.invoke('reset-user-password', {
      body: { user_id: userId, password },
    });
    if (fnErr) throw fnErr;
    if (result?.error) throw new Error(result.error);
  }, []);

  const updateUser = useCallback(async (id: string, updates: TablesUpdate<'users'>) => {
    const { error: err } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
    await fetchUsers();
  }, [fetchUsers]);

  const toggleUserActive = useCallback(async (id: string, activo: boolean) => {
    await updateUser(id, { activo });
  }, [updateUser]);

  return { users, roles, loading, error, fetchUsers, createUser, updateUser, toggleUserActive, resetUserPassword };
}
