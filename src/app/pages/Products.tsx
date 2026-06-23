import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { staggerContainer, staggerItem, scaleInVariants, fadeVariants, t, spring } from '../../lib/animations';
import {
  Package, Plus, Search, Edit2, Power, Upload,
  RefreshCw, Tag, X, ChevronDown, Trash2
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useInventory } from '../../hooks/useInventory';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';
import { ProductStockSection } from '../components/products/ProductStockSection';
import type { RecipeItem } from '../components/products/ProductRecipeEditor';
import { calcProductStock, inferStockMode, formatStockLabel, type StockMode } from '../../lib/stock';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';

type FormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  costo: string;
  category_id: string;
  activo: boolean;
  stock: string;
};

const defaultForm: FormState = {
  nombre: '', descripcion: '', precio: '', costo: '', category_id: '', activo: true, stock: '',
};

export function Products() {
  const { products, categories, recipes, loading, error, refetch, createProduct, updateProduct, deleteProduct, createCategory, updateCategory, deleteCategory, uploadProductImage, saveRecipes, getRecipesForProduct } = useProducts();
  const { items: inventoryItems } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Categorías edit state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Confirm dialog
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const showConfirm = (d: ConfirmDialogState) => setDialog(d)
  const handleDialogConfirm = async (input?: string) => {
    if (!dialog) return
    setDialogLoading(true)
    try { await dialog.onConfirm(input) }
    finally { setDialogLoading(false); setDialog(null) }
  }

  // Stock / receta edit state
  const [stockMode, setStockMode] = useState<StockMode>('unlimited');
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  const filteredProducts = useMemo(() =>
    products
      .filter(p => !filterCategory || p.category_id === filterCategory)
      .filter(p => !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, filterCategory, searchTerm]
  );

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setStockMode('unlimited');
    setRecipeItems([]);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEdit(p: typeof products[0]) {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      costo: String(p.costo),
      category_id: p.category_id ?? '',
      activo: p.activo,
      stock: p.stock !== null && p.stock !== undefined ? String(p.stock) : '',
    });
    const productRecipes = getRecipesForProduct(p.id);
    setStockMode(inferStockMode(p, productRecipes));
    setRecipeItems(productRecipes.map(r => ({
      inventory_item_id: r.inventory_item_id,
      cantidad_consumida: r.cantidad_consumida,
    })));
    setImagePreview(p.imagen_url ?? null);
    setImageFile(null);
    setShowModal(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const cleanRecipe = recipeItems.filter(r => r.inventory_item_id && r.cantidad_consumida > 0);
    if (stockMode === 'recipe' && cleanRecipe.length === 0) {
      toast.error('Agrega al menos un ingrediente con cantidad válida');
      return;
    }

    setSaving(true);
    try {
      const data = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        precio: parseFloat(form.precio),
        costo: parseFloat(form.costo) || 0,
        category_id: form.category_id || null,
        activo: form.activo,
        stock: stockMode === 'direct' && form.stock.trim() !== '' ? parseInt(form.stock, 10) : null,
      };

      // skipRefresh=true on the first calls — saveRecipes does the final fetchAll.
      const productId = editingId
        ? (await updateProduct(editingId, data, { skipRefresh: true }), editingId)
        : await createProduct(data, { skipRefresh: true });

      if (imageFile) await uploadProductImage(productId, imageFile, { skipRefresh: true });

      // Receta atómica: en modo receta se guardan ingredientes; en otros modos se limpian
      await saveRecipes(productId, stockMode === 'recipe' ? cleanRecipe : []);

      const recipeMsg = stockMode === 'recipe'
        ? ` · ${cleanRecipe.length} ingrediente${cleanRecipe.length === 1 ? '' : 's'} en receta`
        : '';
      toast.success(`${editingId ? 'Producto actualizado' : 'Producto creado'}${recipeMsg}`);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteProduct(id: string, nombre: string) {
    showConfirm({
      title: 'Eliminar Producto',
      message: `¿Eliminar "${nombre}" permanentemente? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await deleteProduct(id)
        toast.success('Producto eliminado permanentemente')
      },
    })
  }

  function handleDeleteCategory(id: string, nombre: string) {
    showConfirm({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${nombre}"? Los productos asociados quedarán sin categoría.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await deleteCategory(id)
        toast.success('Categoría eliminada')
      },
    })
  }

  async function handleToggle(id: string, activo: boolean) {
    try {
      await updateProduct(id, { activo: !activo });
      toast.success(!activo ? 'Producto activado' : 'Producto desactivado');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      setShowCatModal(false);
      toast.success('Categoría creada');
    } catch (err: any) {
      toast.error(err.message);
    }
  }
  async function handleUpdateCategoryName(id: string, newName: string) {
    if (!newName.trim()) return;
    try {
      await updateCategory(id, { nombre: newName.trim() });
      setEditingCatId(null);
      toast.success('Categoría actualizada');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleToggleCategoryStatus(id: string, currentStatus: boolean) {
    try {
      await updateCategory(id, { estado: !currentStatus });
      toast.success(!currentStatus ? 'Categoría activada' : 'Categoría desactivada');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Productos"
        subtitle={`${products.filter(p => p.activo).length} activos · ${products.filter(p => !p.activo).length} inactivos`}
        actions={
          <>
            <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="outline" onClick={() => setShowCatModal(true)}>
              <Tag size={14} /> Categorías
            </Button>
            <Button variant="default" onClick={openCreate}>
              <Plus size={16} /> Nuevo Producto
            </Button>
          </>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory(null)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              !filterCategory ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            Todos
          </button>
          {categories.filter(c => c.estado).map(cat => (
            <button key={cat.id}
              onClick={() => setFilterCategory(cat.id === filterCategory ? null : cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filterCategory === cat.id ? 'bg-brand text-brand-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-brand-muted rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-brand" />
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">Sin productos</h3>
          <p className="text-gray-400 text-sm mb-4">
            {searchTerm ? 'No hay productos que coincidan con la búsqueda' : 'Crea tu primer producto'}
          </p>
          {!searchTerm && (
            <button onClick={openCreate}
              className="px-6 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium cursor-pointer">
              Crear Producto
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filteredProducts.map((p) => {
            const productRecipes = getRecipesForProduct(p.id);
            const mode = inferStockMode(p, productRecipes);
            const stockValue = calcProductStock(p, recipes, inventoryItems);
            const stockLabel = formatStockLabel(stockValue, mode);
            const isRecipeOut = mode === 'recipe' && stockValue <= 0;

            return (
            <motion.div
              key={p.id}
              variants={staggerItem}
              transition={t.enter}
              whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] } }}
              className={`bg-white rounded-2xl border overflow-hidden cursor-default ${
                p.activo ? 'border-gray-100 shadow-sm hover:shadow-md' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Imagen */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={28} className="text-gray-300" />
                  </div>
                )}
                {!p.activo && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Inactivo</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm leading-tight truncate">{p.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.categories?.nombre ?? 'Sin categoría'}</p>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="font-bold text-sm text-brand">C$ {p.precio.toFixed(2)}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                    isRecipeOut
                      ? 'bg-destructive-muted text-destructive border-destructive/20'
                      : mode === 'recipe'
                        ? 'bg-brand-muted text-brand border-brand/20'
                        : 'text-gray-500 bg-gray-50 dark:bg-gray-800/40 border-gray-150 dark:border-gray-800/85'
                  }`}>
                    {stockLabel}
                  </span>
                </div>
                <div className="flex gap-1.5 w-full mt-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-xs">
                    <Edit2 size={11} /> Editar
                  </button>
                  <button onClick={() => handleToggle(p.id, p.activo)}
                    className={`w-8 h-7 flex items-center justify-center rounded-lg transition-colors text-xs ${
                      p.activo ? 'bg-destructive-muted text-destructive hover:bg-destructive/20' : 'bg-success-muted text-success hover:bg-success/20'
                    }`}
                    title={p.activo ? 'Desactivar' : 'Activar'}>
                    <Power size={12} />
                  </button>
                  {p.activo && (
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.nombre)}
                      className="w-8 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal crear/editar producto */}
      {showModal && (
        <motion.div
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={t.fade}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            variants={scaleInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring.popup}
            className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl shadow-2xl flex flex-col max-h-[96vh] md:max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Left column: basic fields */}
                <div className="space-y-4">
                  {/* Imagen */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      {imagePreview
                        ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        : <Package size={20} className="text-gray-300" />}
                    </div>
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400 hover:border-brand hover:text-brand cursor-pointer transition-colors">
                      <Upload size={14} />
                      {imageFile ? imageFile.name : 'Subir imagen'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Nombre *</label>
                    <input type="text" value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Descripción</label>
                    <textarea value={form.descripcion}
                      onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand resize-none"
                      rows={1} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Precio venta *</label>
                      <input type="number" min="0" step="0.01" value={form.precio}
                        onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                        required />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Costo</label>
                      <input type="number" min="0" step="0.01" value={form.costo}
                        onChange={e => setForm(f => ({ ...f, costo: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Categoría</label>
                    <select value={form.category_id}
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white">
                      <option value="">Sin categoría</option>
                      {categories.filter(c => c.estado).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right column: stock section + active toggle */}
                <div className="space-y-4">
                  <ProductStockSection
                    mode={stockMode}
                    onModeChange={setStockMode}
                    stock={form.stock}
                    onStockChange={value => setForm(f => ({ ...f, stock: value }))}
                    productName={form.nombre}
                    inventoryItems={inventoryItems}
                    recipeItems={recipeItems}
                    onRecipeChange={setRecipeItems}
                  />
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-brand' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.activo ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <label className="text-sm text-gray-600">Producto activo</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60">
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal categorías */}
      {showCatModal && (
        <motion.div
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={t.fade}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            variants={scaleInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring.popup}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Gestionar Categorías</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Lista */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {categories.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Sin categorías</p>
                : categories.map(cat => (
                    <div key={cat.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              className="flex-1 border border-brand rounded-lg px-2 py-1 text-xs outline-none bg-white font-medium text-gray-900"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCategoryName(cat.id, editingCatName)}
                              className="text-brand hover:opacity-80 font-semibold text-xs cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="text-gray-400 hover:text-gray-600 font-medium text-xs cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">{cat.nombre}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cat.estado ? 'bg-success-muted text-success' : 'bg-gray-200 text-gray-500'}`}>
                            {cat.estado ? 'Activa' : 'Inactiva'}
                          </span>
                          {!editingCatId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.nombre);
                              }}
                              className="p-1 rounded hover:bg-gray-250 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Editar nombre"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                            title="Eliminar categoría"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryStatus(cat.id, cat.estado)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              cat.estado ? 'bg-destructive-muted text-destructive hover:bg-destructive/20' : 'bg-success-muted text-success hover:bg-success/20'
                            }`}
                            title={cat.estado ? 'Desactivar' : 'Activar'}
                          >
                            <Power size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Crear */}
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input type="text" value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand bg-white"
              />
              <button type="submit"
                className="px-3 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-medium cursor-pointer">
                <Plus size={15} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

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
