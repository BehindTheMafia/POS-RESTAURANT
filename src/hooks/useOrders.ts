import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert } from '../lib/database.types';

export type OrderItem = Tables<'order_items'>;
export type Order = Tables<'orders'> & {
  order_items: OrderItem[];
};

export function useOrders(mesaId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('estado', 'abierto')
      .order('created_at', { ascending: false });

    if (mesaId) query = query.eq('mesa_id', mesaId);

    const { data, error: err } = await query;
    if (err) { setError(err.message); }
    else { setOrders((data ?? []) as unknown as Order[]); }
    setLoading(false);
  }, [mesaId]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel(`orders-${mesaId ?? 'all'}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `restaurant_id=eq.${RESTAURANT_ID}`,
      }, () => fetchOrders())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'order_items',
      }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, mesaId]);

  const createOrder = useCallback(async (
    mesaId: string,
    meseroId: string,
    observaciones?: string,
    options?: { skipTableStatus?: boolean }
  ): Promise<string> => {
    const { data, error: err } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        mesa_id: mesaId,
        mesero_id: meseroId,
        estado: 'abierto',
        observaciones,
      })
      .select('id')
      .single();
    if (err) throw err;

    if (!options?.skipTableStatus) {
      const { error: tableErr } = await supabase
        .from('tables_restaurant')
        .update({ estado: 'ocupada' })
        .eq('id', mesaId)
      if (tableErr) throw tableErr
    }

    return data.id;
  }, []);

  const addOrderItem = useCallback(async (
    orderId: string,
    item: Omit<TablesInsert<'order_items'>, 'order_id' | 'subtotal'>
  ) => {
    const { error: err } = await supabase
      .from('order_items')
      .insert({
        ...item,
        order_id: orderId,
        subtotal: item.precio_unitario * item.cantidad,
      });
    if (err) throw err;
  }, []);

  const updateOrderItemQty = useCallback(async (itemId: string, cantidad: number, precioUnitario: number) => {
    const { error: err } = await supabase
      .from('order_items')
      .update({ cantidad, subtotal: precioUnitario * cantidad })
      .eq('id', itemId);
    if (err) throw err;
  }, []);

  const removeOrderItem = useCallback(async (itemId: string) => {
    const { error: err } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);
    if (err) throw err;
  }, []);

  const cancelOrder = useCallback(async (orderId: string, mesaId: string, options?: { skipTableStatus?: boolean }) => {
    const { error: err } = await supabase
      .from('orders')
      .update({ estado: 'anulado' })
      .eq('id', orderId);
    if (err) throw err;

    if (!options?.skipTableStatus) {
      await supabase
        .from('tables_restaurant')
        .update({ estado: 'libre' })
        .eq('id', mesaId);
    }
  }, []);

  const getOrderByMesa = useCallback((mesaId: string): Order | null => {
    return orders.find(o => o.mesa_id === mesaId && o.estado === 'abierto') ?? null;
  }, [orders]);

  return {
    orders, loading, error, refetch: fetchOrders,
    createOrder, addOrderItem, updateOrderItemQty, removeOrderItem, cancelOrder, getOrderByMesa,
  };
}
