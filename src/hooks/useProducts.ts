import { useState, useEffect, useCallback } from 'react';
import { supabase, RESTAURANT_ID } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type Product = Tables<'products'>;
export type Category = Tables<'categories'>;
export type Recipe = Tables<'recipes'>;

export type ProductWithCategory = Product & {
  categories: Pick<Category, 'nombre'> | null;
};

export function useProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [prodResult, catResult] = await Promise.all([
      supabase
        .from('products')
        .select('*, categories(nombre)')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('nombre', { ascending: true }),
      supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('nombre', { ascending: true }),
    ]);

    if (prodResult.error) setError(prodResult.error.message);
    else setProducts((prodResult.data ?? []) as unknown as ProductWithCategory[]);

    if (catResult.error) setError(catResult.error.message);
    else setCategories(catResult.data ?? []);

    const productIds = (prodResult.data ?? []).map(p => p.id);
    if (productIds.length > 0) {
      const { data: recipeData, error: recipeErr } = await supabase
        .from('recipes')
        .select('*')
        .in('product_id', productIds);
      if (!recipeErr) setRecipes(recipeData ?? []);
    } else {
      setRecipes([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createProduct = useCallback(async (
    data: Omit<TablesInsert<'products'>, 'restaurant_id'>,
    opts?: { skipRefresh?: boolean }
  ) => {
    const { data: created, error: err } = await supabase
      .from('products')
      .insert({ ...data, restaurant_id: RESTAURANT_ID })
      .select('id')
      .single()
    if (err) throw err
    if (!opts?.skipRefresh) await fetchAll()
    return created.id
  }, [fetchAll])

  const updateProduct = useCallback(async (
    id: string,
    updates: TablesUpdate<'products'>,
    opts?: { skipRefresh?: boolean }
  ) => {
    const { error: err } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
    if (!opts?.skipRefresh) await fetchAll();
  }, [fetchAll]);

  const deleteProduct = useCallback(async (id: string) => {
    // Delete associated recipes first
    const { error: recipeErr } = await supabase
      .from('recipes')
      .delete()
      .eq('product_id', id);
    if (recipeErr) throw recipeErr;

    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const createCategory = useCallback(async (nombre: string) => {
    const { error: err } = await supabase
      .from('categories')
      .insert({ nombre, restaurant_id: RESTAURANT_ID });
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const updateCategory = useCallback(async (id: string, updates: { nombre?: string; estado?: boolean }) => {
    const { error: err } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string) => {
    const activeProducts = products.filter(p => p.category_id === id && p.activo);
    if (activeProducts.length > 0) {
      throw new Error(`No se puede eliminar: ${activeProducts.length} producto(s) activo(s) usan esta categoría`);
    }
    const { error: err } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll, products]);

  const uploadProductImage = useCallback(async (
    productId: string,
    file: File,
    opts?: { skipRefresh?: boolean }
  ): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${RESTAURANT_ID}/${productId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    await updateProduct(productId, { imagen_url: publicUrl }, opts);
    return publicUrl;
  }, [updateProduct]);

  // Recetas
  const getRecipes = useCallback(async (productId: string): Promise<Recipe[]> => {
    const { data, error: err } = await supabase
      .from('recipes')
      .select('*')
      .eq('product_id', productId);
    if (err) throw err;
    return data ?? [];
  }, []);

  const saveRecipes = useCallback(async (productId: string, recipeItems: Array<{ inventory_item_id: string; cantidad_consumida: number }>) => {
    // Eliminar recetas existentes y reinsertar
    await supabase.from('recipes').delete().eq('product_id', productId);
    if (recipeItems.length > 0) {
      const { error: err } = await supabase
        .from('recipes')
        .insert(recipeItems.map(r => ({ product_id: productId, ...r })));
      if (err) throw err;
    }
    await fetchAll();
  }, [fetchAll]);

  const getRecipesForProduct = useCallback(
    (productId: string) => recipes.filter(r => r.product_id === productId),
    [recipes]
  );

  return {
    products, categories, recipes, loading, error, refetch: fetchAll,
    createProduct, updateProduct, deleteProduct,
    createCategory, updateCategory, deleteCategory,
    uploadProductImage, getRecipes, saveRecipes, getRecipesForProduct,
  };
}
