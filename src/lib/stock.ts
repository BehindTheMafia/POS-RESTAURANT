import type { Tables } from './database.types'

export type StockMode = 'unlimited' | 'direct' | 'recipe'

type ProductLike = Pick<Tables<'products'>, 'id' | 'stock'>
type RecipeLike = Pick<Tables<'recipes'>, 'product_id' | 'inventory_item_id' | 'cantidad_consumida'>
type InventoryLike = Pick<Tables<'inventory_items'>, 'id' | 'nombre' | 'stock_actual'>

export const getRecipesForProduct = <T extends RecipeLike>(recipes: T[], productId: string): T[] =>
  recipes.filter(r => r.product_id === productId)

/**
 * Infiere el modo de stock de un producto a partir de sus datos.
 * - Tiene receta (1+ ingredientes) -> 'recipe'
 * - stock numérico, sin receta        -> 'direct'
 * - sin stock ni receta               -> 'unlimited'
 */
export const inferStockMode = (
  product: ProductLike,
  recipesForProduct: RecipeLike[]
): StockMode => {
  if (recipesForProduct.length > 0) return 'recipe'
  if (product.stock !== null && product.stock !== undefined) return 'direct'
  return 'unlimited'
}

/**
 * Calcula el stock disponible de un producto.
 * Si tiene receta, manda el inventario (ignora product.stock).
 * Devuelve Infinity cuando no hay límite.
 */
export const calcProductStock = (
  product: ProductLike,
  recipes: RecipeLike[],
  inventoryItems: InventoryLike[]
): number => {
  const productRecipes = getRecipesForProduct(recipes, product.id)

  if (productRecipes.length > 0) {
    let recipeLimit = Infinity
    for (const recipeItem of productRecipes) {
      if (recipeItem.cantidad_consumida <= 0) continue
      const ingredient = inventoryItems.find(ii => ii.id === recipeItem.inventory_item_id)
      const possibleQty = ingredient
        ? Math.floor(ingredient.stock_actual / recipeItem.cantidad_consumida)
        : 0
      if (possibleQty < recipeLimit) recipeLimit = possibleQty
    }
    return recipeLimit
  }

  return product.stock !== null && product.stock !== undefined ? product.stock : Infinity
}

export const formatStockLabel = (stock: number, mode: StockMode): string => {
  if (mode === 'unlimited') return 'Sin límite'
  if (mode === 'recipe') return stock === Infinity ? 'Inventario: ∞' : `Inventario: ${stock}`
  return stock === Infinity ? 'Sin límite' : `Stock: ${stock}`
}

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

/**
 * Ordena los ingredientes activos por similitud de nombre con el producto,
 * para sugerir primero la materia prima relacionada (ej. "Chunks 10" -> "Bolsa Chunks 10").
 */
export const suggestIngredients = <T extends InventoryLike & { activo?: boolean }>(
  productName: string,
  inventoryItems: T[]
): T[] => {
  const productTokens = normalize(productName).split(/\s+/).filter(Boolean)

  const score = (itemName: string): number => {
    const name = normalize(itemName)
    return productTokens.reduce((acc, token) => {
      if (!token) return acc
      if (name.includes(token)) return acc + (token.length > 2 ? 2 : 1)
      return acc
    }, 0)
  }

  return [...inventoryItems]
    .filter(i => i.activo !== false)
    .sort((a, b) => {
      const diff = score(b.nombre) - score(a.nombre)
      if (diff !== 0) return diff
      return a.nombre.localeCompare(b.nombre)
    })
}
