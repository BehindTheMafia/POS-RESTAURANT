import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, AlertTriangle, Check, X, FlaskConical, BookOpen, Drumstick } from 'lucide-react';
import { useStore, addAuditLog } from '../store';
import type { InventoryItem } from '../types';

function fmt(n: number) {
  return `C$${n.toLocaleString('es-NI', { minimumFractionDigits: 0 })}`;
}

export function Inventory() {
  const { state, dispatch, recipes } = useStore();
  const [tab, setTab] = useState<'inventory' | 'recipes'>('inventory');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: '', unit: '', stock: '', minStock: '', cost: '' });

  const inventory = state.inventory;
  const lowStock = inventory.filter(i => i.stock <= i.minStock);

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setForm({ name: item.name, unit: item.unit, stock: String(item.stock), minStock: String(item.minStock), cost: String(item.cost) });
    setShowModal(true);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', unit: '', stock: '', minStock: '', cost: '' });
    setShowModal(true);
  }

  function save() {
    if (!form.name) return;
    const stock = parseFloat(form.stock) || 0;
    const minStock = parseFloat(form.minStock) || 0;
    const cost = parseFloat(form.cost) || 0;
    if (editing) {
      const oldItem = inventory.find(i => i.id === editing.id)!;
      const updated = inventory.map(i => i.id === editing.id ? { ...i, ...form, stock, minStock, cost } : i);
      dispatch({ type: 'UPDATE_INVENTORY', items: updated });
      addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
        'Inventario Actualizado', form.name,
        { oldValue: `${oldItem.stock} ${oldItem.unit}`, newValue: `${stock} ${form.unit}` }
      );
    } else {
      const newItem: InventoryItem = {
        id: `i-${Date.now()}`,
        name: form.name,
        unit: form.unit,
        stock,
        minStock,
        cost,
      };
      dispatch({ type: 'UPDATE_INVENTORY', items: [...inventory, newItem] });
    }
    setShowModal(false);
  }

  function stockColor(item: InventoryItem) {
    const ratio = item.stock / item.minStock;
    if (ratio <= 0.5) return { bg: 'bg-red-50', text: 'text-red-600', bar: '#EF4444' };
    if (ratio <= 1) return { bg: 'bg-amber-50', text: 'text-amber-600', bar: '#F59E0B' };
    return { bg: 'bg-green-50', text: 'text-green-600', bar: '#10B981' };
  }

  return (
    <div className="p-6 space-y-5">
      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4"
        >
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-amber-800 text-sm font-medium">{lowStock.length} ítem{lowStock.length > 1 ? 's' : ''} con stock bajo</p>
            <p className="text-amber-600 text-xs mt-0.5">{lowStock.map(i => i.name).join(' · ')}</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {[
            { key: 'inventory', label: 'Materia Prima', icon: <FlaskConical size={14} /> },
            { key: 'recipes', label: 'Recetas', icon: <BookOpen size={14} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${tab === t.key ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              style={tab === t.key ? { background: '#FF5A1F' } : undefined}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        {tab === 'inventory' && (
          <button onClick={openCreate} className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
            style={{ background: '#FF5A1F' }}>
            <Plus size={14} />Nuevo ítem
          </button>
        )}
      </div>

      {tab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.map((item, i) => {
            const colors = stockColor(item);
            const pct = Math.min(100, Math.round((item.stock / (item.minStock * 2)) * 100));
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-800 font-medium">{item.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Costo: {fmt(item.cost)} / {item.unit}</p>
                  </div>
                  <button onClick={() => openEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 size={13} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock actual</span>
                    <span className={`font-semibold ${colors.text}`}>{item.stock} {item.unit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: colors.bar }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Mín: {item.minStock} {item.unit}</span>
                    {item.stock <= item.minStock && (
                      <span className={`flex items-center gap-1 ${colors.text}`}>
                        <AlertTriangle size={10} />
                        Bajo stock
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 text-[#FF5A1F]">
                  <Drumstick size={18} />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{recipe.productName}</p>
                  <p className="text-gray-400 text-xs">{recipe.ingredients.length} ingredientes</p>
                </div>
              </div>
              <div className="space-y-2">
                {recipe.ingredients.map(ing => (
                  <div key={ing.ingredientId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 text-sm">{ing.ingredientName}</span>
                    <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit modal */}
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
                <h3 className="text-gray-900">{editing ? 'Editar ítem' : 'Nuevo ítem'}</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Nombre</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Unidad</label>
                    <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, litro, bolsa..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Costo (C$)</label>
                    <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Stock actual</label>
                    <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Stock mínimo</label>
                    <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: '#FF5A1F' }}>
                  <Check size={14} />Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
