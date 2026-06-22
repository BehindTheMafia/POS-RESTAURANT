import { motion } from 'motion/react'
import { TouchChip } from '../ui/TouchChip'

type Product = {
  id: string
  nombre: string
  precio: number
  imagen_url?: string | null
  activo: boolean
  category_id?: string | null
  categories?: { nombre?: string } | null
}

type ProductGridProps = {
  products: Product[]
  categories: Array<{ id: string; nombre: string; estado: boolean }>
  activeCategoryId: string | null
  onCategoryChange: (id: string | null) => void
  currency: string
  getCategoryItemCount: (id: string | null) => number
  getCategoryIcon: (name: string) => React.ReactNode
  onAddProduct: (product: Product) => void
  getProductAvailableStock: (product: Product) => number
  items: Array<{ id: string; product_id: string; cantidad: number; precio_unitario: number }>
  loading?: boolean
}

export const ProductGrid = ({
  products,
  categories,
  activeCategoryId,
  onCategoryChange,
  currency,
  getCategoryItemCount,
  getCategoryIcon,
  onAddProduct,
  getProductAvailableStock,
  items,
  loading,
}: ProductGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="min-h-[11.5rem] bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-4 px-6 py-4 border-b border-gray-150 overflow-x-auto shrink-0 scrollbar-none bg-brand-subtle">
        <TouchChip
          active={!activeCategoryId}
          onClick={() => onCategoryChange(null)}
          icon={getCategoryIcon('todos')}
          label="Todos"
          count={getCategoryItemCount(null)}
        />
        {categories.filter(c => c.estado).map(cat => (
          <TouchChip
            key={cat.id}
            active={activeCategoryId === cat.id}
            onClick={() => onCategoryChange(cat.id)}
            icon={getCategoryIcon(cat.nombre)}
            label={cat.nombre}
            count={getCategoryItemCount(cat.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 p-4 lg:p-6">
        {products.map(p => {
          const available = getProductAvailableStock(p)
          const isOutOfStock = available <= 0
          const inCartQty = items.find(item => item.product_id === p.id)?.cantidad ?? 0

          return (
            <motion.div
              key={p.id}
              whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
              onClick={() => !isOutOfStock && onAddProduct(p)}
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
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-muted text-brand">
                    <span className="text-xl font-black tracking-wide">{p.nombre.substring(0, 2).toUpperCase()}</span>
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
          )
        })}
      </div>
    </>
  )
}
