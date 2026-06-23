import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type InventoryItem = Tables<'inventory_items'>;
export type InventoryLow = {
  id: string | null; nombre: string | null; unidad: string | null;
  stock_actual: number | null; stock_minimo: number | null;
  diferencia: number | null; costo_unitario: number | null; costo_reposicion: number | null;
};

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowItems, setLowItems] = useState<InventoryLow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const [inventResult, lowResult] = await Promise.all([
      supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('nombre', { ascending: true }),
      supabase
        .from('v_inventory_low')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID),
    ]);

    if (inventResult.error) setError(inventResult.error.message);
    else setItems(inventResult.data ?? []);

    if (!lowResult.error) setLowItems((lowResult.data ?? []) as InventoryLow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = useCallback(async (data: Omit<TablesInsert<'inventory_items'>, 'restaurant_id'>) => {
    const { error: err } = await supabase
      .from('inventory_items')
      .insert({ ...data, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
    await fetchItems();
  }, [fetchItems]);

  const updateItem = useCallback(async (id: string, updates: TablesUpdate<'inventory_items'>) => {
    const { error: err } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
    await fetchItems();
  }, [fetchItems]);

  const deactivateItem = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('inventory_items')
      .update({ activo: false })
      .eq('id', id);
    if (err) throw err;
    await fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchItems();
  }, [fetchItems]);

  return { items, lowItems, loading, error, refetch: fetchItems, createItem, updateItem, deactivateItem, deleteItem };
}
