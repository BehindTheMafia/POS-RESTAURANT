import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert } from '../lib/database.types';

export type CashRegister = Tables<'cash_registers'>;
export type CashMovement = Tables<'cash_movements'>;

export type CashRegisterWithMovements = CashRegister & {
  cash_movements: CashMovement[];
};

export function useCashRegister() {
  const [activeRegister, setActiveRegister] = useState<CashRegisterWithMovements | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegister = useCallback(async () => {
    setError(null)
    const { data: active, error: activeErr } = await supabase
      .from('cash_registers')
      .select('*, cash_movements(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeErr && activeErr.code !== 'PGRST116') {
      setError(activeErr.message)
    }

    setActiveRegister((active as unknown as CashRegisterWithMovements) ?? null)

    const { data: hist, error: histErr } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('fecha_apertura', { ascending: false })
      .limit(30)

    if (histErr) setError(histErr.message)
    setHistory(hist ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRegister(); }, [fetchRegister]);

  const openRegister = useCallback(async (usuarioId: string, montoInicial: number): Promise<string> => {
    const { data, error: err } = await supabase.rpc('open_cash_register', {
      p_restaurant_id: RESTAURANT_ID,
      p_usuario_id:    usuarioId,
      p_monto_inicial: montoInicial,
    });
    if (err) throw err;
    await fetchRegister();
    return data as string;
  }, [fetchRegister]);

  const addMovement = useCallback(async (
    registerId: string,
    tipo: 'ingreso' | 'egreso' | 'propina',
    concepto: string,
    monto: number,
    usuarioId: string
  ) => {
    const { error: err } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: registerId,
        tipo,
        concepto,
        monto,
        usuario_id: usuarioId,
      } satisfies TablesInsert<'cash_movements'>);
    if (err) throw err;
    await fetchRegister();
  }, [fetchRegister]);

  const getTotals = useCallback(() => {
    if (!activeRegister) return { ingresos: 0, egresos: 0, propinas: 0, saldo: 0 };
    const movs = activeRegister.cash_movements ?? [];
    const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
    const propinas = movs.filter(m => m.tipo === 'propina').reduce((s, m) => s + m.monto, 0);
    const egresos = movs.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
    return {
      ingresos,
      egresos,
      propinas,
      saldo: activeRegister.monto_inicial + ingresos + propinas - egresos,
    };
  }, [activeRegister]);

  return { activeRegister, history, loading, error, refetch: fetchRegister, openRegister, addMovement, getTotals };
}
