import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Shield, ShoppingBag, Package, Settings, CreditCard, User } from 'lucide-react';
import { useStore } from '../store';

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Apertura de Caja': { bg: '#ECFDF5', text: '#059669', icon: <CreditCard size={12} /> },
  'Cierre de Caja': { bg: '#FEF3C7', text: '#D97706', icon: <CreditCard size={12} /> },
  'Venta Procesada': { bg: '#EFF6FF', text: '#2563EB', icon: <ShoppingBag size={12} /> },
  'Pedido Creado': { bg: '#F0FDF4', text: '#16A34A', icon: <ShoppingBag size={12} /> },
  'Inventario Actualizado': { bg: '#FFF7ED', text: '#EA580C', icon: <Package size={12} /> },
  'Precio Editado': { bg: '#FFF1F2', text: '#E11D48', icon: <Settings size={12} /> },
  'Descuento Aplicado': { bg: '#F5F3FF', text: '#7C3AED', icon: <CreditCard size={12} /> },
  'Usuario Creado': { bg: '#EFF6FF', text: '#2563EB', icon: <User size={12} /> },
  'Usuario Actualizado': { bg: '#F0FDF4', text: '#16A34A', icon: <User size={12} /> },
  'Configuración Actualizada': { bg: '#FFF7ED', text: '#EA580C', icon: <Settings size={12} /> },
};

function getActionConfig(action: string) {
  return ACTION_COLORS[action] ?? { bg: '#F9FAFB', text: '#6B7280', icon: <Shield size={12} /> };
}

export function Audit() {
  const { state } = useStore();
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const uniqueUsers = useMemo(() => {
    const names = [...new Set(state.auditLogs.map(l => l.userName))];
    return names;
  }, [state.auditLogs]);

  const uniqueActions = useMemo(() => {
    const actions = [...new Set(state.auditLogs.map(l => l.action))];
    return actions;
  }, [state.auditLogs]);

  const filtered = useMemo(() =>
    state.auditLogs.filter(log => {
      const matchSearch = search === '' ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.record.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase());
      const matchUser = userFilter === 'all' || log.userName === userFilter;
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchUser && matchAction;
    }),
    [state.auditLogs, search, userFilter, actionFilter]
  );

  return (
    <div className="p-6 space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar acción, registro, usuario..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
        </div>
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] bg-white">
          <option value="all">Todos los usuarios</option>
          {uniqueUsers.map(u => <option key={u}>{u}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] bg-white">
          <option value="all">Todas las acciones</option>
          {uniqueActions.map(a => <option key={a}>{a}</option>)}
        </select>
        <span className="text-gray-400 text-sm ml-auto">{filtered.length} registros</span>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Fecha/Hora', 'Usuario', 'Acción', 'Registro', 'Antes', 'Después', 'Motivo'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const cfg = getActionConfig(log.action);
              return (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-gray-700 text-sm">{log.date}</p>
                    <p className="text-gray-400 text-xs font-mono">{log.time}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: '#FF5A1F' }}>
                        {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-gray-700 text-sm whitespace-nowrap">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full whitespace-nowrap w-fit"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.icon}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm max-w-40 truncate">{log.record}</td>
                  <td className="px-5 py-3.5">
                    {log.oldValue ? (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">{log.oldValue}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {log.newValue ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{log.newValue}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs max-w-32 truncate">{log.reason ?? '—'}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Filter size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No hay registros que coincidan</p>
          </div>
        )}
      </div>
    </div>
  );
}
