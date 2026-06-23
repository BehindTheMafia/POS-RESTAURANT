import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import { getLocalDateISO, getLocalDayBoundsISO, getLocalRangeBoundsISO, coerceDateISO } from '../lib/dates';

export interface SaleReportItem {
  id: string;
  fecha: string;
  estado: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  inventory_processed: boolean;
  cliente: string;
  cajero_id: string | null;
  cajero: { id: string; nombre: string } | null;
  orders: {
    id: string;
    mesa_id: string | null;
    mesero_id: string | null;
    mesa: { id: string; nombre: string; numero: number } | null;
    mesero: { id: string; nombre: string } | null;
    order_items: Array<{
      id: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      product: {
        id: string;
        nombre: string;
        category_id: string | null;
        categories: { id: string; nombre: string } | null;
      } | null;
    }>;
  } | null;
  payments: Array<{
    id: string;
    monto: number;
    referencia: string | null;
    nota: string | null;
    payment_method: { id: string; nombre: string } | null;
  }>;
}

export function useSalesReports(dateFrom: string, dateTo: string) {
  const safeFrom = coerceDateISO(dateFrom);
  const safeTo = coerceDateISO(dateTo);
  const [sales, setSales] = useState<SaleReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lists for filters
  const [cajeros, setCajeros] = useState<Array<{ id: string; nombre: string }>>([]);
  const [mesas, setMesas] = useState<Array<{ id: string; nombre: string; numero: number }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; nombre: string }>>([]);

  // Absolute metrics
  const [totalToday, setTotalToday] = useState(0);
  const [totalMonth, setTotalMonth] = useState(0);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStr = getLocalDateISO();
      const startOfMonthStr = getLocalDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      const rangeBounds = getLocalRangeBoundsISO(safeFrom, safeTo);
      const todayBounds = getLocalDayBoundsISO(todayStr);
      const monthBounds = getLocalRangeBoundsISO(startOfMonthStr, todayStr);

      // 1. Fetch sales with deep joins & absolute totals
      const [salesRes, salesTodayRes, salesMonthRes, cajerosRes, mesasRes, pmRes] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            id,
            fecha,
            estado,
            subtotal,
            descuento,
            impuestos,
            total,
            inventory_processed,
            cliente,
            cajero_id,
            cajero:users!sales_cajero_id_fkey(id, nombre),
            orders(
              id,
              mesa_id,
              mesero_id,
              mesa:tables_restaurant(id, nombre, numero),
              mesero:users(id, nombre),
              order_items(
                id,
                cantidad,
                precio_unitario,
                subtotal,
                product:products(
                  id,
                  nombre,
                  category_id,
                  categories:categories(id, nombre)
                )
              )
            ),
            payments(
              id,
              monto,
              referencia,
              nota,
              payment_method:payment_methods(id, nombre)
            )
          `)
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('fecha', rangeBounds.start)
          .lte('fecha', rangeBounds.end)
          .order('fecha', { ascending: false }),
        supabase
          .from('sales')
          .select('total')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('estado', 'completada')
          .gte('fecha', todayBounds.start)
          .lte('fecha', todayBounds.end),
        supabase
          .from('sales')
          .select('total')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('estado', 'completada')
          .gte('fecha', monthBounds.start)
          .lte('fecha', monthBounds.end),
        supabase.from('users').select('id, nombre').eq('restaurant_id', RESTAURANT_ID).order('nombre'),
        supabase.from('tables_restaurant').select('id, nombre, numero').eq('restaurant_id', RESTAURANT_ID).order('nombre'),
        supabase.from('payment_methods').select('id, nombre').eq('restaurant_id', RESTAURANT_ID).order('nombre')
      ]);

      if (salesRes.error) throw salesRes.error;

      setSales((salesRes.data as unknown as SaleReportItem[]) ?? []);
      if (cajerosRes.data) setCajeros(cajerosRes.data);
      if (mesasRes.data) setMesas(mesasRes.data);
      if (pmRes.data) setPaymentMethods(pmRes.data);

      const sumToday = (salesTodayRes.data ?? []).reduce((sum, s) => sum + Number(s.total), 0);
      const sumMonth = (salesMonthRes.data ?? []).reduce((sum, s) => sum + Number(s.total), 0);
      setTotalToday(sumToday);
      setTotalMonth(sumMonth);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener reporte de ventas');
    } finally {
      setLoading(false);
    }
  }, [safeFrom, safeTo]);

  const cancelSale = useCallback(async (saleId: string, motivo: string, usuarioId: string) => {
    const { data, error: err } = await supabase.rpc('cancel_sale', {
      p_sale_id: saleId,
      p_motivo: motivo,
      p_usuario_id: usuarioId,
    });
    if (err) throw err;
    await fetchReportsData();
    return data;
  }, [fetchReportsData]);

  const deleteSale = useCallback(async (saleId: string, usuarioId: string) => {
    const { data, error: err } = await supabase.rpc('delete_sale', {
      p_sale_id: saleId,
      p_usuario_id: usuarioId,
    });
    if (err) throw err;
    await fetchReportsData();
    return data;
  }, [fetchReportsData]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  return {
    sales,
    loading,
    error,
    cajeros,
    mesas,
    paymentMethods,
    totalToday,
    totalMonth,
    refetch: fetchReportsData,
    cancelSale,
    deleteSale,
  };
}
