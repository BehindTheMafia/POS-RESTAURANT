import { motion, AnimatePresence } from 'motion/react'
import { X, CheckCircle } from 'lucide-react'
import type { PaymentLine } from '../../../lib/payments'
import {
  isPaymentSufficient,
  remainingToPay,
  sumPaymentsInBase,
} from '../../../lib/payments'
import { PaymentCheckout } from './PaymentCheckout'

type CompleteSaleModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  confirming: boolean
  cliente: string
  onClienteChange: (v: string) => void
  total: number
  subtotal: number
  iva: number
  descuento: number
  paymentLines: PaymentLine[]
  onPaymentLinesChange: (lines: PaymentLine[]) => void
  onAddPaymentLine: () => void
  paymentMethods: Array<{ id: string; nombre: string; activo?: boolean }>
  banks: Array<{ id: string; nombre: string; activo: boolean }>
  exchangeRate: number
  baseCurrency: string
}

export const CompleteSaleModal = ({
  open,
  onClose,
  onConfirm,
  confirming,
  cliente,
  onClienteChange,
  total,
  subtotal,
  iva,
  descuento,
  paymentLines,
  onPaymentLinesChange,
  onAddPaymentLine,
  paymentMethods,
  banks,
  exchangeRate,
  baseCurrency,
}: CompleteSaleModalProps) => {
  const paidInBase = sumPaymentsInBase(paymentLines, exchangeRate)
  const remaining = remainingToPay(total, paidInBase)
  const sufficient = isPaymentSufficient(total, paidInBase)
  // Positive value = change to give back
  const change = remaining < -0.01 ? Math.abs(remaining) : 0

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[95dvh]"
        >
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
            <h3 className="font-black text-gray-900 text-xl">Confirmar venta</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={confirming}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* ── Scrollable body ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {/* Total prominente */}
            <div className="px-6 pt-6 pb-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Total a cobrar
              </p>
              <p className="text-5xl font-black text-gray-900 tabular-nums leading-none">
                {baseCurrency} {total.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Subtotal {baseCurrency}&nbsp;{subtotal.toFixed(2)}
                {descuento > 0 && (
                  <> · <span className="text-destructive">Desc. -{baseCurrency}&nbsp;{descuento.toFixed(2)}</span></>
                )}
                {' '}· IVA {baseCurrency}&nbsp;{iva.toFixed(2)}
              </p>
            </div>

            {/* Cambio a devolver — solo cuando hay sobrante */}
            <AnimatePresence>
              {change > 0 && (
                <motion.div
                  key="change"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-6 mb-5 overflow-hidden"
                >
                  <div className="rounded-2xl bg-success-muted border border-success-border px-5 py-4 flex items-center justify-between">
                    <p className="font-bold text-success text-sm">Cambio a devolver</p>
                    <p className="text-3xl font-black text-success tabular-nums">
                      {baseCurrency} {change.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Métodos de pago */}
            <div className="px-6 pb-6">
              <PaymentCheckout
                cliente={cliente}
                onClienteChange={onClienteChange}
                paymentLines={paymentLines}
                onPaymentLinesChange={onPaymentLinesChange}
                paymentMethods={paymentMethods}
                banks={banks}
                total={total}
                exchangeRate={exchangeRate}
                baseCurrency={baseCurrency}
                disabled={confirming}
                onAddLine={onAddPaymentLine}
              />
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={confirming}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <motion.button
              type="button"
              whileTap={!confirming && sufficient ? { scale: 0.97 } : {}}
              onClick={onConfirm}
              disabled={confirming || !sufficient}
              className="flex-[2] py-3.5 rounded-2xl bg-brand text-brand-foreground text-base font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-opacity shadow-lg shadow-brand/20"
            >
              {confirming ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Confirmar venta
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
