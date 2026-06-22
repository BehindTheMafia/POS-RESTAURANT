export type PaymentCurrency = 'NIO' | 'USD'

export type PaymentLine = {
  id: string
  payment_method_id: string
  currency: PaymentCurrency
  monto: number
  bank_id?: string
  referencia?: string
}

export type SalePaymentInput = {
  payment_method_id: string
  bank_id?: string
  referencia?: string
  nota?: string
  monto: number
}

export const DEFAULT_EXCHANGE_RATE = 36.5
export const PAYMENT_TOLERANCE = 0.01

export const currencySymbol = (c: PaymentCurrency) => (c === 'USD' ? 'US$' : 'C$')

export const toBaseCurrency = (
  amount: number,
  currency: PaymentCurrency,
  rate: number
): number => {
  if (currency === 'USD') return Math.round(amount * rate * 100) / 100
  return Math.round(amount * 100) / 100
}

export const sumPaymentsInBase = (
  lines: PaymentLine[],
  rate: number
): number => {
  const sum = lines.reduce(
    (s, p) => s + toBaseCurrency(p.monto || 0, p.currency, rate),
    0
  )
  return Math.round(sum * 100) / 100
}

export const remainingToPay = (total: number, paidInBase: number): number =>
  Math.round((total - paidInBase) * 100) / 100

export const isPaymentSufficient = (total: number, paidInBase: number): boolean =>
  paidInBase >= total - PAYMENT_TOLERANCE

export const calcChange = (received: number, due: number): number =>
  Math.max(0, Math.round((received - due) * 100) / 100)

export const sumCashInBase = (
  lines: PaymentLine[],
  paymentMethods: Array<{ id: string; nombre: string }>,
  rate: number
): number => {
  return lines
    .filter(line => {
      const pm = paymentMethods.find(p => p.id === line.payment_method_id)
      return pm?.nombre.toLowerCase().includes('efectivo')
    })
    .reduce((s, p) => s + toBaseCurrency(p.monto || 0, p.currency, rate), 0)
}

export const normalizePaymentsForSale = (
  lines: PaymentLine[],
  rate: number
): SalePaymentInput[] =>
  lines
    .filter(p => p.monto > 0 && p.payment_method_id)
    .map(p => {
      const baseAmount = toBaseCurrency(p.monto, p.currency, rate)
      const nota =
        p.currency === 'USD'
          ? `USD ${p.monto.toFixed(2)} @ ${rate.toFixed(2)}`
          : undefined
      return {
        payment_method_id: p.payment_method_id,
        bank_id: p.bank_id,
        referencia: p.referencia,
        nota,
        monto: baseAmount,
      }
    })

export const createEmptyPaymentLine = (
  paymentMethods: Array<{ id: string; nombre: string }>
): PaymentLine => {
  const cash =
    paymentMethods.find(p => p.nombre.toLowerCase().includes('efectivo')) ??
    paymentMethods[0]
  return {
    id: crypto.randomUUID(),
    payment_method_id: cash?.id ?? '',
    currency: 'NIO',
    monto: 0,
  }
}

export const findPaymentMethodByKind = (
  methods: Array<{ id: string; nombre: string }>,
  kind: 'cash' | 'card' | 'qr'
): { id: string; nombre: string } | undefined => {
  const keyword =
    kind === 'cash' ? 'efectivo' : kind === 'card' ? 'tarjeta' : 'transferencia'
  return (
    methods.find(p => p.nombre.toLowerCase().includes(keyword)) ?? methods[0]
  )
}

export const isCashMethod = (
  methodId: string,
  methods: Array<{ id: string; nombre: string }>
): boolean => {
  const pm = methods.find(p => p.id === methodId)
  return pm?.nombre.toLowerCase().includes('efectivo') ?? false
}

export const isCardOrQrMethod = (
  methodId: string,
  methods: Array<{ id: string; nombre: string }>
): boolean => {
  const name = methods.find(p => p.id === methodId)?.nombre.toLowerCase() ?? ''
  return name.includes('tarjeta') || name.includes('transferencia') || name.includes('qr')
}

export const formatPaymentLineLabel = (
  line: PaymentLine,
  methods: Array<{ id: string; nombre: string }>,
  rate: number
): string => {
  const pm = methods.find(p => p.id === line.payment_method_id)
  const sym = currencySymbol(line.currency)
  const base = toBaseCurrency(line.monto, line.currency, rate)
  if (line.currency === 'USD') {
    return `${pm?.nombre ?? 'Pago'}: ${sym} ${line.monto.toFixed(2)} (C$ ${base.toFixed(2)})`
  }
  return `${pm?.nombre ?? 'Pago'}: ${sym} ${line.monto.toFixed(2)}`
}
