import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Trash2, AlertTriangle, Info } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'default'

export type ConfirmDialogState = {
  title: string
  message: string
  confirmLabel?: string
  variant?: Variant
  inputLabel?: string
  inputPlaceholder?: string
  inputRequired?: boolean
  onConfirm: (inputValue?: string) => Promise<void>
}

type ConfirmDialogProps = ConfirmDialogState & {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: (inputValue?: string) => void
}

const ICON_MAP = {
  danger: Trash2,
  warning: AlertTriangle,
  default: Info,
}

const STYLES = {
  danger: {
    iconBg: 'bg-destructive-muted',
    iconColor: 'text-destructive',
    btn: 'bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20',
  },
  warning: {
    iconBg: 'bg-warning-muted',
    iconColor: 'text-warning',
    btn: 'bg-warning text-white hover:bg-warning/90 shadow-lg shadow-warning/20',
  },
  default: {
    iconBg: 'bg-brand-muted',
    iconColor: 'text-brand',
    btn: 'bg-brand text-brand-foreground hover:opacity-90 shadow-lg shadow-brand/20',
  },
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'default',
  loading,
  inputLabel,
  inputPlaceholder,
  inputRequired,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (open) setInputValue('')
  }, [open])

  const Icon = ICON_MAP[variant]
  const styles = STYLES[variant]
  const canConfirm = !loading && (!inputRequired || inputValue.trim().length > 0)

  if (!open) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.90, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.90, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Icon + title + message */}
          <div className="px-6 pt-7 pb-5">
            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-5`}>
              <Icon size={22} className={styles.iconColor} />
            </div>
            <h3 className="font-black text-gray-900 text-lg leading-snug">{title}</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
          </div>

          {/* Optional text input (e.g. reason for cancellation) */}
          {inputLabel && (
            <div className="px-6 pb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                {inputLabel}
              </label>
              <textarea
                autoFocus
                rows={2}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand resize-none transition-colors"
              />
              {inputRequired && (
                <p className="text-[10px] text-gray-400 mt-1">* Campo requerido</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(inputLabel ? inputValue : undefined)}
              disabled={!canConfirm}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-50 ${styles.btn}`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
