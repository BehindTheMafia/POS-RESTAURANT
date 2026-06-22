import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables } from '../lib/database.types';

export type UserWithRole = Tables<'users'> & {
  roles: Pick<Tables<'roles'>, 'nombre'> | null;
};

export type AuthUser = {
  id: string;
  email: string;
  profile: UserWithRole | null;
  roleName: string | null;
  permissions: string[];
  restaurantId: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async (authId: string, email: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, roles(nombre)')
      .eq('id', authId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      setError('No se pudo cargar el perfil del usuario. Contacte al administrador.');
      return null;
    }

    const typedProfile = profile as unknown as UserWithRole;
    const roleName = typedProfile.roles?.nombre ?? null;

    // Cargar permisos del rol
    let permissions: string[] = [];
    if (profile.role_id) {
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('permissions(codigo)')
        .eq('role_id', profile.role_id);

      permissions = (perms ?? [])
        .map((p: any) => p.permissions?.codigo)
        .filter(Boolean) as string[];
    }

    return {
      id: authId,
      email,
      profile: typedProfile,
      roleName,
      permissions,
      restaurantId: profile.restaurant_id,
    } satisfies AuthUser;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const authUser = await loadUserProfile(session.user.id, session.user.email ?? '');
        if (mounted) {
          setUser(authUser);
          if (!authUser && session.user) {
            setError('No se pudo cargar el perfil del usuario.');
          }
        }
      }
      if (mounted) setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        const authUser = await loadUserProfile(session.user.id, session.user.email ?? '');
        setUser(authUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasPermission = useCallback((permCode: string): boolean => {
    if (!user) return false;
    if (user.roleName === 'admin') return true;
    return user.permissions.includes(permCode);
  }, [user]);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const updateEmail = useCallback(async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }, []);

  return { user, loading, error, signIn, signOut, hasPermission, updatePassword, updateEmail };
}
