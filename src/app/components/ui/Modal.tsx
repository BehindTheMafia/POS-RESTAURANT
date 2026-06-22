import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from './button'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export const Modal = ({ open, onClose, title, children, footer }: ModalProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <Button variant="ghost" size="iconTouch" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </Button>
        </div>
        <div>{children}</div>
        {footer && <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">{footer}</div>}
      </motion.div>
    </div>
  )
}
