import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, DollarSign, TrendingUp, TrendingDown, Plus, X, Check } from 'lucide-react';
import { useStore, addAuditLog } from '../store';
import type { CashRegisterSession, CashMovement } from '../types';

function fmt(n: number) {
  return `C$${(n ?? 0).toLocaleString('es-NI', { minimumFractionDigits: 0 })}`;
}

export function CashRegister() {
  const { state, dispatch } = useStore();
  const [initialAmount, setInitialAmount] = useState('500');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [finalCash, setFinalCash] = useState('');
  const [finalTransfer, setFinalTransfer] = useState('');
  const [finalCard, setFinalCard] = useState('');
  const [movType, setMovType] = useState<'in' | 'out'>('in');
  const [movConcept, setMovConcept] = useState('');
  const [movAmount, setMovAmount] = useState('');

  const reg = state.cashRegister;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(s => s.date === todayStr && s.status === 'completed');
  const todayCash = todaySales.filter(s => s.paymentMethod === 'cash').reduce((s, x) => s + x.total - x.discount, 0);
  const todayTransfer = todaySales.filter(s => s.paymentMethod === 'transfer').reduce((s, x) => s + x.total - x.discount, 0);
  const todayCard = todaySales.filter(s => s.paymentMethod === 'card').reduce((s, x) => s + x.total - x.discount, 0);
  const todayTotal = todaySales.reduce((s, x) => s + x.total - x.discount, 0);

  function openRegister() {
    const amt = parseFloat(initialAmount) || 0;
    const register: CashRegisterSession = {
      id: `reg-${Date.now()}`,
      userId: state.currentUser!.id,
      userName: state.currentUser!.name,
      openedAt: new Date().toISOString(),
      initialAmount: amt,
      status: 'open',
      movements: [],
    };
    dispatch({ type: 'OPEN_REGISTER', register });
    addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
      'Apertura de Caja', `Caja #${register.id.slice(-4)}`,
      { newValue: `Fondo inicial: ${fmt(amt)}` }
    );
  }

  function closeRegister() {
    const cash = parseFloat(finalCash) || 0;
    const transfer = parseFloat(finalTransfer) || 0;
    const card = parseFloat(finalCard) || 0;
    dispatch({ type: 'CLOSE_REGISTER', finalCash: cash, finalTransfer: transfer, finalCard: card });
    addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
      'Cierre de Caja', `Caja actual`,
      { newValue: `Efectivo: ${fmt(cash)} | Transferencia: ${fmt(transfer)} | Tarjeta: ${fmt(card)}` }
    );
    setShowCloseModal(false);
  }

  function addMovement() {
    if (!reg || !movConcept || !movAmount) return;
    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: movType,
      concept: movConcept,
      amount: parseFloat(movAmount),
      createdAt: new Date().toISOString(),
    };
    dispatch({
      type: 'OPEN_REGISTER',
      register: { ...reg, movements: [...reg.movements, movement] },
    });
    setMovConcept('');
    setMovAmount('');
    setShowMovModal(false);
  }

  const expectedCash = (reg?.initialAmount ?? 0) + todayCash +
    (reg?.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0) ?? 0) -
    (reg?.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0) ?? 0);

  return (
    <div className="p-6 space-y-6">
      {/* Status card */}
      <div className={`rounded-2xl p-6 border-2 ${reg?.status === 'open' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${reg?.status === 'open' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {reg?.status === 'open' ? <Unlock size={24} className="text-green-600" /> : <Lock size={24} className="text-gray-500" />}
            </div>
            <div>
              <h2 className="text-gray-900">{reg?.status === 'open' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {reg?.status === 'open'
                  ? `Abierta por ${reg.userName} · ${new Date(reg.openedAt).toLocaleTimeString('es-NI')}`
                  : 'No hay sesión activa'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {reg?.status === 'open' ? (
              <>
                <button
                  onClick={() => setShowMovModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition-all"
                >
                  <Plus size={14} />
                  Movimiento
                </button>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
                  style={{ background: '#EF4444' }}
                >
                  <Lock size={14} />
                  Cerrar Caja
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  placeholder="Fondo inicial"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] w-36"
                />
                <button
                  onClick={openRegister}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
                  style={{ background: '#10B981' }}
                >
                  <Unlock size={14} />
                  Abrir Caja
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total ventas', value: fmt(todayTotal), icon: <DollarSign size={18} />, color: '#FF5A1F' },
          { label: 'Efectivo', value: fmt(todayCash), icon: <TrendingUp size={18} />, color: '#10B981' },
          { label: 'Transferencia', value: fmt(todayTransfer), icon: <TrendingUp size={18} />, color: '#3B82F6' },
          { label: 'Tarjeta', value: fmt(todayCard), icon: <TrendingUp size={18} />, color: '#8B5CF6' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: item.color + '15' }}>
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <p className="text-gray-400 text-xs">{item.label}</p>
            <p className="text-gray-900 font-bold mt-0.5" style={{ fontSize: '22px' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Expected cash */}
      {reg?.status === 'open' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 mb-4">Resumen de caja esperado</h3>
          <div className="space-y-3">
            {[
              { label: 'Fondo inicial', value: reg.initialAmount, color: 'text-gray-700' },
              { label: '+ Ventas en efectivo', value: todayCash, color: 'text-green-600' },
              { label: '+ Entradas manuales', value: reg.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0), color: 'text-blue-600' },
              { label: '- Salidas manuales', value: reg.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0), color: 'text-red-500' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className={`font-medium ${row.color}`}>{fmt(row.value)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
              <span>Total esperado en caja</span>
              <span style={{ color: '#FF5A1F' }}>{fmt(expectedCash)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Movements */}
      {reg?.movements && reg.movements.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 mb-4">Movimientos manuales</h3>
          <div className="space-y-2">
            {reg.movements.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {m.type === 'in' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm">{m.concept}</p>
                  <p className="text-gray-400 text-xs">{new Date(m.createdAt).toLocaleTimeString('es-NI')}</p>
                </div>
                <span className={`font-medium text-sm ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.type === 'in' ? '+' : '-'}{fmt(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close modal */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-gray-900">Cierre de Caja</h3>
                <button onClick={() => setShowCloseModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <p className="text-gray-500 text-sm">Ingresa los montos físicos contados para el cierre.</p>
                {[
                  { label: 'Efectivo contado', value: finalCash, set: setFinalCash, expected: expectedCash },
                  { label: 'Transferencias', value: finalTransfer, set: setFinalTransfer, expected: todayTransfer },
                  { label: 'Tarjeta', value: finalCard, set: setFinalCard, expected: todayCard },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-gray-600 text-sm block mb-1.5">{f.label}</label>
                    <input
                      type="number"
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={`Esperado: ${fmt(f.expected)}`}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]"
                    />
                    {f.value && (
                      <p className={`text-xs mt-1 ${parseFloat(f.value) >= f.expected ? 'text-green-600' : 'text-red-500'}`}>
                        Diferencia: {fmt(parseFloat(f.value) - f.expected)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={closeRegister} className="flex-1 py-2.5 rounded-xl text-white text-sm" style={{ background: '#EF4444' }}>
                  Confirmar Cierre
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movement modal */}
      <AnimatePresence>
        {showMovModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-gray-900">Movimiento Manual</h3>
                <button onClick={() => setShowMovModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex gap-2">
                  {(['in', 'out'] as const).map(t => (
                    <button key={t} onClick={() => setMovType(t)}
                      className={`flex-1 py-2 rounded-xl text-sm transition-all ${movType === t ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                      style={movType === t ? { background: t === 'in' ? '#10B981' : '#EF4444' } : undefined}>
                      {t === 'in' ? '+ Entrada' : '- Salida'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Concepto</label>
                  <input value={movConcept} onChange={e => setMovConcept(e.target.value)} placeholder="Ej: Pago proveedor"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Monto</label>
                  <input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="C$0"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setShowMovModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={addMovement} className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                  style={{ background: movType === 'in' ? '#10B981' : '#EF4444' }}>
                  Registrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
