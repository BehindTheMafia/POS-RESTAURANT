import { Bell, AlertTriangle, Menu } from 'lucide-react';
import { useStore } from '../../store';
import { useLocation } from 'react-router';

const pageTitles: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/pos':           'Mesas',
  '/caja':          'Caja',
  '/productos':     'Productos',
  '/inventario':    'Inventario',
  '/reportes':      'Reportes',
  '/usuarios':      'Usuarios',
  '/configuracion': 'Configuración',
  '/auditoria':     'Auditoría',
};

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const { state } = useStore();
  const location = useLocation();

  const baseRoute = '/' + location.pathname.split('/')[1];
  const title = pageTitles[baseRoute] ?? 'Prime Wings POS';

  const lowStockCount = state.inventory.filter(i => i.stock <= i.minStock).length;
  const today = new Date().toLocaleDateString('es-NI', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">

      {/* Hamburger button — always visible */}
      <button
        onClick={onToggleSidebar}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0 cursor-pointer"
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-gray-900 truncate leading-tight">{title}</h1>
        <p className="text-gray-400 leading-none capitalize hidden sm:block" style={{ fontSize: '12px' }}>
          {today}
        </p>
      </div>

      {/* Right side badges + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {lowStockCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs border border-amber-200 whitespace-nowrap">
            <AlertTriangle size={12} />
            {lowStockCount} bajo stock
          </div>
        )}

        {state.cashRegister?.status === 'open' && (
          <div className="hidden md:flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs border border-green-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Caja abierta
          </div>
        )}

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5A1F]" />
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: '#FF5A1F' }}
        >
          {state.currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
