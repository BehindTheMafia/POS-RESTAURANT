import React, { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Plus, Minus, DollarSign, RefreshCw, History, Lock, Unlock } from 'lucide-react';
import { useCashRegister } from '../../hooks/useCashRegister';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';

export function CashRegister() {
  const { activeRegister, history, loading, openRegister, closeRegister, addMovement, getTotals, refetch } = useCashRegister();
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

  function handleClose() {
    if (!activeRegister || !user?.id) return
    showConfirm({
      title: 'Cerrar caja',
      message: 'Se registrará el cierre con las ventas y movimientos del turno actual. ¿Confirmar?',
      confirmLabel: 'Cerrar caja',
      variant: 'warning',
      onConfirm: async () => {
        setClosing(true)
        try {
          const result = await closeRegister(activeRegister.id, user!.id)
          setCloseResult(result)
          toast.success('Caja cerrada exitosamente')
        } catch (err: any) {
          toast.error(err.message)
        } finally {
          setClosing(false)
        }
      },
    })
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
              onClick={handleClose}
              disabled={closing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 ml-auto"
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
          <div className="divide-y divide-gray-50">
            {history.map(reg => (
              <div key={reg.id} className="flex items-center gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(reg.fecha_apertura).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(reg.fecha_apertura).toLocaleTimeString('es-NI')}
                    {reg.fecha_cierre && ` → ${new Date(reg.fecha_cierre).toLocaleTimeString('es-NI')}`}
                  </p>
                </div>
                <div className="flex-1" />
                <p className="text-sm text-gray-600">Inicial: {currency} {reg.monto_inicial.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  reg.estado === 'abierta' ? 'bg-success-muted text-success' : 'bg-gray-100 text-gray-600'
                }`}>
                  {reg.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
