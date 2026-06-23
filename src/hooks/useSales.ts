import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import { getLocalDateISO, getLocalRangeBoundsISO, coerceDateISO } from '../lib/dates';
import type { Tables } from '../lib/database.types';

export type Sale = Tables<'sales'>;
export type Payment = Tables<'payments'>;
export type PaymentMethod = Tables<'payment_methods'>;
export type Bank = Tables<'banks'>;

export type SalePaymentInput = {
  payment_method_id: string;
  bank_id?: string;
  referencia?: string;
  nota?: string;
  monto: number;
};

export type SaleWithDetails = Sale & {
  payments: Payment[];
  orders: Pick<Tables<'orders'>, 'mesa_id' | 'mesero_id'> | null;
};

export function useSales(dateFrom?: string, dateTo?: string) {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getLocalDateISO();
  const from = coerceDateISO(dateFrom ?? today);
  const to = coerceDateISO(dateTo ?? today);
  const bounds = getLocalRangeBoundsISO(from, to);

  const fetchSales = useCallback(async () => {
    const [salesResult, pmResult, banksResult] = await Promise.all([
      supabase
        .from('sales')
        .select('*, payments(*), orders(mesa_id, mesero_id)')
        .eq('restaurant_id', RESTAURANT_ID)
        .gte('fecha', bounds.start)
        .lte('fecha', bounds.end)
        .order('fecha', { ascending: false }),
      supabase.from('payment_methods').select('*').eq('restaurant_id', RESTAURANT_ID).eq('activo', true),
      supabase.from('banks').select('*').eq('restaurant_id', RESTAURANT_ID).eq('activo', true),
    ]);

    if (salesResult.error) setError(salesResult.error.message);
    else setSales((salesResult.data ?? []) as unknown as SaleWithDetails[]);

    if (!pmResult.error) setPaymentMethods(pmResult.data ?? []);
    if (!banksResult.error) setBanks(banksResult.data ?? []);

    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  /**
   * Completar venta via RPC idempotente.
   * Si ya existe una venta para el order_id, retorna la existente sin duplicar.
   */
  const completeSale = useCallback(async (
    orderId: string,
    cajeroId: string,
    payments: SalePaymentInput[],
    descuento: number = 0,
    ivaPercentage: number = 15
  ) => {
    const { data, error: err } = await supabase.rpc('complete_sale', {
      p_order_id:       orderId,
      p_cajero_id:      cajeroId,
      p_descuento:      descuento,
      p_iva_porcentaje: ivaPercentage,
      p_payments:       payments as any,
    });

    if (err) throw err;
    await fetchSales();
    return data as { sale_id: string; idempotent: boolean; total: number };
  }, [fetchSales]);

  const cancelSale = useCallback(async (saleId: string, motivo: string, usuarioId: string) => {
    const { data, error: err } = await supabase.rpc('cancel_sale', {
      p_sale_id:    saleId,
      p_motivo:     motivo,
      p_usuario_id: usuarioId,
    });
    if (err) throw err;
    await fetchSales();
    return data;
  }, [fetchSales]);

  // Configuración de métodos de pago y bancos
  const createPaymentMethod = useCallback(async (nombre: string) => {
    const { error: err } = await supabase.from('payment_methods').insert({ nombre, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
    await fetchSales();
  }, [fetchSales]);

  const togglePaymentMethod = useCallback(async (id: string, activo: boolean) => {
    const { error: err } = await supabase.from('payment_methods').update({ activo }).eq('id', id);
    if (err) throw err;
    await fetchSales();
  }, [fetchSales]);

  const createBank = useCallback(async (nombre: string) => {
    const { error: err } = await supabase.from('banks').insert({ nombre, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
    await fetchSales();
  }, [fetchSales]);

  const toggleBank = useCallback(async (id: string, activo: boolean) => {
    const { error: err } = await supabase.from('banks').update({ activo }).eq('id', id);
    if (err) throw err;
    await fetchSales();
  }, [fetchSales]);

  return {
    sales, paymentMethods, banks, loading, error, refetch: fetchSales,
    completeSale, cancelSale,
    createPaymentMethod, togglePaymentMethod, createBank, toggleBank,
  };
}
