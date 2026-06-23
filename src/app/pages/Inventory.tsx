import React, { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Plus, AlertTriangle, Edit2, RefreshCw, X, Power, Trash2 } from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';

export function Inventory() {
  const { items, lowItems, loading, error, refetch, createItem, updateItem, deleteItem } = useInventory();
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const currency = restaurant?.moneda ?? 'C$';
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '', tipo: 'ingrediente' });
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ingrediente' | 'salsa' | 'low'>('all');

  const [showEdit, setShowEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '', activo: true, tipo: 'ingrediente' });

  const displayItems = filter === 'low'
    ? items.filter(i => i.stock_actual <= i.stock_minimo)
    : filter === 'all'
    ? items
    : items.filter(i => i.tipo === filter);

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setEditForm({
      nombre: item.nombre,
      unidad: item.unidad,
      stock_actual: String(item.stock_actual),
      stock_minimo: String(item.stock_minimo),
      costo_unitario: String(item.costo_unitario),
      activo: item.activo,
      tipo: item.tipo,
    });
    setShowEdit(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      await updateItem(editingItem.id, {
        nombre: editForm.nombre,
        unidad: editForm.unidad,
        stock_actual: parseFloat(editForm.stock_actual) || 0,
        stock_minimo: parseFloat(editForm.stock_minimo) || 0,
        costo_unitario: parseFloat(editForm.costo_unitario) || 0,
        activo: editForm.activo,
        tipo: editForm.tipo,
      });
      setShowEdit(false);
      setEditingItem(null);
      toast.success('Ingrediente actualizado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  async function handleToggleActive(item: InventoryItem) {
    try {
      await updateItem(item.id, { activo: !item.activo });
      toast.success(item.activo ? 'Ingrediente desactivado' : 'Ingrediente activado');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDialogConfirm() {
    if (!dialog) return
    setDialogLoading(true)
    try {
      await dialog.onConfirm()
      setDialog(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDialogLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSavingCreate(true);
    try {
      await createItem({
        nombre: form.nombre,
        unidad: form.unidad,
        stock_actual: parseFloat(form.stock_actual) || 0,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        costo_unitario: parseFloat(form.costo_unitario) || 0,
        tipo: form.tipo,
      });
      setShowCreate(false);
      setForm({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '', tipo: 'ingrediente' });
      toast.success('Ingrediente creado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCreate(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Inventario"
        subtitle={`${items.length} ingredientes · ${lowItems.length} bajo mínimo`}
        actions={
          <>
            <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="default" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Nuevo Ingrediente
            </Button>
          </>
        }
      />

      {/* Alerta de stock bajo */}
      {lowItems.length > 0 && (
        <div className="bg-warning-muted border border-warning/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-warning font-medium text-sm">
              {lowItems.length} ingrediente{lowItems.length > 1 ? 's' : ''} bajo stock mínimo
            </p>
            <p className="text-warning/80 text-xs mt-0.5">
              {lowItems.map(i => i.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'ingrediente', 'salsa', 'low'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'ingrediente' ? 'Ingredientes' : f === 'salsa' ? 'Salsas' : `⚠ Bajo mínimo (${lowItems.length})`}
          </button>
        ))}
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl shadow-2xl flex flex-col max-h-[96vh] md:max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">Nuevo Ingrediente</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Nombre - full width */}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 block mb-1">Nombre</label>
                  <input type="text" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Bolsa de Alitas"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                    required />
                </div>

                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Unidad de medida</label>
                    <input type="text" value={form.unidad}
                      onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                      placeholder="Ej: bolsa, litro, kg"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock actual</label>
                    <input type="number" value={form.stock_actual}
                      onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))}
                      placeholder="0" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock mínimo</label>
                    <input type="number" value={form.stock_minimo}
                      onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                      placeholder="0" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Costo unitario</label>
                    <input type="number" value={form.costo_unitario}
                      onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))}
                      placeholder="0.00" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                </div>

                {/* Tipo */}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 block mb-1">Tipo</label>
                  <div className="flex flex-col gap-2">
                    {(['ingrediente', 'salsa'] as const).map(t => (
                      <motion.button key={t} type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setForm(f => ({ ...f, tipo: t }))}
                        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          form.tipo === t ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t === 'ingrediente' ? 'Ingrediente' : 'Salsa'}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors">
                  Cancelar
                </motion.button>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  disabled={savingCreate}
                  className="flex-1 py-3 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60 cursor-pointer hover:brightness-110 transition-all">
                  {savingCreate ? 'Creando...' : 'Crear'}
                </motion.button>
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
            className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl shadow-2xl flex flex-col max-h-[96vh] md:max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">Editar Ingrediente</h3>
              <button onClick={() => { setShowEdit(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Nombre - full width */}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 block mb-1">Nombre</label>
                  <input type="text" value={editForm.nombre}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Bolsa de Alitas"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                    required />
                </div>

                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Unidad de medida</label>
                    <input type="text" value={editForm.unidad}
                      onChange={e => setEditForm(f => ({ ...f, unidad: e.target.value }))}
                      placeholder="Ej: bolsa, litro, kg"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock actual</label>
                    <input type="number" value={editForm.stock_actual}
                      onChange={e => setEditForm(f => ({ ...f, stock_actual: e.target.value }))}
                      placeholder="0" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Tipo</label>
                    <div className="flex flex-col gap-2">
                      {(['ingrediente', 'salsa'] as const).map(t => (
                        <motion.button key={t} type="button"
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setEditForm(f => ({ ...f, tipo: t }))}
                          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                            editForm.tipo === t ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {t === 'ingrediente' ? 'Ingrediente' : 'Salsa'}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock mínimo</label>
                    <input type="number" value={editForm.stock_minimo}
                      onChange={e => setEditForm(f => ({ ...f, stock_minimo: e.target.value }))}
                      placeholder="0" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Costo unitario</label>
                    <input type="number" value={editForm.costo_unitario}
                      onChange={e => setEditForm(f => ({ ...f, costo_unitario: e.target.value }))}
                      placeholder="0.00" step="0.001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button type="button"
                      onClick={() => setEditForm(f => ({ ...f, activo: !f.activo }))}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${editForm.activo ? 'bg-brand' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${editForm.activo ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <label className="text-sm text-gray-600">Activo</label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowEdit(false); setEditingItem(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors">
                  Cancelar
                </motion.button>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  disabled={savingEdit}
                  className="flex-1 py-3 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60 cursor-pointer hover:brightness-110 transition-all">
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FlaskConical size={32} className="text-gray-200 mb-3" />
            <p className="text-gray-400">No hay ingredientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Ingrediente</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Unidad</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Stock Actual</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Stock Mínimo</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-5 py-3.5">Costo Unit.</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Estado</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, i) => {
                  const isLow = item.stock_actual <= item.stock_minimo;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: item.activo === false ? 0.6 : 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-gray-50 ${isLow && item.activo !== false ? 'bg-warning-muted/30' : 'hover:bg-gray-50/50'} ${item.activo === false ? 'opacity-60' : ''} transition-colors`}
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        {isLow && item.activo !== false && <AlertTriangle size={12} className="inline text-warning mr-1.5" />}
                        {item.nombre}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{item.unidad}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`font-semibold ${isLow && item.activo !== false ? 'text-warning' : 'text-gray-800'}`}>
                          {item.stock_actual}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-500">{item.stock_minimo}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{currency} {item.costo_unitario.toFixed(4)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          !item.activo ? 'bg-gray-100 text-gray-500' :
                          isLow ? 'bg-warning-muted text-warning' : 'bg-success-muted text-success'
                        }`}>
                          {!item.activo ? 'Inactivo' : isLow ? 'Bajo' : 'OK'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Editar Detalles"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${
                              item.activo ? 'text-success hover:text-destructive' : 'text-gray-400 hover:text-success'
                            }`}
                            title={item.activo ? 'Desactivar Ingrediente' : 'Activar Ingrediente'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => setDialog({
                              title: 'Eliminar Ingrediente',
                              message: `¿Eliminar "${item.nombre}" permanentemente?`,
                              confirmLabel: 'Eliminar',
                              variant: 'danger',
                              onConfirm: async () => {
                                await deleteItem(item.id);
                                toast.success('Ingrediente eliminado');
                              },
                            } as ConfirmDialogState)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive-muted text-gray-400 hover:text-destructive transition-colors"
                            title="Eliminar Ingrediente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!dialog}
        loading={dialogLoading}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        variant={dialog?.variant}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
