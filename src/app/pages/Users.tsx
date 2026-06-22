import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users as UsersIcon, UserPlus, CheckCircle, XCircle, RefreshCw, Key, Pencil } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';

export function Users() {
  const { users, roles, loading, error, fetchUsers, createUser, updateUser, toggleUserActive } = useUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', role_id: '', password: '' });
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '', role_id: '' });
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const roleLabel: Record<string, string> = {
    admin: 'Administrador', cajero: 'Cajero', mesero: 'Mesero',
  };
  const roleColors: Record<string, string> = {
    admin: 'bg-brand-muted text-brand',
    cajero: 'bg-blue-100 text-blue-700',
    mesero: 'bg-success-muted text-success',
  };

  function openEdit(usr: typeof users[0]) {
    setEditingUserId(usr.id);
    setEditForm({
      nombre: usr.nombre,
      telefono: usr.telefono ?? '',
      role_id: usr.role_id ?? '',
    });
    setFormError('');
    setShowEdit(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;
    setFormError('');
    if (!editForm.nombre || !editForm.role_id) {
      setFormError('Nombre y rol son obligatorios');
      return;
    }
    setSavingEdit(true);
    try {
      await updateUser(editingUserId, {
        nombre: editForm.nombre,
        telefono: editForm.telefono || null,
        role_id: editForm.role_id,
      });
      setShowEdit(false);
      setEditingUserId(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.nombre || !form.correo || !form.role_id || !form.password) {
      setFormError('Todos los campos son obligatorios');
      return;
    }
    setCreating(true);
    try {
      await createUser(form);
      setShowCreate(false);
      setForm({ nombre: '', correo: '', telefono: '', role_id: '', password: '' });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} usuarios registrados`}
        actions={
          <>
            <Button variant="outline" size="iconTouch" onClick={fetchUsers} aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="default" onClick={() => setShowCreate(true)}>
              <UserPlus size={16} /> Nuevo Usuario
            </Button>
          </>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="font-semibold text-gray-900 mb-5">Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre completo</label>
                <input type="text" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                  required />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Correo electrónico</label>
                <input type="email" value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                  required />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono (opcional)</label>
                <input type="tel" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Contraseña</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                    placeholder="Mínimo 8 caracteres" required />
                  <button type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
                      const pw = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                      setForm(f => ({ ...f, password: pw }));
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                    title="Generar contraseña">
                    <Key size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Rol</label>
                <select value={form.role_id}
                  onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white"
                  required>
                  <option value="">Seleccionar rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{roleLabel[r.nombre] ?? r.nombre}</option>
                  ))}
                </select>
              </div>
              {formError && (
                <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal editar */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="font-semibold text-gray-900 mb-5">Editar Usuario</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre completo</label>
                <input type="text" value={editForm.nombre}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                  required />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono (opcional)</label>
                <input type="tel" value={editForm.telefono}
                  onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Rol</label>
                <select value={editForm.role_id}
                  onChange={e => setEditForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white"
                  required>
                  <option value="">Seleccionar rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{roleLabel[r.nombre] ?? r.nombre}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Para cambiar contraseña, contacte al administrador del sistema.
              </p>
              {formError && (
                <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lista usuarios */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <UsersIcon size={32} className="text-gray-200 mb-3" />
            <p className="text-gray-400">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((usr, i) => {
              const roleName = usr.roles?.nombre ?? '';
              const initials = usr.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <motion.div
                  key={usr.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${usr.activo ? 'bg-brand' : 'bg-gray-400'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{usr.nombre}</p>
                      {!usr.activo && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{usr.correo}</p>
                    {usr.telefono && <p className="text-xs text-gray-400">{usr.telefono}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[roleName] ?? 'bg-gray-100 text-gray-600'}`}>
                      {roleLabel[roleName] ?? roleName}
                    </span>
                    <button
                      onClick={() => openEdit(usr)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Editar usuario"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleUserActive(usr.id, !usr.activo)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        usr.activo
                          ? 'text-success hover:bg-success-muted'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={usr.activo ? 'Desactivar' : 'Activar'}
                    >
                      {usr.activo ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
