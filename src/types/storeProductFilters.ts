/** Filtros de productos dentro del perfil de una tienda. */
export interface StoreProductFilterState {
  categoryId: string | null;
  minPrice: string;
  maxPrice: string;
  sizeFilter: string | null;
}

export const DEFAULT_STORE_PRODUCT_FILTERS: StoreProductFilterState = {
  categoryId: null,
  minPrice: '',
  maxPrice: '',
  sizeFilter: null,
};

export function countActiveStoreProductFilters(filters: StoreProductFilterState): number {
  let count = 0;
  if (filters.categoryId) count += 1;
  if (filters.minPrice.trim()) count += 1;
  if (filters.maxPrice.trim()) count += 1;
  if (filters.sizeFilter) count += 1;
  return count;
}
