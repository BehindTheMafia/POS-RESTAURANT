import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { useAuthContext } from '../../AuthContext'
import { useLocation, useParams } from 'react-router'
import { isCounterTable } from '../../../lib/pos'
import { supabase } from '../../../lib/supabase'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Mesas',
  '/caja': 'Caja',
  '/productos': 'Productos',
  '/inventario': 'Inventario',
  '/reportes': 'Reportes',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
  '/auditoria': 'Auditoría',
}

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const { user } = useAuthContext()
  const location = useLocation()
  const { tableId } = useParams()
  const [tableName, setTableName] = useState<string | null>(null)

  const baseRoute = '/' + location.pathname.split('/')[1]
  let title = pageTitles[baseRoute] ?? 'POS Restaurant'

  useEffect(() => {
    if (baseRoute !== '/pos' || !tableId) {
      setTableName(null)
      return
    }

    let cancelled = false
    supabase
      .from('tables_restaurant')
      .select('nombre, tipo')
      .eq('id', tableId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          const name = data?.nombre ?? null
          setTableName(name && isCounterTable(data as any) ? 'Mostrador' : name)
        }
      })

    return () => { cancelled = true }
  }, [baseRoute, tableId])

  if (baseRoute === '/pos' && tableId) {
    title = tableName ? `Orden · ${tableName}` : 'Orden POS'
  }

  const today = new Date().toLocaleDateString('es-NI', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const initials = user?.profile?.nombre
    ? user.profile.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 shrink-0 cursor-pointer"
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-gray-900 truncate leading-tight">{title}</h1>
        <p className="text-gray-400 leading-none capitalize hidden sm:block" style={{ fontSize: '12px' }}>
          {today}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer" aria-label="Notificaciones">
          <Bell size={16} className="text-gray-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-xs font-bold shrink-0">
          {initials}
        </div>
      </div>
    </header>
  )
}
