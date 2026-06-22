import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react'
import { PaymentSelector } from './PaymentSelector'
import { Button } from '../ui/button'

type CartItem = {
  id: string
  product_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

type CartPanelProps = {
  items: CartItem[]
  products: Array<{ id: string; nombre: string; imagen_url?: string | null }>
  currency: string
  isCounter: boolean
  tableName: string
  cashierName: string
  subtotal: number
  descuento: number
  iva: number
  ivaPercent: number
  total: number
  cliente: string
  activePaymentType: 'cash' | 'card' | 'qr'
  payBankId: string
  payRef: string
  banks: Array<{ id: string; nombre: string; activo: boolean }>
  completing: boolean
  onClienteChange: (v: string) => void
  onDescuentoChange: (v: number) => void
  onPaymentTypeChange: (t: 'cash' | 'card' | 'qr') => void
  onPayBankChange: (v: string) => void
  onPayRefChange: (v: string) => void
  onQtyChange: (itemId: string, delta: number, current: number, precio: number) => void
  onRemoveItem: (itemId: string) => void
  onCompleteSale: () => void
  itemQuantityMaxedOut: (productId: string, cartItem: CartItem) => boolean
}

export const CartPanel = ({
  items,
  products,
  currency,
  isCounter,
  tableName,
  cashierName,
  subtotal,
  descuento,
  iva,
  ivaPercent,
  total,
  cliente,
  activePaymentType,
  payBankId,
  payRef,
  banks,
  completing,
  onClienteChange,
  onDescuentoChange,
  onPaymentTypeChange,
  onPayBankChange,
  onPayRefChange,
  onQtyChange,
  onRemoveItem,
  onCompleteSale,
  itemQuantityMaxedOut,
}: CartPanelProps) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b border-gray-150 shrink-0">
      <h3 className="font-black text-gray-900 text-base">{isCounter ? 'Mostrador' : tableName}</h3>
      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Cajero: {cashierName}</p>
    </div>

    <div className="flex-1 overflow-y-auto p-4 bg-brand-subtle">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <ShoppingCart size={32} className="text-gray-300 mb-4" />
          <p className="text-gray-700 font-bold">{isCounter ? 'Sin productos' : 'Sin productos en mesa'}</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {items.map(item => {
            const product = products.find(p => p.id === item.product_id)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-2 p-3.5 bg-white border border-gray-100 rounded-2xl mb-3 hover:shadow-md"
              >
                <div className="flex justify-between gap-2">
                  <p className="text-xs font-extrabold text-gray-800 line-clamp-2">{product?.nombre ?? 'Producto'}</p>
                  <p className="text-xs font-black shrink-0">{currency} {item.subtotal.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100 gap-1">
                    <button type="button" onClick={() => onQtyChange(item.id, -1, item.cantidad, item.precio_unitario)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center cursor-pointer hover:text-destructive transition-colors min-h-11 min-w-11">
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-black px-2">{item.cantidad}</span>
                    <button type="button" disabled={itemQuantityMaxedOut(item.product_id, item)}
                      onClick={() => onQtyChange(item.id, 1, item.cantidad, item.precio_unitario)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center cursor-pointer hover:text-brand transition-colors min-h-11 min-w-11 disabled:opacity-30">
                      <Plus size={10} />
                    </button>
                  </div>
                  <button type="button" onClick={() => onRemoveItem(item.id)}
                    className="w-9 h-9 rounded-lg bg-destructive-muted text-destructive hover:bg-destructive/20 flex items-center justify-center cursor-pointer min-h-11 min-w-11 transition-colors duration-200">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>

    <div className="border-t border-gray-150 p-4 space-y-2.5 bg-white shrink-0">
      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
        <span>Subtotal</span>
        <span>{items.length > 0 ? `${currency} ${subtotal.toFixed(2)}` : '-'}</span>
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
        <span>IVA ({ivaPercent}%)</span>
        <span>{items.length > 0 ? `${currency} ${iva.toFixed(2)}` : '-'}</span>
      </div>
      <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
        <span className="text-xs font-black">Total a pagar</span>
        <motion.span
          key={total}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="text-2xl font-black text-brand"
        >
          {items.length > 0 ? `${currency} ${total.toFixed(2)}` : '-'}
        </motion.span>
      </div>

      <input type="text" placeholder="Consumidor Final" value={items.length > 0 ? cliente : ''}
        onChange={e => onClienteChange(e.target.value)} disabled={items.length === 0}
        className="w-full px-2 py-2 rounded-lg border border-gray-200 text-[10px] font-bold outline-none focus:border-brand min-h-11" />

      <PaymentSelector activeType={activePaymentType} onChange={onPaymentTypeChange} disabled={items.length === 0} />

      {items.length > 0 && activePaymentType === 'qr' && banks.filter(b => b.activo).length > 0 && (
        <select value={payBankId} onChange={e => onPayBankChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-brand min-h-11">
          <option value="">Seleccionar banco...</option>
          {banks.filter(b => b.activo).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      )}

      {items.length > 0 && (activePaymentType === 'card' || activePaymentType === 'qr') && (
        <input type="text" placeholder="Referencia" value={payRef} onChange={e => onPayRefChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-brand min-h-11" />
      )}

      <input type="number" min="0" max={subtotal} value={items.length > 0 ? (descuento || '') : ''}
        onChange={e => onDescuentoChange(parseFloat(e.target.value) || 0)} disabled={items.length === 0}
        placeholder="Descuento" className="w-full text-right border border-gray-200 rounded-lg px-3 py-2 text-xs font-extrabold outline-none focus:border-brand min-h-11" />

      <Button size="touch" className="w-full mt-2" onClick={onCompleteSale} disabled={completing || items.length === 0}>
        {completing ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={16} /> Completar Venta</>}
      </Button>
    </div>
  </div>
)
