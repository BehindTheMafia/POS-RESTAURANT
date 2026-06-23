import { NavLink, useNavigate } from 'react-router'
import {
  LayoutDashboard, UtensilsCrossed, Package,
  FlaskConical, BarChart3, Users, Settings, ScrollText,
  LogOut, Flame, ChevronRight
} from 'lucide-react'
import { useAuthContext } from '../../AuthContext'
import { motion } from 'motion/react'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  permission: string
}

const navItems: NavItem[] = [
  { to: '/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard',      permission: 'dashboard.view' },
  { to: '/pos',           icon: <UtensilsCrossed size={18} />, label: 'Mesas / POS',    permission: 'pos.view' },
  { to: '/productos',     icon: <Package size={18} />,         label: 'Productos',      permission: 'products.manage' },
  { to: '/inventario',    icon: <FlaskConical size={18} />,    label: 'Inventario',     permission: 'inventory.view' },
  { to: '/reportes',      icon: <BarChart3 size={18} />,       label: 'Reportes',       permission: 'reports.view' },
  { to: '/usuarios',      icon: <Users size={18} />,           label: 'Usuarios',       permission: 'users.manage' },
  { to: '/configuracion', icon: <Settings size={18} />,        label: 'Configuración',  permission: 'settings.manage' },
  { to: '/auditoria',     icon: <ScrollText size={18} />,      label: 'Auditoría',      permission: 'audit.view' },
]

interface SidebarProps {
  onClose: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, signOut, hasPermission } = useAuthContext()
  const navigate = useNavigate()

  const visible = navItems.filter(i => hasPermission(i.permission))

  async function handleLogout() {
    await signOut()
    onClose()
    navigate('/login')
  }

  const initials = user?.profile?.nombre
    ? user.profile.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const roleLabel =
    user?.roleName === 'admin' ? 'Administrador'
    : user?.roleName === 'cajero' ? 'Cajero'
    : 'Mesero'

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground select-none shadow-2xl">
      {/* Logo + close */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
          <Flame size={18} className="text-brand-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sidebar-foreground leading-none" style={{ fontSize: '15px', fontWeight: 700 }}>PRIMEWINGS POS</p>
          <p className="text-sidebar-foreground/40 leading-none mt-0.5" style={{ fontSize: '11px' }}>Sistema PRIMEWINGS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative min-h-11 cursor-pointer ${
                isActive
                  ? 'bg-sidebar-accent text-brand'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10 shrink-0">{item.icon}</span>
                <span className="relative z-10 text-sm flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="relative z-10 text-brand shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm truncate leading-none">{user?.profile?.nombre ?? 'Usuario'}</p>
            <p className="text-sidebar-foreground/40 text-xs mt-0.5">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/8 transition-all duration-200 text-sm cursor-pointer min-h-11"
        >
          <LogOut size={15} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
