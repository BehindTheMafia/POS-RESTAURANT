import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { TablesInsert, TablesUpdate } from '../lib/database.types';
import { isCounterTable, type RestaurantTable } from '../lib/pos';


const applyOpenOrderStatus = (
  tables: RestaurantTable[],
  openOrderMesaIds: Set<string>
): RestaurantTable[] =>
  tables.map(t => {
    if (t.estado === 'inactiva' || isCounterTable(t)) return t
    if (openOrderMesaIds.has(t.id)) return { ...t, estado: 'ocupada' }
    return t
  })

export function useTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelIdRef = useRef(`tables-realtime-${crypto.randomUUID()}`);

  const fetchTables = useCallback(async () => {
    const [tablesRes, ordersRes] = await Promise.all([
      supabase
        .from('tables_restaurant')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('numero', { ascending: true }),
      supabase
        .from('orders')
        .select('mesa_id')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('estado', 'abierto'),
    ]);

    if (tablesRes.error) {
      setError(tablesRes.error.message)
      setLoading(false)
      return
    }

    const openOrderMesaIds = new Set(
      (ordersRes.data ?? []).map(o => o.mesa_id).filter((id): id is string => !!id)
    )

    setTables(applyOpenOrderStatus((tablesRes.data ?? []) as RestaurantTable[], openOrderMesaIds))
    setLoading(false)
  }, []);

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel(channelIdRef.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables_restaurant',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        () => { fetchTables() }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        () => { fetchTables() }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTables]);

  const createTable = useCallback(async (data: Omit<TablesInsert<'tables_restaurant'>, 'restaurant_id'>) => {
    const { error: err } = await supabase
      .from('tables_restaurant')
      .insert({ ...data, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
  }, []);

  const updateTable = useCallback(async (id: string, updates: TablesUpdate<'tables_restaurant'>) => {
    const { error: err } = await supabase
      .from('tables_restaurant')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
  }, []);

  const deleteTable = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('tables_restaurant')
      .delete()
      .eq('id', id);
    if (err) throw err;
  }, []);

  return { tables, loading, error, createTable, updateTable, deleteTable, refetch: fetchTables };
}
