import type { ReactNode } from 'react'
import { cn } from './utils'

type TouchChipProps = {
  active?: boolean
  onClick: () => void
  icon?: ReactNode
  label: string
  count?: number
  className?: string
}

export const TouchChip = ({ active, onClick, icon, label, count, className }: TouchChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'shrink-0 flex flex-col items-center justify-between w-28 h-32 p-4 rounded-[24px] border-2 transition-all duration-200 cursor-pointer min-h-[44px]',
      active
        ? 'bg-brand-muted border-brand text-brand shadow-sm'
        : 'bg-white border-gray-150 text-gray-700 hover:border-gray-300 hover:shadow-sm',
      className
    )}
  >
    {icon && (
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        active ? 'bg-brand/20 text-brand' : 'bg-gray-100 text-gray-500'
      )}>
        {icon}
      </div>
    )}
    <div className="text-center min-w-0 w-full">
      <p className="text-xs font-black leading-tight truncate">{label}</p>
      {count !== undefined && (
        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{count} items</p>
      )}
    </div>
  </button>
)
