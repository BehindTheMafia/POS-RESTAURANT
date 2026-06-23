import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plus, Minus, Trash2, ShoppingCart,
  Search, CheckCircle, LayoutGrid, Egg,
  Soup, CookingPot, ChefHat, GlassWater, Cake, UtensilsCrossed,
  Edit, Printer, XCircle, MessageSquare
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useTables } from '../../hooks/useTables';
import { useInventory } from '../../hooks/useInventory';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { supabase, RESTAURANT_ID } from '../../lib/supabase';
import { fetchSaleForPrint, printSaleTicket } from '../../lib/printTicket';
import { isCounterTable } from '../../lib/pos';
import { calcProductStock } from '../../lib/stock';
import { CompleteSaleModal } from '../components/pos/CompleteSaleModal';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';
import { useCashRegister } from '../../hooks/useCashRegister';
import type { PaymentLine } from '../../lib/payments';
import {
  createEmptyPaymentLine,
  DEFAULT_EXCHANGE_RATE,
  normalizePaymentsForSale,
} from '../../lib/payments';

export function POSOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const { tables } = useTables();
  const { orders, createOrder, addOrderItem, updateOrderItemQty, removeOrderItem, cancelOrder, refetch: refetchOrders } = useOrders(tableId);
  const { products, categories, recipes, loading: prodLoading } = useProducts();
  const { paymentMethods, banks, completeSale } = useSales();
  const { items: inventoryItems } = useInventory();
  const { activeRegister } = useCashRegister();
  const hasCashRegister = !!activeRegister;

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [printing, setPrinting] = useState(false);
  const [saleResult, setSaleResult] = useState<{ sale_id: string; total: number } | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [cliente, setCliente] = useState('Consumidor Final');
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  const handleDialogConfirm = async (input?: string) => {
    if (!dialog) return;
    setDialogLoading(true);
    try { await dialog.onConfirm(input); }
    catch (err: any) { toast.error(err.message); }
    finally { setDialogLoading(false); setDialog(null); }
  };

  // Optimistic cart overlay: applied immediately on user action,
  // cleared when the server refetch returns.
  const [optCart, setOptCart] = useState<typeof items | null>(null);
  const pendingOps = useRef(0);

  // Refs for race-condition locking
  const orderCreationRef = useRef<Promise<string> | null>(null);
  const operationLock = useRef<Promise<void>>(Promise.resolve());

  const currency = restaurant?.moneda ?? 'C$';
  const exchangeRate = restaurant?.tipo_cambio ?? DEFAULT_EXCHANGE_RATE;
  const ivaPercent = restaurant?.settings?.iva_porcentaje ?? 15;

  const table = tables.find(t => t.id === tableId);
  const isCounter = isCounterTable(table);
  const currentOrder = orders.find(o => o.mesa_id === tableId && o.estado === 'abierto') ?? null;
  const items = currentOrder?.order_items ?? [];

  // Optimistic display state: shows user actions instantly while DB round-trip completes.
  // Falls back to server items when no operations are pending.
  const cartItems = optCart ?? items;

  const getProductStock = useCallback((product: typeof products[0]) => {
    return calcProductStock(product, recipes, inventoryItems);
  }, [recipes, inventoryItems]);

  const getProductAvailableStock = useCallback((product: typeof products[0]) => {
    const totalStock = getProductStock(product);
    if (totalStock === Infinity) return Infinity;
    const cartItem = cartItems.find(item => item.product_id === product.id);
    return Math.max(0, totalStock - (cartItem?.cantidad ?? 0));
  }, [getProductStock, cartItems]);

  const itemQuantityMaxedOut = useCallback((product: typeof products[0], cartItem: typeof items[0]) => {
    const totalStock = getProductStock(product);
    if (totalStock === Infinity) return false;
    return cartItem.cantidad >= totalStock;
  }, [getProductStock]);

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const base = subtotal - descuento;
  const iva = Math.round(base * ivaPercent / 100 * 100) / 100;
  const total = base + iva;
  const canComplete = cartItems.length > 0 && hasCashRegister

  const filteredProducts = useMemo(() =>
    products
      .filter(p => p.activo)
      .filter(p => !activeCategoryId || p.category_id === activeCategoryId)
      .filter(p => !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, activeCategoryId, searchTerm]
  );

  useEffect(() => {
    if (items.length === 0) {
      setPaymentLines([])
      setDescuento(0)
    }
  }, [items.length])

  const handleAddPaymentLine = () => {
    setPaymentLines(prev => [...prev, createEmptyPaymentLine(paymentMethods)]);
  };

  // Crear orden automáticamente si no existe (con prevención de llamadas concurrentes)
  async function ensureOrder(): Promise<string> {
    if (currentOrder) return currentOrder.id;
    if (orderCreationRef.current) return orderCreationRef.current;

    if (!tableId || !user?.id) throw new Error('Sin mesa o usuario del sistema');
    setCreatingOrder(true);

    const promise = (async () => {
      try {
        const orderId = await createOrder(tableId, user.id, undefined, { skipTableStatus: isCounter });
        await refetchOrders();
        return orderId;
      } finally {
        orderCreationRef.current = null;
        setCreatingOrder(false);
      }
    })();

    orderCreationRef.current = promise;
    return promise;
  }

  // ── Optimistic helpers ─────────────────────────────────────────────────────
  // Apply an optimistic patch immediately so the cart reacts before the DB
  // round-trip completes, then flush the overlay once the server confirms.

  function applyOptimisticAndFlush(
    patch: (current: typeof items) => typeof items,
    dbWork: () => Promise<void>
  ) {
    // Apply patch instantly (reads latest optCart or server items)
    setOptCart(prev => patch(prev ?? items))
    pendingOps.current++

    const release = new Promise<void>((resolve) => {
      operationLock.current.then(async () => {
        try {
          await dbWork()
          // Single refetch — realtime already covers duplicates
          await refetchOrders()
        } catch (err: any) {
          toast.error(err.message)
        } finally {
          pendingOps.current--
          if (pendingOps.current === 0) setOptCart(null) // hand off to server state
          resolve()
        }
      })
    })
    operationLock.current = release
  }

  async function handleAddProduct(product: typeof products[0]) {
    const existing = cartItems.find(i => i.product_id === product.id)
    const existingQty = existing?.cantidad ?? 0
    const totalStock = getProductStock(product)

    if (totalStock !== Infinity && existingQty + 1 > totalStock) {
      toast.error(`Stock insuficiente. Solo hay ${totalStock} unidades disponibles.`)
      return
    }

    applyOptimisticAndFlush(
      (cur) => {
        const ex = cur.find(i => i.product_id === product.id)
        if (ex) {
          return cur.map(i =>
            i.id === ex.id
              ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
              : i
          )
        }
        return [
          ...cur,
          {
            id: `opt-${product.id}-${Date.now()}`,
            order_id: currentOrder?.id ?? '',
            product_id: product.id,
            cantidad: 1,
            precio_unitario: product.precio,
            subtotal: product.precio,
            observaciones: null,
            notas: null,
            created_at: new Date().toISOString(),
          } as typeof items[0],
        ]
      },
      async () => {
        const orderId = await ensureOrder()
        // Use local items (not optCart) so the DB write is based on last confirmed state
        const serverExisting = items.find(i => i.product_id === product.id)
        if (serverExisting) {
          await updateOrderItemQty(serverExisting.id, serverExisting.cantidad + 1, product.precio)
        } else {
          await addOrderItem(orderId, {
            product_id: product.id,
            cantidad: 1,
            precio_unitario: product.precio,
          })
        }
      }
    )
  }

  async function handleQtyChange(itemId: string, delta: number, current: number, precio: number) {
    const newQty = current + delta

    if (delta > 0) {
      const serverItem = items.find(i => i.id === itemId)
      if (serverItem) {
        const product = products.find(p => p.id === serverItem.product_id)
        if (product) {
          const totalStock = getProductStock(product)
          if (totalStock !== Infinity && newQty > totalStock) {
            toast.error(`Stock insuficiente. Solo hay ${totalStock} unidades disponibles.`)
            return
          }
        }
      }
    }

    applyOptimisticAndFlush(
      (cur) =>
        newQty <= 0
          ? cur.filter(i => i.id !== itemId)
          : cur.map(i =>
              i.id === itemId
                ? { ...i, cantidad: newQty, subtotal: newQty * i.precio_unitario }
                : i
            ),
      async () => {
        if (newQty <= 0) {
          await removeOrderItem(itemId)
        } else {
          await updateOrderItemQty(itemId, newQty, precio)
        }
      }
    )
  }

  async function handleRemoveItem(itemId: string) {
    applyOptimisticAndFlush(
      (cur) => cur.filter(i => i.id !== itemId),
      () => removeOrderItem(itemId)
    )
  }

  async function handleCompleteSale() {
    if (!currentOrder || !user?.id) return
    if (items.length === 0) return
    // Reset payment lines to a fresh empty line so the modal starts clean
    if (paymentMethods.length > 0) {
      const line = createEmptyPaymentLine(paymentMethods)
      line.monto = 0
      setPaymentLines([line])
    }
    setShowCompleteModal(true)
  }

  async function handleConfirmSale() {
    if (!currentOrder || !user?.id) return
    setCompleting(true)
    try {
      // ── Client-side stock re-validation with fresh DB data ────────────────
      // Protects against stale local state (e.g. product restocked or depleted
      // by another cashier between adding items and confirming the sale).
      const productIds = items.map(i => i.product_id).filter((id): id is string => id !== null)

      const [{ data: freshProducts }, { data: freshInventory }, { data: allRecipes }] =
        await Promise.all([
          supabase
            .from('products')
            .select('id, nombre, stock')
            .eq('restaurant_id', RESTAURANT_ID)
            .in('id', productIds),
          supabase
            .from('inventory_items')
            .select('id, nombre, stock_actual')
            .eq('restaurant_id', RESTAURANT_ID),
          supabase
            .from('recipes')
            .select('product_id, inventory_item_id, cantidad_consumida')
            .in('product_id', productIds),
        ])

      // 1. Direct product stock check
      for (const item of items) {
        const product = freshProducts?.find(p => p.id === item.product_id)
        if (product && product.stock !== null && product.stock !== undefined) {
          if (product.stock < item.cantidad) {
            throw new Error(
              `Stock insuficiente para "${product.nombre}": disponible ${product.stock}, solicitado ${item.cantidad}`
            )
          }
        }
      }

      // 2. Recipe ingredient stock check (aggregate per ingredient)
      const ingredientTotals = new Map<string, { nombre: string; available: number; required: number }>()
      for (const item of items) {
        const productRecipes = allRecipes?.filter(r => r.product_id === item.product_id) ?? []
        for (const recipe of productRecipes) {
          const ingredient = freshInventory?.find(inv => inv.id === recipe.inventory_item_id)
          if (!ingredient) continue
          const needed = recipe.cantidad_consumida * item.cantidad
          const existing = ingredientTotals.get(recipe.inventory_item_id)
          if (existing) {
            existing.required += needed
          } else {
            ingredientTotals.set(recipe.inventory_item_id, {
              nombre: ingredient.nombre,
              available: ingredient.stock_actual,
              required: needed,
            })
          }
        }
      }

      for (const { nombre, available, required } of ingredientTotals.values()) {
        if (available < required) {
          throw new Error(
            `Ingrediente insuficiente "${nombre}": disponible ${available}, requerido ${required}`
          )
        }
      }
      // ── End stock validation ───────────────────────────────────────────────

      const normalized = normalizePaymentsForSale(paymentLines, exchangeRate)
      const result = await completeSale(
        currentOrder.id,
        user.id,
        normalized,
        descuento,
        ivaPercent
      );

      if (cliente && cliente.trim() !== 'Consumidor Final') {
        await supabase
          .from('sales')
          .update({ cliente: cliente.trim() })
          .eq('id', result.sale_id);
      }

      // RF 4.4.5: mesa pasa a 'sucia' (no 'libre') para que el staff limpie antes de liberar
      if (tableId && !isCounter) {
        await supabase
          .from('tables_restaurant')
          .update({ estado: 'sucia' })
          .eq('id', tableId);
      }

      await refetchOrders();
      setShowCompleteModal(false);
      setPaymentLines([]);
      setSaleResult({ sale_id: result.sale_id, total: result.total });
    } catch (err: any) {
      toast.error(`Error al completar venta: ${err.message}`);
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancelOrder() {
    if (!currentOrder || !tableId) return;
    setDialog({
      title: 'Anular pedido',
      message: '¿Anular este pedido? Esta acción eliminará todos los ítems y no se puede deshacer.',
      confirmLabel: 'Anular pedido',
      variant: 'danger',
      onConfirm: async () => {
        setCancelling(true);
        try {
          await cancelOrder(currentOrder.id, tableId, { skipTableStatus: isCounter });
          await refetchOrders();
          toast.success('Pedido anulado');
          navigate('/pos');
        } catch (err: any) {
          toast.error(`Error al anular: ${err.message}`);
        } finally {
          setCancelling(false);
        }
      },
    });
  }

  async function handleSaveNote(itemId: string) {
    // Actualiza notas en la BD directamente
    try {
      await supabase.from('order_items').update({ notas: noteText.trim() || null }).eq('id', itemId);
      await refetchOrders();
      setEditingNoteItemId(null);
      setNoteText('');
    } catch (err: any) {
      toast.error(`Error al guardar nota: ${err.message}`);
    }
  }

  const getCategoryItemCount = useCallback((categoryId: string | null) => {
    if (!categoryId) {
      return products.filter(p => p.activo).length;
    }
    return products.filter(p => p.activo && p.category_id === categoryId).length;
  }, [products]);

  const getCategoryIcon = useCallback((name: string) => {
    const n = name.toLowerCase();
    if (n.includes('desayuno') || n.includes('breakfast')) return <Egg size={20} />;
    if (n.includes('sopa') || n.includes('soup') || n.includes('entrada')) return <Soup size={20} />;
    if (n.includes('pasta')) return <CookingPot size={20} />;
    if (n.includes('principal') || n.includes('plato') || n.includes('fuerte')) return <ChefHat size={20} />;
    if (n.includes('burger') || n.includes('carne') || n.includes('wing') || n.includes('alita')) return <ChefHat size={20} />;
    if (n.includes('bebida') || n.includes('drink') || n.includes('refresco') || n.includes('jugo')) return <GlassWater size={20} />;
    if (n.includes('postre') || n.includes('dessert') || n.includes('dulce')) return <Cake size={20} />;
    return <UtensilsCrossed size={20} />;
  }, []);

  async function handlePrintTicket() {
    if (!saleResult) return
    setPrinting(true)
    try {
      const sale = await fetchSaleForPrint(saleResult.sale_id)
      await printSaleTicket(sale, {
        restaurantName: restaurant?.nombre,
        commercialName: restaurant?.nombre_comercial,
        currency,
        ticketMessage: restaurant?.settings?.ticket_mensaje,
        ticketSize: restaurant?.settings?.ticket_tamano as '58mm' | '80mm' | undefined,
        title: 'Ticket',
      })
    } catch (err: any) {
      toast.error(`Error al imprimir: ${err.message}`)
    } finally {
      setPrinting(false)
    }
  }

  if (saleResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-brand-subtle">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-brand-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-brand" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Venta Completada!</h2>
          <p className="text-gray-400 font-medium mb-1">Monto total cobrado</p>
          <p className="text-5xl font-black mb-8 text-brand">
            {currency} {saleResult.total.toFixed(2)}
          </p>
          <button
            onClick={() => { setSaleResult(null); refetchOrders(); }}
            className="w-full py-3.5 rounded-2xl border-2 border-brand text-brand font-bold text-base hover:bg-brand-muted transition-all duration-200 active:scale-[0.98] cursor-pointer mb-3 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Nueva Venta
          </button>
          <button
            onClick={handlePrintTicket}
            disabled={printing}
            className="w-full py-3.5 rounded-2xl border-2 border-brand text-brand font-bold text-base hover:bg-brand-muted transition-all active:scale-[0.98] cursor-pointer mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Printer size={18} />
            {printing ? 'Preparando...' : 'Imprimir Ticket'}
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="w-full py-4 rounded-2xl bg-brand text-brand-foreground font-bold text-lg hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            Volver a Mesas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-brand-subtle select-none overflow-hidden w-full relative">
      {/* LEFT: Touch-optimized Products Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-subtle pb-24 lg:pb-0 h-full relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4 border-b border-gray-150 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pos')}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl border border-gray-250 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer bg-white shrink-0">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <p className="text-base sm:text-lg font-black text-gray-900 leading-tight">Menú Principal</p>
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
                {isCounter ? 'Mostrador · Para llevar' : `${table?.nombre ?? 'Mesa'} · ${table?.capacidad ?? 0} pers.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="flex-1 sm:w-80 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-250 text-xs sm:text-sm font-medium outline-none focus:border-brand bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Categories (Chili POS Style) */}
        <div className="flex gap-4 px-6 py-4 border-b border-gray-150 overflow-x-auto shrink-0 scrollbar-none bg-brand-subtle">
          {/* Card for All */}
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`shrink-0 flex flex-col items-center justify-between w-28 h-32 p-4 rounded-[24px] border-2 transition-all cursor-pointer ${
              !activeCategoryId
                ? 'bg-brand-muted border-brand text-brand shadow-sm'
                : 'bg-white border-gray-150 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!activeCategoryId ? 'bg-brand/20 text-brand' : 'bg-gray-100 text-gray-500'}`}>
              <LayoutGrid size={18} />
            </div>
            <div className="text-center">
              <p className="text-xs font-black leading-tight">Todos</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{getCategoryItemCount(null)} items</p>
            </div>
          </button>

          {categories.filter(c => c.estado).map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 flex flex-col items-center justify-between w-28 h-32 p-4 rounded-[24px] border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-muted border-brand text-brand shadow-sm'
                    : 'bg-white border-gray-150 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-brand/20 text-brand' : 'bg-gray-100 text-gray-500'}`}>
                  {getCategoryIcon(cat.nombre)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-black leading-tight truncate">{cat.nombre}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{getCategoryItemCount(cat.id)} items</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Products Grid (Standardized aspect sizes, very rounded cards) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50/20">
          {prodLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="min-h-[11.5rem] bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-400 font-semibold text-lg">No hay productos disponibles</p>
              {searchTerm && <p className="text-gray-400 text-sm mt-1">Intente buscando con otro término</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {filteredProducts.map(p => {
                const initials = p.nombre.substring(0, 2).toUpperCase();
                const available = getProductAvailableStock(p);
                const isOutOfStock = available <= 0;
                
                const inCartQty = cartItems.find(item => item.product_id === p.id)?.cantidad ?? 0

                return (
                  <motion.div
                    whileTap={!isOutOfStock ? { scale: 0.94 } : {}}
                    whileHover={!isOutOfStock ? { y: -2 } : {}}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddProduct(p)}
                    className={`relative flex flex-col rounded-2xl overflow-hidden text-left min-h-[11.5rem] cursor-pointer border-2 transition-all duration-200 ease-out ${
                      isOutOfStock
                        ? 'opacity-50 pointer-events-none border-gray-200 bg-gray-50'
                        : inCartQty > 0
                          ? 'border-brand bg-brand-muted shadow-md shadow-brand/10'
                          : 'border-gray-200 bg-white hover:border-brand/50 hover:bg-brand-subtle hover:shadow-lg hover:shadow-brand/8 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="relative h-28 mx-3 mt-3 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {p.imagen_url ? (
                        <img
                          src={p.imagen_url}
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-muted text-brand">
                          <span className="text-xl font-black tracking-wide">{initials}</span>
                        </div>
                      )}

                      {inCartQty > 0 && (
                        <div className="absolute top-1.5 left-1.5 min-w-6 h-6 px-1 rounded-full bg-brand text-brand-foreground text-[11px] font-black flex items-center justify-center shadow-sm">
                          {inCartQty}
                        </div>
                      )}

                      {!isOutOfStock && available !== Infinity && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-white/90 text-gray-600 px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm">
                          {available}
                        </span>
                      )}

                      {isOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-black uppercase tracking-wide">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-3 pt-2.5 min-w-0">
                      <p className="text-[11px] text-gray-400 font-semibold truncate">
                        {p.categories?.nombre ?? 'General'}
                      </p>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-0.5">
                        {p.nombre}
                      </h4>
                      <p className="text-base font-black text-brand mt-auto pt-2">
                        {currency} {p.precio.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile floating view cart button */}
        <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40">
          <button 
            onClick={() => setIsCartMobileOpen(true)} 
            className="w-full bg-brand text-brand-foreground px-6 py-4 rounded-[20px] shadow-lg shadow-brand/30 font-bold flex justify-between items-center active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={24} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className="text-lg">Ver Pedido</span>
            </div>
            <span className="text-xl font-black">{currency} {total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Order Details & Actions */}
      <div className={`w-full lg:w-[400px] flex-col bg-white border-t lg:border-t-0 lg:border-l border-gray-150 shrink-0 h-full shadow-xl ${isCartMobileOpen ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex'}`}>
        
        {/* Mobile Header for Cart */}
        <div className="lg:hidden flex items-center p-3 border-b border-gray-150 bg-white shrink-0 gap-3">
          <button onClick={() => setIsCartMobileOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl border border-gray-250 hover:bg-gray-50 active:scale-95 transition-all bg-white cursor-pointer">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-black text-gray-900">Detalles del Pedido</h2>
        </div>

        {/* Header with Table / Waiter info */}
        <div className="px-4 py-3 border-b border-gray-150 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-gray-900 text-base leading-tight">
                {isCounter ? 'Mostrador' : (table?.nombre ?? 'Mesa')}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                Cajero: {user?.profile?.nombre ?? 'Sistema'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentOrder && cartItems.length > 0 && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  title="Anular pedido"
                  className="p-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-all text-red-500 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <XCircle size={16} />
                </button>
              )}
              <button onClick={() => navigate('/pos')} className="p-2 rounded-xl bg-gray-50 border border-gray-150 hover:bg-gray-100 transition-all text-gray-500 active:scale-95 cursor-pointer">
                <Edit size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto p-3 bg-brand-subtle">
          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12 px-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
                <ShoppingCart size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-800 font-bold text-sm">{isCounter ? 'Pedido vacío' : 'Mesa sin productos'}</p>
              <p className="text-gray-400 text-xs mt-1.5">Toque un producto del menú para agregarlo</p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <AnimatePresence initial={false} mode="popLayout">
              {cartItems.map(item => {
                const product = products.find(p => p.id === item.product_id);
                const initials = product?.nombre.substring(0, 2).toUpperCase() ?? '';
                const isMaxed = product ? itemQuantityMaxedOut(product, item) : false;
                const isOptimistic = item.id.startsWith('opt-');

                return (
                  <motion.div
                    key={item.product_id}
                    layout
                    initial={{ opacity: 0, scale: 0.88, y: 10 }}
                    animate={{ opacity: isOptimistic ? 0.75 : 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, x: 24, transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] } }}
                    transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl mb-2 last:mb-0 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                      {product?.imagen_url ? (
                        <img src={product.imagen_url} alt={product?.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand-muted text-brand flex items-center justify-center text-[11px] font-black">
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                        {product?.nombre ?? 'Producto'}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setEditingNoteItemId(item.id); setNoteText((item as any).notas ?? ''); }}
                        className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer w-fit ${
                          (item as any).notas
                            ? 'bg-brand/10 text-brand hover:bg-brand/20'
                            : 'bg-gray-100 text-gray-550 hover:bg-brand/10 hover:text-brand'
                        }`}
                      >
                        <MessageSquare size={11} className={(item as any).notas ? 'text-brand' : 'text-gray-450'} />
                        <span className="truncate max-w-[100px]">
                          {(item as any).notas ? (item as any).notas : '+ Nota'}
                        </span>
                      </button>
                      <p className="text-[11px] text-gray-450 mt-0.5">
                        {currency} {item.precio_unitario.toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.82 }}
                        onClick={() => handleQtyChange(item.id, -1, item.cantidad, item.precio_unitario)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-destructive active:scale-95 transition-colors cursor-pointer rounded-l-xl"
                        aria-label="Reducir cantidad"
                      >
                        <Minus size={12} className="stroke-[2.5px]" />
                      </motion.button>
                      <motion.span
                        key={item.cantidad}
                        initial={{ scale: 1.5, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className="text-sm font-black text-gray-900 w-7 text-center tabular-nums"
                      >
                        {item.cantidad}
                      </motion.span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.82 }}
                        onClick={() => handleQtyChange(item.id, 1, item.cantidad, item.precio_unitario)}
                        disabled={isOptimistic || (product ? isMaxed : true)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand active:scale-95 transition-colors cursor-pointer rounded-r-xl disabled:opacity-30"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={12} className="stroke-[2.5px]" />
                      </motion.button>
                    </div>

                    <p className="text-sm font-black text-gray-900 w-[4.5rem] text-right shrink-0 tabular-nums">
                      {currency} {item.subtotal.toFixed(2)}
                    </p>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.82 }}
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-8 h-8 rounded-lg text-gray-300 hover:text-destructive hover:bg-destructive-muted flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Eliminar"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Totals & Integrated Payment Panel */}
        <div className="border-t border-gray-150 p-4 space-y-3 bg-white shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          <div className="rounded-xl bg-brand-subtle border border-gray-100 p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800 tabular-nums">{cartItems.length > 0 ? `${currency} ${subtotal.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IVA ({ivaPercent}%)</span>
              <span className="font-semibold text-gray-800 tabular-nums">{cartItems.length > 0 ? `${currency} ${iva.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
              <span>Descuento</span>
              <div className="relative w-24">
                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] ${cartItems.length === 0 ? 'opacity-50' : ''}`}>{currency}</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={cartItems.length > 0 ? (descuento || '') : ''}
                  onChange={e => setDescuento(parseFloat(e.target.value) || 0)}
                  disabled={cartItems.length === 0}
                  className="w-full text-right border border-gray-200 rounded-lg pl-6 pr-2 py-1 text-xs font-bold outline-none focus:border-brand bg-white disabled:opacity-50"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-gray-200/80">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-2xl font-black text-brand tabular-nums">
                {cartItems.length > 0 ? `${currency} ${total.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          {!hasCashRegister && cartItems.length > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center mt-2">
              ⚠ Abre la caja antes de cobrar
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCompleteSale}
            disabled={completing || !canComplete}
            title={!hasCashRegister ? 'Debes abrir la caja registradora primero' : undefined}
            className="w-full py-3.5 rounded-2xl bg-brand text-brand-foreground font-black text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/10 mt-2"
          >
            {completing ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><CheckCircle size={16} /> Completar Venta</>
            )}
          </motion.button>
        </div>
      </div>

      <CompleteSaleModal
        open={showCompleteModal}
        onClose={() => !completing && setShowCompleteModal(false)}
        onConfirm={handleConfirmSale}
        confirming={completing}
        cliente={cliente}
        onClienteChange={setCliente}
        total={total}
        subtotal={subtotal}
        iva={iva}
        descuento={descuento}
        paymentLines={paymentLines}
        onPaymentLinesChange={setPaymentLines}
        onAddPaymentLine={handleAddPaymentLine}
        paymentMethods={paymentMethods}
        banks={banks}
        exchangeRate={exchangeRate}
        baseCurrency={currency}
      />

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

      {/* Modal para Notas de Preparación */}
      <AnimatePresence>
        {editingNoteItemId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-gray-150 space-y-4"
            >
              <div>
                <h3 className="font-black text-gray-900 text-lg">Notas de preparación</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Para: <span className="font-bold text-brand">
                    {(() => {
                      const item = cartItems.find(i => i.id === editingNoteItemId);
                      const prod = products.find(p => p.id === item?.product_id);
                      return prod?.nombre ?? 'Producto';
                    })()}
                  </span>
                </p>
              </div>

              <textarea
                autoFocus
                rows={3}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Escribe instrucciones especiales (ej. sin cebolla, salsa extra...)"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-gray-50 focus:bg-white transition-all resize-none"
              />

              {/* Quick chips */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notas rápidas</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sin cebolla',
                    'Sin picante',
                    'Salsa extra',
                    'Para llevar',
                    'Término medio',
                    'Bien cocido',
                    'Sin mayonesa',
                    'Sin lechuga',
                    'Pocas papas'
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const trimmed = noteText.trim();
                        if (trimmed.includes(chip)) return;
                        setNoteText(trimmed ? `${trimmed}, ${chip}` : chip);
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-brand/10 hover:text-brand text-gray-600 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingNoteItemId(null); setNoteText(''); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNote(editingNoteItemId)}
                  className="flex-1 py-3 rounded-xl bg-brand text-brand-foreground text-sm font-black transition-colors cursor-pointer shadow-md shadow-brand/10"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
