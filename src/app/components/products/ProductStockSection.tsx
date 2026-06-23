import { type ReactNode } from 'react'
import { Infinity as InfinityIcon, Hash, FlaskConical } from 'lucide-react'
import type { InventoryItem } from '../../../hooks/useInventory'
import type { StockMode } from '../../../lib/stock'
import { ProductRecipeEditor, type RecipeItem } from './ProductRecipeEditor'

type ProductStockSectionProps = {
  mode: StockMode
  onModeChange: (mode: StockMode) => void
  stock: string
  onStockChange: (value: string) => void
  productName: string
  inventoryItems: InventoryItem[]
  recipeItems: RecipeItem[]
  onRecipeChange: (items: RecipeItem[]) => void
}

const MODES: Array<{ id: StockMode; label: string; icon: ReactNode; hint: string }> = [
  { id: 'unlimited', label: 'Sin límite', icon: <InfinityIcon size={16} />, hint: 'No se controla stock' },
  { id: 'direct', label: 'Stock manual', icon: <Hash size={16} />, hint: 'Cantidad fija editable' },
  { id: 'recipe', label: 'Inventario', icon: <FlaskConical size={16} />, hint: 'Descuenta materia prima' },
]

export const ProductStockSection = ({
  mode,
  onModeChange,
  stock,
  onStockChange,
  productName,
  inventoryItems,
  recipeItems,
  onRecipeChange,
}: ProductStockSectionProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm text-gray-600 block">Control de stock</label>

      <div className="grid grid-cols-3 gap-2">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
              mode === m.id
                ? 'bg-brand-muted border-brand text-brand'
                : 'bg-white border-gray-150 text-gray-500 hover:border-gray-300'
            }`}
          >
            {m.icon}
            <span className="text-xs font-bold">{m.label}</span>
            <span className="text-[10px] text-gray-400 text-center leading-tight">{m.hint}</span>
          </button>
        ))}
      </div>

      {mode === 'direct' && (
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={e => onStockChange(e.target.value)}
            placeholder="Cantidad disponible"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      )}

      {mode === 'recipe' && (
        <ProductRecipeEditor
          productName={productName}
          inventoryItems={inventoryItems}
          recipeItems={recipeItems}
          onChange={onRecipeChange}
        />
      )}
    </div>
  )
}
