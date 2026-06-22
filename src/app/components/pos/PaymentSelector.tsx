import { Wallet, CreditCard, Smartphone } from 'lucide-react'

type PaymentSelectorProps = {
  activeType: 'cash' | 'card' | 'qr'
  onChange: (type: 'cash' | 'card' | 'qr') => void
  disabled?: boolean
}

export const PaymentSelector = ({ activeType, onChange, disabled }: PaymentSelectorProps) => {
  const options = [
    { id: 'cash' as const, label: 'Efectivo', icon: <Wallet size={14} /> },
    { id: 'card' as const, label: 'Tarjeta', icon: <CreditCard size={14} /> },
    { id: 'qr' as const, label: 'Código QR', icon: <Smartphone size={14} /> },
  ]

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => !disabled && onChange(opt.id)}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-11 disabled:opacity-45 disabled:cursor-not-allowed ${
            !disabled && activeType === opt.id
              ? 'bg-brand-muted border-brand text-brand shadow-sm'
              : 'bg-white border-gray-150 text-gray-500 hover:border-gray-300'
          }`}
        >
          {opt.icon}
          <span className="text-[8px] font-black mt-0.5">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
