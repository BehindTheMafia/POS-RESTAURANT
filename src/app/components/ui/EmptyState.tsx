import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-gray-700 font-semibold mb-2">{title}</h3>
    {description && <p className="text-gray-400 text-sm max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
