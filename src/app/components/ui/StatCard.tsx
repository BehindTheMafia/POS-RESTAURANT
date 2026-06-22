import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: string
  sub?: string
  icon: ReactNode
  /** Optional override: any valid CSS color string */
  color?: string
  /** Optional override: any valid CSS color string for the icon background */
  bg?: string
}

export const StatCard = ({ label, value, sub, icon, color, bg }: StatCardProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-default">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-muted text-brand"
        style={color || bg ? { backgroundColor: bg, color } : undefined}
      >
        {icon}
      </div>
    </div>
  </div>
)
