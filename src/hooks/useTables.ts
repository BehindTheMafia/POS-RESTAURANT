import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type RestaurantTable = Tables<'tables_restaurant'>;

export function useTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelIdRef = useRef(`tables-realtime-${crypto.randomUUID()}`);

  const fetchTables = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('tables_restaurant')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('numero', { ascending: true });

    if (err) { setError(err.message); }
    else { setTables(data ?? []); }
    setLoading(false);
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
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTables(prev =>
              prev.map(t => t.id === (payload.new as RestaurantTable).id
                ? payload.new as RestaurantTable : t
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setTables(prev => [...prev, payload.new as RestaurantTable]
              .sort((a, b) => a.numero - b.numero)
            );
          } else if (payload.eventType === 'DELETE') {
            setTables(prev => prev.filter(t => t.id !== (payload.old as RestaurantTable).id));
          }
        }
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
