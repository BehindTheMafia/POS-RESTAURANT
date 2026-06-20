import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plus, Minus, Trash2, CreditCard,
  Banknote, Smartphone, Shuffle, Check, X,
  Drumstick, Ham, Beef, GlassWater, ShoppingCart, Utensils
} from 'lucide-react';
import { useStore, addAuditLog } from '../store';
import type { Sale } from '../types';

type PayMethod = 'cash' | 'transfer' | 'card' | 'mixed';

const BANKS = ['BAC', 'Lafise', 'Banpro', 'Ficohsa'];
const METHOD_ICONS: Record<PayMethod, React.ReactNode> = {
  cash: <Banknote size={16} />,
  transfer: <Smartphone size={16} />,
  card: <CreditCard size={16} />,
  mixed: <Shuffle size={16} />,
};
const METHOD_LABELS: Record<PayMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  mixed: 'Pago Mixto',
};

function fmt(n: number) {
  return `C$${n.toLocaleString('es-NI', { minimumFractionDigits: 0 })}`;
}

export function POSOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const { state, dispatch, products, categories } = useStore();
  const navigate = useNavigate();

  const [activeCat, setActiveCat] = useState(categories[0].id);
  const [showPayModal, setShowPayModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [bank, setBank] = useState(BANKS[0]);
  const [reference, setReference] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  const table = state.tables.find(t => t.id === tableId);
  const order = state.orders.find(o => o.id === state.currentOrderId || (table?.currentOrderId && o.id === table.currentOrderId));

  const catProducts = useMemo(() => products.filter(p => p.categoryId === activeCat && p.status === 'active'), [activeCat]);

  function addItem(productId: string) {
    if (!order) return;
    const product = products.find(p => p.id === productId)!;
    const existing = order.items.find(i => i.productId === productId);
    if (existing) {
      dispatch({ type: 'UPDATE_ITEM_QTY', orderId: order.id, itemId: existing.id, quantity: existing.quantity + 1 });
    } else {
      dispatch({
        type: 'ADD_ORDER_ITEM',
        orderId: order.id,
        item: {
          id: `item-${Date.now()}-${productId}`,
          productId,
          productName: product.name,
          quantity: 1,
          price: product.price,
          subtotal: product.price,
        },
      });
    }
  }

  function updateQty(itemId: string, qty: number) {
    if (!order) return;
    if (qty <= 0) {
      dispatch({ type: 'REMOVE_ORDER_ITEM', orderId: order.id, itemId });
    } else {
      dispatch({ type: 'UPDATE_ITEM_QTY', orderId: order.id, itemId, quantity: qty });
    }
  }

  const subtotal = order?.total ?? 0;
  const discountAmt = Math.round(subtotal * (discount / 100));
  const total = subtotal - discountAmt;
  const taxAmt = Math.round(total * 0.15);
  const cashNum = parseFloat(cashReceived) || 0;
  const change = payMethod === 'cash' ? Math.max(0, cashNum - total) : 0;

  function processPayment() {
    if (!order || !table) return;
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      number: state.sales.length + 1,
      date: new Date().toISOString().split('T')[0],
      cashierId: state.currentUser!.id,
      cashierName: state.currentUser!.name,
      tableId: table.id,
      tableName: table.name,
      orderId: order.id,
      total,
      discount: discountAmt,
      tax: taxAmt,
      paymentMethod: payMethod,
      bankName: (payMethod === 'transfer' || payMethod === 'card' || payMethod === 'mixed') ? bank : undefined,
      reference: reference || undefined,
      status: 'completed',
    };
    dispatch({ type: 'COMPLETE_SALE', sale, orderId: order.id, tableId: table.id });
    addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
      'Venta Procesada', `Venta #${sale.number} — ${table.name}`,
      { newValue: `${fmt(total)} — ${METHOD_LABELS[payMethod]}` }
    );
    setPaySuccess(true);
    setTimeout(() => {
      setPaySuccess(false);
      setShowPayModal(false);
      navigate('/pos');
    }, 1800);
  }

  if (!table) {
    return <div className="p-6 text-gray-500">Mesa no encontrada.</div>;
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* Left: Product catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Back + table name */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
          <button
            onClick={() => navigate('/pos')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-gray-900">{table.name}</h2>
            <p className="text-gray-400 text-xs">Orden #{order?.number ?? '—'}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${order && order.items.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            {order?.items.length ?? 0} ítems
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
                activeCat === cat.id
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCat === cat.id ? { background: '#FF5A1F' } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {catProducts.map((product, i) => {
                const inOrder = order?.items.find(it => it.productId === product.id);
                return (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => addItem(product.id)}
                    className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all text-center ${
                      inOrder
                        ? 'border-orange-300 bg-orange-50 shadow-md'
                        : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-sm'
                    }`}
                  >
                    {inOrder && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: '#FF5A1F' }}>
                        {inOrder.quantity}
                      </span>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${inOrder ? 'bg-orange-100' : 'bg-gray-100'}`}
                      style={{ color: inOrder ? '#FF5A1F' : '#9CA3AF' }}>
                      {activeCat === 'c1' ? <Drumstick size={24} /> : activeCat === 'c2' ? <Ham size={24} /> : activeCat === 'c3' ? <Beef size={24} /> : activeCat === 'c4' ? <Utensils size={24} /> : <GlassWater size={24} />}
                    </div>
                    <p className="text-gray-800 text-sm font-medium leading-tight">{product.name}</p>
                    <p className="mt-1.5 font-bold" style={{ color: '#FF5A1F', fontSize: '15px' }}>
                      {fmt(product.price)}
                    </p>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: Order summary */}
      <div className="w-80 xl:w-96 bg-white border-l border-gray-100 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900">Resumen de orden</h3>
          <p className="text-gray-400 text-xs mt-0.5">Mesero: {order?.waiterName}</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {!order || order.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
              <ShoppingCart size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Agrega productos</p>
            </div>
          ) : (
            <AnimatePresence>
              {order.items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm truncate">{item.productName}</p>
                    <p className="text-gray-400 text-xs">{fmt(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      {item.quantity === 1 ? <Trash2 size={10} className="text-red-500" /> : <Minus size={10} />}
                    </button>
                    <span className="text-gray-800 text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors"
                      style={{ background: '#FF5A1F' }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <p className="text-gray-900 text-sm font-medium w-16 text-right">{fmt(item.subtotal)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Totals + pay */}
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento ({discount}%)</span>
              <span>-{fmt(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-100 pt-2">
            <span>Total</span>
            <span style={{ color: '#FF5A1F' }}>{fmt(total)}</span>
          </div>

          <button
            onClick={() => order && order.items.length > 0 && setShowPayModal(true)}
            disabled={!order || order.items.length === 0}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 mt-2"
            style={{ background: '#FF5A1F' }}
          >
            Procesar Pago
          </button>
        </div>
      </div>

      {/* Payment modal */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && !paySuccess && setShowPayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {paySuccess ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ background: '#10B981' }}
                  >
                    <Check size={36} color="white" />
                  </motion.div>
                  <h3 className="text-gray-900 mb-1">¡Pago exitoso!</h3>
                  <p className="text-gray-500 text-sm">{table.name} liberada · {fmt(total)}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-gray-900">Procesar Pago</h3>
                    <button onClick={() => setShowPayModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>IVA (15%)</span><span>{fmt(taxAmt)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento</span><span>-{fmt(discountAmt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                        <span>Total</span><span style={{ color: '#FF5A1F' }}>{fmt(total)}</span>
                      </div>
                    </div>

                    {/* Discount */}
                    {(state.currentUser?.role === 'admin' || state.currentUser?.role === 'cashier') && (
                      <div>
                        <label className="text-gray-600 text-sm block mb-1.5">Descuento</label>
                        <div className="flex gap-2">
                          {[0, 5, 10, 15, 20].map(d => (
                            <button
                              key={d}
                              onClick={() => setDiscount(d)}
                              className={`flex-1 py-1.5 rounded-lg text-sm transition-all ${discount === d ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              style={discount === d ? { background: '#FF5A1F' } : undefined}
                            >
                              {d}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment method */}
                    <div>
                      <label className="text-gray-600 text-sm block mb-1.5">Método de pago</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['cash', 'transfer', 'card', 'mixed'] as PayMethod[]).map(m => (
                          <button
                            key={m}
                            onClick={() => setPayMethod(m)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                              payMethod === m
                                ? 'border-[#FF5A1F] bg-orange-50 text-orange-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {METHOD_ICONS[m]}
                            {METHOD_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bank + reference */}
                    {(payMethod === 'transfer' || payMethod === 'card' || payMethod === 'mixed') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Banco</label>
                          <select
                            value={bank}
                            onChange={e => setBank(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] bg-white"
                          >
                            {BANKS.map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Referencia</label>
                          <input
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="REF-XXXX"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cash received */}
                    {payMethod === 'cash' && (
                      <div>
                        <label className="text-gray-600 text-xs block mb-1">Efectivo recibido</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          placeholder={`Mínimo ${fmt(total)}`}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]"
                        />
                        {cashNum >= total && (
                          <p className="text-green-600 text-xs mt-1">Cambio: {fmt(change)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-5">
                    <button
                      onClick={processPayment}
                      className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: '#FF5A1F' }}
                    >
                      Confirmar Pago · {fmt(total)}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
