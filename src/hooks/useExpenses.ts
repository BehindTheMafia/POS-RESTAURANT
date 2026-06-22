import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert } from '../lib/database.types';

export type Expense = Tables<'expenses'>;

export function useExpenses(dateFrom?: string, dateTo?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const from = dateFrom ?? today;
  const to = dateTo ?? today;

  const fetchExpenses = useCallback(async () => {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('fecha', { ascending: false });

    if (dateFrom) query = query.gte('fecha', `${from}T00:00:00`);
    if (dateTo)   query = query.lte('fecha', `${to}T23:59:59`);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setExpenses(data ?? []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const createExpense = useCallback(async (
    data: Omit<TablesInsert<'expenses'>, 'restaurant_id'>
  ) => {
    const { error: err } = await supabase
      .from('expenses')
      .insert({ ...data, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
    await fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchExpenses();
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'restaurant_id' | 'created_at'>>
  ) => {
    const { error: err } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
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
