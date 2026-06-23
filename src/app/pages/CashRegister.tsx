import React, { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Plus, Minus, DollarSign, RefreshCw, History, Lock, Unlock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCashRegister } from '../../hooks/useCashRegister';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';

export function CashRegister() {
  const { activeRegister, history, loading, openRegister, closeRegister, closeRegisterDetailed, addMovement, getTotals, refetch } = useCashRegister();
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const currency = restaurant?.moneda ?? 'C$';
  const [openAmount, setOpenAmount] = useState('');
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [movType, setMovType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movConcepto, setMovConcepto] = useState('');
  const [movMonto, setMovMonto] = useState('');
  const [addingMov, setAddingMov] = useState(false);
  const [closeResult, setCloseResult] = useState<{ total_ventas: number; total_ingresos: number; total_egresos: number; balance: number } | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const showConfirm = (d: ConfirmDialogState) => setDialog(d)
  const handleDialogConfirm = async (input?: string) => {
    if (!dialog) return
    setDialogLoading(true)
    try { await dialog.onConfirm(input) }
    finally { setDialogLoading(false); setDialog(null) }
  }

  // Detailed closure state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [salesDuringSession, setSalesDuringSession] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [expandedRegisterId, setExpandedRegisterId] = useState<string | null>(null);

  const totals = getTotals();

  async function handleOpen(e: FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setOpening(true);
    try {
      await openRegister(user.id, parseFloat(openAmount) || 0);
      setOpenAmount('');
      toast.success('Caja abierta exitosamente');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOpening(false);
    }
  }

  async function startCloseFlow() {
    if (!activeRegister || !user?.id) return;
    setLoadingSales(true);
    setShowCloseModal(true);
    setPhysicalCash('');
    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select('*, payments(*, payment_methods(*))')
        .eq('cajero_id', user.id)
        .eq('estado', 'completada')
        .gte('fecha', activeRegister.fecha_apertura);
      if (err) throw err;
      setSalesDuringSession(data ?? []);
    } catch (err: any) {
      toast.error('Error al cargar ventas del turno: ' + err.message);
    } finally {
      setLoadingSales(false);
    }
  }

  async function handleConfirmCloseDetailed() {
    if (!activeRegister || !user?.id) return;
    const cashReal = parseFloat(physicalCash);
    if (isNaN(cashReal)) {
      toast.error('Por favor ingresa un monto válido de efectivo físico.');
      return;
    }
    setClosing(true);
    try {
      // Calculate payment breakdown
      const paymentBreakdown: Record<string, number> = {};
      salesDuringSession.forEach(sale => {
        sale.payments?.forEach((p: any) => {
          const methodName = p.payment_methods?.nombre || 'Otro';
          paymentBreakdown[methodName] = (paymentBreakdown[methodName] || 0) + p.monto;
        });
      });
      const cashSales = paymentBreakdown['Efectivo'] || 0;
      const expectedCash = activeRegister.monto_inicial + cashSales + totals.ingresos - totals.egresos;
      const diff = cashReal - expectedCash;
      const totalSalesAmount = salesDuringSession.reduce((sum, s) => sum + s.total, 0);

      const details = {
        monto_inicial: activeRegister.monto_inicial,
        ventas_totales: totalSalesAmount,
        pagos_por_metodo: paymentBreakdown,
        ingresos_caja: totals.ingresos,
        egresos_caja: totals.egresos,
        movimientos: activeRegister.cash_movements,
      };

      // Call database RPC to close
      await closeRegister(activeRegister.id, user.id);
      
      // Update with detailed statistics
      await closeRegisterDetailed(activeRegister.id, cashReal, expectedCash, diff, details);

      toast.success('Caja cerrada exitosamente');
      setCloseResult({
        total_ventas: totalSalesAmount,
        total_ingresos: totals.ingresos,
        total_egresos: totals.egresos,
        balance: cashReal,
      });
      setShowCloseModal(false);
      setPhysicalCash('');
    } catch (err: any) {
      toast.error('Error al cerrar caja: ' + err.message);
    } finally {
      setClosing(false);
    }
  }

  async function handleAddMovement(e: FormEvent) {
    e.preventDefault();
    if (!activeRegister || !user?.id || !movConcepto || !movMonto) return;
    setAddingMov(true);
    try {
      await addMovement(activeRegister.id, movType, movConcepto, parseFloat(movMonto), user.id);
      setMovConcepto('');
      setMovMonto('');
      setShowMovement(false);
      toast.success(`${movType === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingMov(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Caja"
        subtitle={
          activeRegister ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Caja abierta desde {new Date(activeRegister.fecha_apertura).toLocaleTimeString('es-NI')}
            </span>
          ) : 'Sin caja abierta'
        }
        actions={
          <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
            <RefreshCw size={16} />
          </Button>
        }
      />

      {/* Resultado de cierre */}
      {closeResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-muted border border-brand/20 rounded-2xl p-5"
        >
          <h3 className="font-semibold text-brand mb-3">Resumen de Cierre de Caja</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Ventas', value: closeResult.total_ventas, color: 'text-success' },
              { label: 'Ingresos', value: closeResult.total_ingresos, color: 'text-brand' },
              { label: 'Egresos', value: closeResult.total_egresos, color: 'text-destructive' },
              { label: 'Balance Final', value: closeResult.balance, color: 'text-gray-900' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{currency} {stat.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setCloseResult(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
            Cerrar
          </button>
        </motion.div>
      )}

      {/* Sin caja abierta */}
      {!activeRegister ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand-muted rounded-2xl flex items-center justify-center mb-4">
            <CreditCard size={28} className="text-brand" />
          </div>
          <h3 className="text-gray-800 font-semibold mb-2">Abrir Caja</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">Ingresa el monto inicial para comenzar a trabajar</p>
          <form onSubmit={handleOpen} className="flex gap-3 w-full max-w-xs">
            <input
              type="number" min="0" step="0.01"
              value={openAmount}
              onChange={e => setOpenAmount(e.target.value)}
              placeholder={`Monto inicial (${currency})`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
              required
            />
            <button type="submit" disabled={opening}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
              <Unlock size={14} />
              {opening ? 'Abriendo...' : 'Abrir'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Totales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Monto Inicial', value: activeRegister.monto_inicial, icon: <DollarSign size={18} />, cls: 'bg-gray-100 text-gray-500' },
              { label: 'Ingresos', value: totals.ingresos, icon: <Plus size={18} />, cls: 'bg-success-muted text-success' },
              { label: 'Egresos', value: totals.egresos, icon: <Minus size={18} />, cls: 'bg-destructive-muted text-destructive' },
              { label: 'Saldo Actual', value: totals.saldo, icon: <CreditCard size={18} />, cls: 'bg-brand-muted text-brand' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.cls}`}>
                  {card.icon}
                </div>
                <p className="text-gray-500 text-xs">{card.label}</p>
                <p className="text-gray-900 font-bold text-xl mt-1">{currency} {card.value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setMovType('ingreso'); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium cursor-pointer"
            >
              <Plus size={15} /> Registrar Ingreso
            </button>
            <button
              onClick={() => { setMovType('egreso'); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium cursor-pointer"
            >
              <Minus size={15} /> Registrar Egreso
            </button>
             <button
              onClick={startCloseFlow}
              disabled={closing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-205 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 ml-auto cursor-pointer"
            >
              <Lock size={15} /> {closing ? 'Cerrando...' : 'Cerrar Caja'}
            </button>
          </div>

          {/* Modal movimiento */}
          {showMovement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  Registrar {movType === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  {movType === 'ingreso' ? 'Entrada de efectivo a la caja' : 'Salida de efectivo de la caja'}
                </p>
                <form onSubmit={handleAddMovement} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Concepto</label>
                    <input type="text" value={movConcepto}
                      onChange={e => setMovConcepto(e.target.value)}
                      placeholder="Ej: Pago proveedor, propina..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Monto ({currency})</label>
                    <input type="number" min="0.01" step="0.01" value={movMonto}
                      onChange={e => setMovMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowMovement(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                      Cancelar
                    </button>
                    <button type="submit" disabled={addingMov}
                      className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 ${movType === 'ingreso' ? 'bg-success' : 'bg-destructive'}`}>
                      {addingMov ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Movimientos del día */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Movimientos de Caja</h3>
            </div>
            {activeRegister.cash_movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History size={24} className="text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Sin movimientos registrados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeRegister.cash_movements.map((mov) => (
                  <div key={mov.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      mov.tipo === 'ingreso' ? 'bg-success-muted' : 'bg-destructive-muted'
                    }`}>
                      {mov.tipo === 'ingreso'
                        ? <Plus size={14} className="text-success" />
                        : <Minus size={14} className="text-destructive" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{mov.concepto}</p>
                      <p className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleTimeString('es-NI')}</p>
                    </div>
                    <p className={`font-semibold ${mov.tipo === 'ingreso' ? 'text-success' : 'text-destructive'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} {currency} {mov.monto.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Historial de cajas */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <History size={16} className="text-gray-400" /> Historial de Cajas
            </h3>
          </div>
          <div className="divide-y divide-gray-55">
            {history.map(reg => {
              const isExpanded = expandedRegisterId === reg.id;
              const details = reg.detalles_cierre as any;
              
              return (
                <div key={reg.id} className="border-b border-gray-50 last:border-b-0">
                  {/* Row Header */}
                  <div
                    onClick={() => {
                      if (reg.estado === 'abierta') return;
                      setExpandedRegisterId(isExpanded ? null : reg.id);
                    }}
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                      reg.estado === 'abierta' ? 'bg-success-muted/5 cursor-default' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(reg.fecha_apertura).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(reg.fecha_apertura).toLocaleTimeString('es-NI')}
                        {reg.fecha_cierre && ` → ${new Date(reg.fecha_cierre).toLocaleTimeString('es-NI')}`}
                      </p>
                    </div>

                    <div className="flex-1" />
                    
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">Fondo Inicial</p>
                      <p className="text-sm font-bold text-gray-700">{currency} {reg.monto_inicial.toFixed(2)}</p>
                    </div>

                    {reg.estado === 'cerrada' && reg.monto_cierre_real !== null && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Efectivo Físico</p>
                        <p className="text-sm font-bold text-gray-800">{currency} {Number(reg.monto_cierre_real).toFixed(2)}</p>
                      </div>
                    )}

                    {reg.estado === 'cerrada' && reg.diferencia !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Diferencia</p>
                        <p className={`text-sm font-black ${
                          Number(reg.diferencia) === 0 ? 'text-success'
                          : Number(reg.diferencia) > 0 ? 'text-blue-600'
                          : 'text-destructive'
                        }`}>
                          {Number(reg.diferencia) === 0 ? '0.00'
                          : Number(reg.diferencia) > 0 ? `+${Number(reg.diferencia).toFixed(2)}`
                          : `${Number(reg.diferencia).toFixed(2)}`}
                        </p>
                      </div>
                    )}

                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      reg.estado === 'abierta' ? 'bg-success-muted text-success' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reg.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </span>

                    {reg.estado === 'cerrada' && (
                      <span className="text-gray-400 shrink-0">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    )}
                  </div>

                  {/* Expanded closure details report */}
                  {isExpanded && reg.estado === 'cerrada' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gray-50/50 border-t border-gray-100 px-5 py-4 space-y-4"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Fondo inicial</p>
                          <p className="text-sm font-black text-gray-800 mt-0.5">{currency} {reg.monto_inicial.toFixed(2)}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Ventas Totales</p>
                          <p className="text-sm font-black text-success mt-0.5">{currency} {Number(details?.ventas_totales || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Efectivo Esperado</p>
                          <p className="text-sm font-black text-brand mt-0.5">{currency} {Number(reg.monto_cierre_esperado || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Arqueo Físico</p>
                          <p className="text-sm font-black text-gray-800 mt-0.5">{currency} {Number(reg.monto_cierre_real || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      {details && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Breakdown of payment methods */}
                          {details.pagos_por_metodo && Object.keys(details.pagos_por_metodo).length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                              <p className="text-xs font-bold text-gray-500 border-b border-gray-100 pb-1.5 uppercase tracking-wide">Desglose de ventas por método</p>
                              <div className="space-y-1.5">
                                {Object.entries(details.pagos_por_metodo).map(([method, amount]: any) => (
                                  <div key={method} className="flex justify-between text-xs font-semibold">
                                    <span className="text-gray-500">{method}</span>
                                    <span className="text-gray-800">{currency} {amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cash movements breakdown */}
                          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-bold text-gray-500 border-b border-gray-100 pb-1.5 uppercase tracking-wide">Movimientos manuales del turno</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-success">(+) Total Ingresos</span>
                                <span className="text-success">{currency} {Number(details.ingresos_caja || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-destructive">(-) Total Egresos</span>
                                <span className="text-destructive">{currency} {Number(details.egresos_caja || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja Detallado */}
      <AnimatePresence>
        {showCloseModal && activeRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-gray-150 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Cierre de Caja y Turno</h3>
                  <p className="text-xs text-gray-400">
                    Apertura: {new Date(activeRegister.fecha_apertura).toLocaleString('es-NI')}
                  </p>
                </div>
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingSales ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Calculando montos de ventas y pagos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desglose de Caja */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resumen del Turno</p>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fondo Inicial:</span>
                      <span className="font-bold text-gray-900">{currency} {activeRegister.monto_inicial.toFixed(2)}</span>
                    </div>

                    {/* Desglose de pagos por método */}
                    <div className="border-t border-dashed border-gray-200 my-2 pt-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ventas por Método de Pago</p>
                      {(() => {
                        const breakdown: Record<string, number> = {};
                        salesDuringSession.forEach(sale => {
                          sale.payments?.forEach((p: any) => {
                            const name = p.payment_methods?.nombre || 'Otro';
                            breakdown[name] = (breakdown[name] || 0) + p.monto;
                          });
                        });

                        return Object.entries(breakdown).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No se registraron ventas en este turno</p>
                        ) : (
                          Object.entries(breakdown).map(([method, amount]) => (
                            <div key={method} className="flex justify-between text-sm">
                              <span className="text-gray-500">{method}:</span>
                              <span className="font-bold text-gray-800">{currency} {amount.toFixed(2)}</span>
                            </div>
                          ))
                        );
                      })()}
                    </div>

                    {/* Ingresos / Egresos manuales */}
                    <div className="border-t border-dashed border-gray-200 my-2 pt-2 space-y-1.5">
                      <div className="flex justify-between text-sm text-success">
                        <span>(+) Ingresos de caja:</span>
                        <span className="font-bold">{currency} {totals.ingresos.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-destructive">
                        <span>(-) Egresos de caja:</span>
                        <span className="font-bold">{currency} {totals.egresos.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Efectivo esperado */}
                    {(() => {
                      const breakdown: Record<string, number> = {};
                      salesDuringSession.forEach(sale => {
                        sale.payments?.forEach((p: any) => {
                          const name = p.payment_methods?.nombre || 'Otro';
                          breakdown[name] = (breakdown[name] || 0) + p.monto;
                        });
                      });
                      const cashSales = breakdown['Efectivo'] || 0;
                      const expectedCash = activeRegister.monto_inicial + cashSales + totals.ingresos - totals.egresos;

                      return (
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-bold text-brand">
                          <span>Efectivo Esperado en Caja:</span>
                          <span>{currency} {expectedCash.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Arqueo de efectivo físico */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 block">
                      Efectivo Físico Contado:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold select-none text-sm">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ingresa el efectivo total en caja"
                        value={physicalCash}
                        onChange={e => setPhysicalCash(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-lg font-black outline-none focus:border-brand bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Diferencia en vivo */}
                  {physicalCash && (() => {
                    const cashReal = parseFloat(physicalCash) || 0;
                    const breakdown: Record<string, number> = {};
                    salesDuringSession.forEach(sale => {
                      sale.payments?.forEach((p: any) => {
                        const name = p.payment_methods?.nombre || 'Otro';
                        breakdown[name] = (breakdown[name] || 0) + p.monto;
                      });
                    });
                    const cashSales = breakdown['Efectivo'] || 0;
                    const expectedCash = activeRegister.monto_inicial + cashSales + totals.ingresos - totals.egresos;
                    const diff = cashReal - expectedCash;

                    return (
                      <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-bold ${
                        Math.abs(diff) < 0.01
                          ? 'bg-success-muted border-success-border text-success'
                          : diff > 0
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span>Diferencia (Arqueo vs Esperado):</span>
                        <span>
                          {diff === 0 ? 'Cuadrado' : diff > 0 ? `Sobrante de +${currency} ${diff.toFixed(2)}` : `Faltante de -${currency} ${Math.abs(diff).toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Acciones */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCloseModal(false)}
                      disabled={closing}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCloseDetailed}
                      disabled={closing || !physicalCash}
                      className="flex-1 py-3 rounded-xl bg-brand text-brand-foreground text-sm font-black shadow-lg shadow-brand/10 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {closing ? 'Procesando Cierre...' : 'Confirmar y Cerrar'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!dialog}
        loading={dialogLoading}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        variant={dialog?.variant}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
