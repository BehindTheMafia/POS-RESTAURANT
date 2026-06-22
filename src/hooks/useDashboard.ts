import { useState, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';

export type DashboardStats = {
  ventas_total: number;
  ventas_count: number;
  descuentos_total: number;
  anulaciones_count: number;
  anulaciones_total: number;
  ticket_promedio: number;
};

export type TopProduct = {
  nombre: string;
  cantidad_vendida: number;
  total_ventas: number;
};

export type SalesByPayment = {
  dia: string | null;
  metodo_pago: string | null;
  banco: string | null;
  num_pagos: number | null;
  total_monto: number | null;
};

export type InventoryLowItem = {
  id: string | null;
  nombre: string | null;
  unidad: string | null;
  stock_actual: number | null;
  stock_minimo: number | null;
  diferencia: number | null;
  costo_reposicion: number | null;
};

export type DashboardData = {
  stats: DashboardStats;
  topProducts: TopProduct[];
  salesByPayment: SalesByPayment[];
  inventoryLow: InventoryLowItem[];
  expenses_total: number;
  loading: boolean;
  error: string | null;
};

const defaultStats: DashboardStats = {
  ventas_total: 0,
  ventas_count: 0,
  descuentos_total: 0,
  anulaciones_count: 0,
  anulaciones_total: 0,
  ticket_promedio: 0,
};

export function useDashboard() {
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error'>>({
    stats: defaultStats,
    topProducts: [],
    salesByPayment: [],
    inventoryLow: [],
    expenses_total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().split('T')[0];
    const from = dateFrom ?? today;
    const to = dateTo ?? today;

    try {
      const [statsResult, topResult, paymentResult, lowResult, expensesResult] = await Promise.all([
        supabase.rpc('get_dashboard_stats', {
          p_restaurant_id: RESTAURANT_ID,
          p_date_from: from,
          p_date_to: to,
        }),
        supabase.rpc('get_top_products', {
          p_restaurant_id: RESTAURANT_ID,
          p_date_from: from,
          p_date_to: to,
          p_limit: 10,
        }),
        supabase
          .from('v_sales_by_payment')
          .select('*')
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('dia', from)
          .lte('dia', to),
        supabase
          .from('v_inventory_low')
          .select('*')
          .eq('restaurant_id', RESTAURANT_ID),
        supabase
          .from('expenses')
          .select('monto')
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('fecha', `${from}T00:00:00`)
          .lte('fecha', `${to}T23:59:59`),
      ]);

      const errors = [
        statsResult.error?.message,
        topResult.error?.message,
        paymentResult.error?.message,
        lowResult.error?.message,
        expensesResult.error?.message,
      ].filter(Boolean)

      if (errors.length > 0) {
        throw new Error(errors[0])
      }

      const stats = (statsResult.data ?? defaultStats) as DashboardStats;
      const topProducts = (Array.isArray(topResult.data) ? topResult.data : []) as TopProduct[];
      const salesByPayment = (paymentResult.data ?? []) as SalesByPayment[];
      const inventoryLow = (lowResult.data ?? []) as InventoryLowItem[];
      const expenses_total = (expensesResult.data ?? []).reduce((s: number, e: any) => s + (e.monto ?? 0), 0);

      setData({ stats, topProducts, salesByPayment, inventoryLow, expenses_total });
    } catch (err: any) {
      setError(err.message ?? 'Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  return { ...data, loading, error, fetchDashboard };
}
