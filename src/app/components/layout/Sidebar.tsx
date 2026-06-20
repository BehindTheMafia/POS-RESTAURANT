import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, UtensilsCrossed, CreditCard, Package,
  FlaskConical, BarChart3, Users, Settings, ScrollText,
  LogOut, Flame, ChevronRight, X
} from 'lucide-react';
import { useStore } from '../../store';
import { motion } from 'motion/react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard',      roles: ['admin'] },
  { to: '/pos',           icon: <UtensilsCrossed size={18} />, label: 'Mesas / POS',    roles: ['admin', 'cashier', 'waiter'] },
  { to: '/caja',          icon: <CreditCard size={18} />,      label: 'Caja',           roles: ['admin', 'cashier'] },
  { to: '/productos',     icon: <Package size={18} />,         label: 'Productos',      roles: ['admin'] },
  { to: '/inventario',    icon: <FlaskConical size={18} />,    label: 'Inventario',     roles: ['admin'] },
  { to: '/reportes',      icon: <BarChart3 size={18} />,       label: 'Reportes',       roles: ['admin', 'cashier'] },
  { to: '/usuarios',      icon: <Users size={18} />,           label: 'Usuarios',       roles: ['admin'] },
  { to: '/configuracion', icon: <Settings size={18} />,        label: 'Configuración',  roles: ['admin'] },
  { to: '/auditoria',     icon: <ScrollText size={18} />,      label: 'Auditoría',      roles: ['admin'] },
];

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const role = state.currentUser?.role ?? 'waiter';
  const visible = navItems.filter(i => i.roles.includes(role));

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
    onClose();
    navigate('/login');
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-[#0F0F1A] text-white select-none shadow-2xl">

      {/* Logo + close button */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FF5A1F' }}>
          <Flame size={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white leading-none" style={{ fontSize: '15px', fontWeight: 700 }}>Prime Wings</p>
          <p className="text-white/40 leading-none mt-0.5" style={{ fontSize: '11px' }}>POS System</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${
                isActive
                  ? 'bg-[#FF5A1F]/15 text-[#FF5A1F]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-[#FF5A1F]/15"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10 shrink-0">{item.icon}</span>
                <span className="relative z-10 text-sm flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="relative z-10 text-[#FF5A1F] shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: '#FF5A1F' }}>
            {state.currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate leading-none">{state.currentUser?.name}</p>
            <p className="text-white/40 text-xs mt-0.5 capitalize">
              {state.currentUser?.role === 'admin' ? 'Administrador'
                : state.currentUser?.role === 'cashier' ? 'Cajero'
                : 'Mesero'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
        >
          <LogOut size={15} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
