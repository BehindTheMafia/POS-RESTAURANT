import React, { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Plus, AlertTriangle, Edit2, RefreshCw, Save, X, Power } from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';

export function Inventory() {
  const { items, lowItems, loading, error, refetch, createItem, updateItem, adjustStock } = useInventory();
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const currency = restaurant?.moneda ?? 'C$';
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStockValues, setNewStockValues] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '' });
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  const [showEdit, setShowEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '', activo: true });

  const displayItems = filter === 'low' ? items.filter(i => i.stock_actual <= i.stock_minimo) : items;

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setEditForm({
      nombre: item.nombre,
      unidad: item.unidad,
      stock_actual: String(item.stock_actual),
      stock_minimo: String(item.stock_minimo),
      costo_unitario: String(item.costo_unitario),
      activo: item.activo,
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

  async function handleToggleActive(item: InventoryItem) {
    try {
      await updateItem(item.id, { activo: !item.activo });
      toast.success(item.activo ? 'Ingrediente desactivado' : 'Ingrediente activado');
    } catch (err: any) {
      toast.error(err.message);
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
      });
      setShowCreate(false);
      setForm({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', costo_unitario: '' });
      toast.success('Ingrediente creado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleAdjustStock(itemId: string) {
    const val = parseFloat(newStockValues[itemId]);
    if (isNaN(val) || val < 0) { toast.error('Valor inválido'); return; }
    setSavingAdjust(true);
    try {
      await adjustStock(itemId, val, user?.id ?? '');
      setEditingId(null);
      toast.success('Stock actualizado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingAdjust(false);
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
        {(['all', 'low'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : `⚠ Bajo mínimo (${lowItems.length})`}
          </button>
        ))}
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Nuevo Ingrediente</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'Ej: Bolsa de Alitas' },
                { label: 'Unidad de medida', key: 'unidad', type: 'text', placeholder: 'Ej: bolsa, litro, kg' },
                { label: 'Stock actual', key: 'stock_actual', type: 'number', placeholder: '0' },
                { label: 'Stock mínimo', key: 'stock_minimo', type: 'number', placeholder: '0' },
                { label: 'Costo unitario', key: 'costo_unitario', type: 'number', placeholder: '0.00' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm text-gray-600 block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    step={field.type === 'number' ? '0.001' : undefined}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCreate}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
                  {savingCreate ? 'Creando...' : 'Crear'}
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Editar Ingrediente</h3>
              <button onClick={() => { setShowEdit(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              {[
                { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'Ej: Bolsa de Alitas' },
                { label: 'Unidad de medida', key: 'unidad', type: 'text', placeholder: 'Ej: bolsa, litro, kg' },
                { label: 'Stock actual', key: 'stock_actual', type: 'number', placeholder: '0' },
                { label: 'Stock mínimo', key: 'stock_minimo', type: 'number', placeholder: '0' },
                { label: 'Costo unitario', key: 'costo_unitario', type: 'number', placeholder: '0.00' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm text-gray-600 block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(editForm as any)[field.key]}
                    onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    step={field.type === 'number' ? '0.001' : undefined}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              ))}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 font-medium">Ingrediente Activo</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={e => setEditForm(f => ({ ...f, activo: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(false); setEditingItem(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
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
                  <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Ajustar</th>
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
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number" min="0" step="0.001"
                              value={newStockValues[item.id] ?? item.stock_actual}
                              onChange={e => setNewStockValues(v => ({ ...v, [item.id]: e.target.value }))}
                              className="w-20 border border-brand rounded-lg px-2 py-1 text-xs outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAdjustStock(item.id)}
                              disabled={savingAdjust}
                              className="text-brand hover:opacity-80 disabled:opacity-50 cursor-pointer"
                            >
                              {savingAdjust
                                ? <span className="w-3.5 h-3.5 border-2 border-brand/40 border-t-brand rounded-full animate-spin inline-block" />
                                : <Save size={14} />}
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="text-gray-400 hover:text-gray-600">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setNewStockValues(v => ({ ...v, [item.id]: String(item.stock_actual) }));
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 mx-auto transition-colors"
                            disabled={!item.activo}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
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
    </div>
  );
}
