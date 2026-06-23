import React, { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Plus, Minus, DollarSign, RefreshCw, History, Unlock, Star, Wallet, AlertTriangle } from 'lucide-react';
import { useCashRegister } from '../../hooks/useCashRegister';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';

export function CashRegister() {
  const { activeRegister, history, loading, openRegister, addMovement, getTotals, refetch } = useCashRegister();
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const currency = restaurant?.moneda ?? 'C$';
  const [openAmount, setOpenAmount] = useState('');
  const [opening, setOpening] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [movMode, setMovMode] = useState<'ingreso' | 'egreso' | 'propina' | 'recarga'>('ingreso');
  const [movConcepto, setMovConcepto] = useState('');
  const [movMonto, setMovMonto] = useState('');
  const [addingMov, setAddingMov] = useState(false);
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

  async function handleAddMovement(e: FormEvent) {
    e.preventDefault();
    if (!activeRegister || !user?.id || !movConcepto || !movMonto) return;
    const tipo = movMode === 'egreso' ? 'egreso' : movMode === 'propina' ? 'propina' : 'ingreso';
    setAddingMov(true);
    try {
      await addMovement(activeRegister.id, tipo, movConcepto, parseFloat(movMonto), user.id);
      setMovConcepto('');
      setMovMonto('');
      setShowMovement(false);
      const label = movMode === 'propina' ? 'Propina' : movMode === 'recarga' ? 'Recarga de fondo' : movMode === 'ingreso' ? 'Ingreso' : 'Egreso';
      toast.success(`${label} registrado`);
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
              Turno #{history.length} · Abierta desde {new Date(activeRegister.fecha_apertura).toLocaleTimeString('es-NI')}
            </span>
          ) : 'Sin caja abierta'
        }
        actions={
          <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        }
      />

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

          {/* Alerta saldo bajo */}
          {totals.saldo < 500 && totals.saldo >= 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
              <AlertTriangle size={15} className="shrink-0" />
              <span>Saldo en caja bajo ({currency} {totals.saldo.toFixed(2)}). Considera agregar al fondo.</span>
            </div>
          )}
          {totals.saldo < 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <AlertTriangle size={15} className="shrink-0" />
              <span>¡Saldo negativo en caja! Revisa los egresos registrados.</span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setMovMode('recarga'); setMovConcepto('Recarga de fondo de caja'); setMovMonto(''); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium cursor-pointer"
            >
              <Wallet size={15} /> Agregar al Fondo
            </button>
            <button
              onClick={() => { setMovMode('propina'); setMovConcepto('Propina'); setMovMonto(''); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 text-amber-700 text-sm font-medium cursor-pointer hover:bg-amber-200 transition-colors"
            >
              <Star size={15} /> Propina
            </button>
            <button
              onClick={() => { setMovMode('ingreso'); setMovConcepto(''); setMovMonto(''); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium cursor-pointer"
            >
              <Plus size={15} /> Ingreso
            </button>
            <button
              onClick={() => { setMovMode('egreso'); setMovConcepto(''); setMovMonto(''); setShowMovement(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium cursor-pointer"
            >
              <Minus size={15} /> Egreso
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
                  {movMode === 'recarga' ? 'Agregar al Fondo de Caja' : movMode === 'propina' ? 'Registrar Propina' : movMode === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso'}
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  {movMode === 'recarga' ? 'Agrega efectivo al fondo disponible para dar cambio' : movMode === 'propina' ? 'Propina recibida durante el turno' : movMode === 'ingreso' ? 'Entrada de efectivo a la caja' : 'Salida de efectivo de la caja'}
                </p>
                <form onSubmit={handleAddMovement} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Concepto</label>
                    <input type="text" value={movConcepto}
                      onChange={e => setMovConcepto(e.target.value)}
                      placeholder={movMode === 'propina' ? 'Ej: Mesa #3, cliente satisfecho...' : movMode === 'egreso' ? 'Ej: Compra de hielo, pago transporte...' : 'Ej: Efectivo recibido...'}
                      readOnly={movMode === 'recarga'}
                      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand ${movMode === 'recarga' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Monto ({currency})</label>
                    <input type="number" min="0.01" step="0.01" value={movMonto}
                      onChange={e => setMovMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowMovement(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                      Cancelar
                    </button>
                    <button type="submit" disabled={addingMov}
                      className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 ${movMode === 'egreso' ? 'bg-destructive' : movMode === 'propina' ? 'bg-amber-500' : 'bg-success'}`}>
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
                {activeRegister.cash_movements.map((mov) => {
                  const isPropina = mov.tipo === 'propina';
                  const isEgreso = mov.tipo === 'egreso';
                  const isRecarga = mov.tipo === 'ingreso' && mov.concepto.toLowerCase().includes('fondo');
                  return (
                    <div key={mov.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPropina ? 'bg-amber-50' : isEgreso ? 'bg-destructive-muted' : isRecarga ? 'bg-brand-muted' : 'bg-success-muted'
                      }`}>
                        {isPropina
                          ? <Star size={14} className="text-amber-500" />
                          : isEgreso
                          ? <Minus size={14} className="text-destructive" />
                          : isRecarga
                          ? <Wallet size={14} className="text-brand" />
                          : <Plus size={14} className="text-success" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{mov.concepto}</p>
                        <p className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleTimeString('es-NI')}</p>
                      </div>
                      <p className={`font-semibold ${isEgreso ? 'text-destructive' : isPropina ? 'text-amber-600' : 'text-success'}`}>
                        {isEgreso ? '-' : '+'} {currency} {mov.monto.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
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
            {history.map((reg, index) => (
              <div key={reg.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Turno #{history.length - index} · {new Date(reg.fecha_apertura).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(reg.fecha_apertura).toLocaleTimeString('es-NI')}
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400">Fondo Inicial</p>
                  <p className="text-sm font-bold text-gray-700">{currency} {reg.monto_inicial.toFixed(2)}</p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  reg.estado === 'abierta' ? 'bg-success-muted text-success' : 'bg-gray-100 text-gray-600'
                }`}>
                  {reg.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
