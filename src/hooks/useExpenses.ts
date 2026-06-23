import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import { getLocalDateISO, getLocalRangeBoundsISO, coerceDateISO } from '../lib/dates';
import type { Tables, TablesInsert } from '../lib/database.types';

export type Expense = Tables<'expenses'>;

export function useExpenses(dateFrom?: string, dateTo?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getLocalDateISO();
  const from = coerceDateISO(dateFrom ?? today);
  const to = coerceDateISO(dateTo ?? today);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const bounds = getLocalRangeBoundsISO(from, to);
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .gte('fecha', bounds.start)
      .lte('fecha', bounds.end)
      .order('fecha', { ascending: false });

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setExpenses(data ?? []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const createExpense = useCallback(async (
    data: Omit<TablesInsert<'expenses'>, 'restaurant_id'>
  ) => {
    const { data: created, error: err } = await supabase
      .from('expenses')
      .insert({ ...data, restaurant_id: RESTAURANT_ID })
      .select('id');
    if (err) throw err;
    if (!created?.length) {
      throw new Error('No se pudo registrar el gasto. Verifique sus permisos.');
    }
    await fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const { data, error: err } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', RESTAURANT_ID)
      .select('id');
    if (err) throw err;
    if (!data?.length) {
      throw new Error('No se pudo eliminar el gasto. Verifique sus permisos.');
    }
    await fetchExpenses();
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'restaurant_id' | 'created_at'>>
  ) => {
    const { data, error: err } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('restaurant_id', RESTAURANT_ID)
      .select('id');
    if (err) throw err;
    if (!data?.length) {
      throw new Error('No se pudo actualizar el gasto. Verifique sus permisos.');
    }
    await fetchExpenses();
  }, [fetchExpenses]);

  const getByCategory = useCallback(() => {
    return expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoria] = (acc[e.categoria] ?? 0) + e.monto;
      return acc;
    }, {});
  }, [expenses]);

  const total = expenses.reduce((s, e) => s + e.monto, 0);

  return { expenses, loading, error, total, refetch: fetchExpenses, createExpense, updateExpense, deleteExpense, getByCategory };
}
