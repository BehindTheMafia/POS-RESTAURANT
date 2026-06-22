import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables } from '../lib/database.types';

export type RestaurantWithSettings = Tables<'restaurants'> & {
  settings: Tables<'settings'> | null;
};

export function useRestaurant() {
  const [restaurant, setRestaurant] = useState<RestaurantWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('restaurants')
      .select('*, settings(*)')
      .eq('id', RESTAURANT_ID)
      .single();

    if (err) { setError(err.message); }
    else { setRestaurant(data as unknown as RestaurantWithSettings); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRestaurant(); }, [fetchRestaurant]);

  const updateRestaurant = useCallback(async (updates: Partial<Tables<'restaurants'>>) => {
    const { error: err } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', RESTAURANT_ID);
    if (err) throw err;
    await fetchRestaurant();
  }, [fetchRestaurant]);

  const updateSettings = useCallback(async (updates: Partial<Tables<'settings'>>) => {
    const { error: err } = await supabase
      .from('settings')
      .update(updates)
      .eq('restaurant_id', RESTAURANT_ID);
    if (err) throw err;
    await fetchRestaurant();
  }, [fetchRestaurant]);

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${RESTAURANT_ID}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-logos')
      .getPublicUrl(path);

    await updateRestaurant({ logo_url: publicUrl });
    return publicUrl;
  }, [updateRestaurant]);

  return { restaurant, loading, error, updateRestaurant, updateSettings, uploadLogo, refetch: fetchRestaurant };
}
