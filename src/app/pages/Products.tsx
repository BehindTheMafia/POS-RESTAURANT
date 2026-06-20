import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Search, X, Check, Package, Drumstick, Ham, Beef, Utensils, GlassWater } from 'lucide-react';
import { useStore, addAuditLog } from '../store';
import type { Product } from '../types';
import { mockProducts } from '../mockData';

function fmt(n: number) {
  return `C$${n.toLocaleString('es-NI', { minimumFractionDigits: 0 })}`;
}

export function Products() {
  const { state, categories, dispatch } = useStore();
  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', categoryId: categories[0].id, price: '', cost: '', status: 'active' as 'active' | 'inactive' });

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', categoryId: categories[0].id, price: '', cost: '', status: 'active' });
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId, price: String(p.price), cost: String(p.cost), status: p.status });
    setShowModal(true);
  }

  function save() {
    const price = parseFloat(form.price) || 0;
    const cost = parseFloat(form.cost) || 0;
    if (!form.name) return;
    if (editing) {
      const oldProduct = products.find(p => p.id === editing.id)!;
      setProducts(ps => ps.map(p => p.id === editing.id ? { ...p, ...form, price, cost } : p));
      addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
        'Precio Editado', `Producto: ${form.name}`,
        { oldValue: `C$${oldProduct.price}`, newValue: `C$${price}` }
      );
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: form.name,
        categoryId: form.categoryId,
        price,
        cost,
        status: form.status,
      };
      setProducts(ps => [...ps, newProduct]);
      addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
        'Producto Creado', `Producto: ${form.name}`,
        { newValue: `Precio: ${fmt(price)} | Costo: ${fmt(cost)}` }
      );
    }
    setShowModal(false);
  }

  function toggleStatus(id: string) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  }

  const catName = (id: string) => categories.find(c => c.id === id)?.name ?? '—';
  const margin = (price: number, cost: number) => price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCatFilter('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm transition-all ${catFilter === 'all' ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={catFilter === 'all' ? { background: '#FF5A1F' } : undefined}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm transition-all ${catFilter === c.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={catFilter === c.id ? { background: '#FF5A1F' } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all shrink-0"
          style={{ background: '#FF5A1F' }}
        >
          <Plus size={14} />
          Nuevo producto
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Producto', 'Categoría', 'Precio', 'Costo', 'Margen', 'Estado', ''].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 text-[#FF5A1F]">
                      {p.categoryId === 'c1' ? <Drumstick size={16} /> : p.categoryId === 'c2' ? <Ham size={16} /> : p.categoryId === 'c3' ? <Beef size={16} /> : p.categoryId === 'c4' ? <Utensils size={16} /> : <GlassWater size={16} />}
                    </div>
                    <span className="text-gray-800 text-sm font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{catName(p.categoryId)}</span>
                </td>
                <td className="px-5 py-4 text-gray-700 text-sm font-medium">{fmt(p.price)}</td>
                <td className="px-5 py-4 text-gray-500 text-sm">{fmt(p.cost)}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${margin(p.price, p.cost) >= 50 ? 'bg-green-50 text-green-700' : margin(p.price, p.cost) >= 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
                    {margin(p.price, p.cost)}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleStatus(p.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${p.status === 'active' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 size={14} className="text-gray-400" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Modal */}
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
                <h3 className="text-gray-900">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Nombre</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre del producto"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1.5">Categoría</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Precio (C$)</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1.5">Costo (C$)</label>
                    <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
                  </div>
                </div>
                {form.price && form.cost && (
                  <p className="text-sm text-gray-500">
                    Margen: <span className="font-semibold text-green-600">{margin(parseFloat(form.price), parseFloat(form.cost))}%</span>
                  </p>
                )}
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
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: '#FF5A1F' }}>
                  <Check size={14} />
                  {editing ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
