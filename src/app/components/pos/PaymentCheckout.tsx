import { Plus, Trash2 } from 'lucide-react'
import type { PaymentLine } from '../../../lib/payments'
import {
  currencySymbol,
  isCardOrQrMethod,
  remainingToPay,
  sumPaymentsInBase,
  isPaymentSufficient,
  PAYMENT_TOLERANCE,
} from '../../../lib/payments'

type PaymentCheckoutProps = {
  cliente: string
  onClienteChange: (v: string) => void
  paymentLines: PaymentLine[]
  onPaymentLinesChange: (lines: PaymentLine[]) => void
  paymentMethods: Array<{ id: string; nombre: string; activo?: boolean }>
  banks: Array<{ id: string; nombre: string; activo: boolean }>
  total: number
  exchangeRate: number
  baseCurrency: string
  disabled?: boolean
  onAddLine: () => void
}

export const PaymentCheckout = ({
  cliente,
  onClienteChange,
  paymentLines,
  onPaymentLinesChange,
  paymentMethods,
  banks,
  total,
  exchangeRate,
  baseCurrency,
  disabled,
  onAddLine,
}: PaymentCheckoutProps) => {
  const activeMethods = paymentMethods.filter(p => p.activo !== false)
  const paidInBase = sumPaymentsInBase(paymentLines, exchangeRate)
  const remaining = remainingToPay(total, paidInBase)
  const sufficient = isPaymentSufficient(total, paidInBase)

  const updateLine = (id: string, patch: Partial<PaymentLine>) => {
    onPaymentLinesChange(
      paymentLines.map(l => (l.id === id ? { ...l, ...patch } : l))
    )
  }

  const removeLine = (id: string) => {
    if (paymentLines.length <= 1) return
    onPaymentLinesChange(paymentLines.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
          Cliente
        </label>
        <input
          type="text"
          placeholder="Consumidor Final"
          value={disabled ? '' : cliente}
          onChange={e => onClienteChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-brand bg-gray-50 focus:bg-white transition-colors disabled:opacity-50"
        />
      </div>

      {/* Payment lines */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Método de pago
          </label>
          <button
            type="button"
            onClick={onAddLine}
            disabled={disabled}
            className="flex items-center gap-1 text-xs font-bold text-brand hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            <Plus size={13} /> Agregar pago
          </button>
        </div>

        <div className="space-y-2.5">
          {paymentLines.map(line => (
            <div
              key={line.id}
              className="rounded-2xl border border-gray-150 bg-gray-50/60 p-3.5 space-y-3"
            >
              {/* Row: method + currency + amount */}
              <div className="flex gap-2 items-stretch">
                {/* Method selector */}
                <select
                  value={line.payment_method_id}
                  onChange={e => updateLine(line.id, { payment_method_id: e.target.value })}
                  disabled={disabled}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-brand bg-white disabled:opacity-50 cursor-pointer"
                >
                  {activeMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                  ))}
                </select>

                {/* Currency selector */}
                <select
                  value={line.currency}
                  onChange={e =>
                    updateLine(line.id, { currency: e.target.value as PaymentLine['currency'] })
                  }
                  disabled={disabled}
                  className="w-[4.5rem] px-2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-brand bg-white disabled:opacity-50 cursor-pointer text-center"
                >
                  <option value="NIO">C$</option>
                  <option value="USD">US$</option>
                </select>

                {/* Amount input */}
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold select-none">
                    {currencySymbol(line.currency)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.monto || ''}
                    onChange={e =>
                      updateLine(line.id, { monto: parseFloat(e.target.value) || 0 })
                    }
                    disabled={disabled}
                    placeholder="0"
                    className="w-full text-right pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-base font-black outline-none focus:border-brand bg-white disabled:opacity-50"
                  />
                </div>

                {/* Remove button (only shown when multiple lines) */}
                {paymentLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={disabled}
                    className="w-10 shrink-0 flex items-center justify-center rounded-xl text-gray-300 hover:text-destructive hover:bg-destructive-muted transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="Eliminar pago"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Card / QR sub-fields */}
              {isCardOrQrMethod(line.payment_method_id, activeMethods) && (
                <div className="flex gap-2">
                  {line.payment_method_id &&
                    activeMethods
                      .find(p => p.id === line.payment_method_id)
                      ?.nombre.toLowerCase()
                      .includes('transferencia') &&
                    banks.filter(b => b.activo).length > 0 && (
                      <select
                        value={line.bank_id ?? ''}
                        onChange={e => updateLine(line.id, { bank_id: e.target.value || undefined })}
                        disabled={disabled}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold outline-none bg-white disabled:opacity-50"
                      >
                        <option value="">Banco...</option>
                        {banks.filter(b => b.activo).map(b => (
                          <option key={b.id} value={b.id}>{b.nombre}</option>
                        ))}
                      </select>
                    )}
                  <input
                    type="text"
                    placeholder="N° de referencia"
                    value={line.referencia ?? ''}
                    onChange={e =>
                      updateLine(line.id, { referencia: e.target.value || undefined })
                    }
                    disabled={disabled}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold outline-none bg-white disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      {paymentLines.some(l => l.monto > 0) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold border flex items-center justify-between ${
            sufficient
              ? 'bg-success-muted border-success-border text-success'
              : 'bg-warning-muted border-warning/20 text-warning'
          }`}
        >
          {sufficient ? (
            <span className="font-bold">✓ Pago completo</span>
          ) : (
            <>
              <span>Falta por cobrar</span>
              <span className="font-black tabular-nums text-base">
                {baseCurrency} {remaining.toFixed(2)}
              </span>
            </>
          )}
          {sufficient && remaining < -PAYMENT_TOLERANCE && (
            <span className="text-xs text-success/70 tabular-nums">
              Tasa: 1 US$ = C$ {exchangeRate.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
