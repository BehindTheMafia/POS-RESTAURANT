import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Shield, CreditCard, User, X, Check } from 'lucide-react';
import { useStore, addAuditLog } from '../store';
import type { User as UserType, UserRole } from '../types';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  admin: { label: 'Administrador', icon: <Shield size={12} />, color: '#FF5A1F', bg: '#FFF0EB' },
  cashier: { label: 'Cajero', icon: <CreditCard size={12} />, color: '#3B82F6', bg: '#EFF6FF' },
  waiter: { label: 'Mesero', icon: <User size={12} />, color: '#10B981', bg: '#ECFDF5' },
};

export function Users() {
  const { state, dispatch } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserType | null>(null);
  const [form, setForm] = useState({ name: '', username: '', role: 'waiter' as UserRole, status: 'active' as 'active' | 'inactive' });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', username: '', role: 'waiter', status: 'active' });
    setShowModal(true);
  }

  function openEdit(u: UserType) {
    setEditing(u);
    setForm({ name: u.name, username: u.username, role: u.role, status: u.status });
    setShowModal(true);
  }

  function save() {
    if (!form.name || !form.username) return;
    if (editing) {
      const updated = state.users.map(u => u.id === editing.id ? { ...u, ...form } : u);
      dispatch({ type: 'UPDATE_USERS', users: updated });
      addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
        'Usuario Actualizado', `Usuario: ${form.username}`,
        { oldValue: `Rol: ${editing.role}`, newValue: `Rol: ${form.role}` }
      );
    } else {
      const newUser: UserType = {
        id: `u-${Date.now()}`,
        name: form.name,
        username: form.username,
        role: form.role,
        status: form.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch({ type: 'UPDATE_USERS', users: [...state.users, newUser] });
      addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
        'Usuario Creado', `Usuario: ${form.username}`,
        { newValue: `Rol: ${form.role} — Estado: Activo` }
      );
    }
    setShowModal(false);
  }

  function toggleStatus(id: string) {
    const user = state.users.find(u => u.id === id)!;
    if (user.id === state.currentUser?.id) return;
    const updated = state.users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const } : u);
    dispatch({ type: 'UPDATE_USERS', users: updated });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-3 gap-4 flex-1 mr-6">
          {(['admin', 'cashier', 'waiter'] as UserRole[]).map(role => {
            const cfg = ROLE_CONFIG[role];
            const count = state.users.filter(u => u.role === role && u.status === 'active').length;
            return (
              <div key={role} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{cfg.label}</p>
                  <p className="text-gray-900 font-bold text-lg">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all shrink-0"
          style={{ background: '#FF5A1F' }}>
          <Plus size={14} />Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.users.map((user, i) => {
          const cfg = ROLE_CONFIG[user.role];
          const isCurrentUser = user.id === state.currentUser?.id;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-5 border-2 shadow-sm transition-all ${user.status === 'active' ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                    style={{ background: cfg.color }}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">{user.name}</p>
                    <p className="text-gray-400 text-xs">@{user.username}</p>
                  </div>
                </div>
                {!isCurrentUser && (
                  <button onClick={() => openEdit(user)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 size={13} className="text-gray-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon}{cfg.label}
                </span>
                <button
                  onClick={() => toggleStatus(user.id)}
                  disabled={isCurrentUser}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${user.status === 'active' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:cursor-not-allowed`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {isCurrentUser && (
                <p className="text-xs text-gray-400 mt-2 text-center">Tu cuenta</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-gray-900">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Nombre completo</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Usuario</label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="nombre_usuario"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Rol</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'cashier', 'waiter'] as UserRole[]).map(role => {
                      const cfg = ROLE_CONFIG[role];
                      return (
                        <button key={role} onClick={() => setForm(f => ({ ...f, role }))}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition-all border-2 ${form.role === role ? 'border-[#FF5A1F] bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          <span style={{ color: form.role === role ? cfg.color : undefined }}>{cfg.icon}</span>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Estado</label>
                  <div className="flex gap-2">
                    {(['active', 'inactive'] as const).map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`flex-1 py-2 rounded-xl text-sm transition-all ${form.status === s ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                        style={form.status === s ? { background: s === 'active' ? '#10B981' : '#9CA3AF' } : undefined}>
                        {s === 'active' ? 'Activo' : 'Inactivo'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: '#FF5A1F' }}>
                  <Check size={14} />{editing ? 'Guardar' : 'Crear usuario'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
