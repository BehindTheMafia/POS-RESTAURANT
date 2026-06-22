import { Trash2, AlertTriangle, FlaskConical } from 'lucide-react'
import type { InventoryItem } from '../../../hooks/useInventory'
import { IngredientSelect } from './IngredientSelect'

export type RecipeItem = {
  inventory_item_id: string
  cantidad_consumida: number
}

type ProductRecipeEditorProps = {
  productName: string
  inventoryItems: InventoryItem[]
  recipeItems: RecipeItem[]
  onChange: (items: RecipeItem[]) => void
}

export const ProductRecipeEditor = ({
  productName,
  inventoryItems,
  recipeItems,
  onChange,
}: ProductRecipeEditorProps) => {
  const handleAdd = (item: InventoryItem) => {
    onChange([...recipeItems, { inventory_item_id: item.id, cantidad_consumida: 1 }])
  }

  const handleQtyChange = (id: string, value: string) => {
    const qty = parseFloat(value)
    onChange(
      recipeItems.map(r =>
        r.inventory_item_id === id ? { ...r, cantidad_consumida: isNaN(qty) ? 0 : qty } : r
      )
    )
  }

  const handleRemove = (id: string) => {
    onChange(recipeItems.filter(r => r.inventory_item_id !== id))
  }

  const excludeIds = recipeItems.map(r => r.inventory_item_id)

  return (
    <div className="space-y-3">
      <IngredientSelect
        inventoryItems={inventoryItems}
        productName={productName}
        excludeIds={excludeIds}
        onSelect={handleAdd}
      />

      {recipeItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center py-6 bg-warning-muted/40 rounded-xl border border-dashed border-warning/40">
          <AlertTriangle size={20} className="text-warning" />
          <p className="text-xs text-warning font-semibold px-4">
            Agrega al menos un ingrediente para descontar de inventario al vender.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recipeItems.map(item => {
            const ing = inventoryItems.find(i => i.id === item.inventory_item_id)
            return (
              <div
                key={item.inventory_item_id}
                className="flex items-center gap-2 p-3 bg-white border border-gray-150 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-muted text-brand flex items-center justify-center shrink-0">
                  <FlaskConical size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {ing?.nombre ?? 'Ingrediente desconocido'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Disponible: {ing?.stock_actual ?? 0} {ing?.unidad ?? ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.cantidad_consumida || ''}
                    onChange={e => handleQtyChange(item.inventory_item_id, e.target.value)}
                    className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-brand"
                    placeholder="0"
                  />
                  <span className="text-[11px] text-gray-400 w-10 truncate">{ing?.unidad ?? ''}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.inventory_item_id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive-muted text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                    aria-label="Eliminar ingrediente"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
          <p className="text-[11px] text-gray-400 px-1">
            Cantidad consumida por cada unidad vendida.
          </p>
        </div>
      )}
    </div>
  )
}
