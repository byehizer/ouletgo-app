/** Estado de filtros avanzados del catálogo (Paso 6). */
export interface CatalogFilterState {
  categoryId: string | null;
  minPrice: string;
  maxPrice: string;
  sizeFilter: string | null;
  nearMe: boolean;
  radiusKm: number;
  /** Solo productos de tiendas abiertas en este momento (StoreSchedule). */
  openNow: boolean;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  categoryId: null,
  minPrice: '',
  maxPrice: '',
  sizeFilter: null,
  nearMe: false,
  radiusKm: 10,
  openNow: false,
};

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const RADIUS_OPTIONS = [5, 10, 25] as const;

export function countActiveFilters(filters: CatalogFilterState): number {
  let count = 0;
  if (filters.minPrice.trim()) count += 1;
  if (filters.maxPrice.trim()) count += 1;
  if (filters.sizeFilter) count += 1;
  if (filters.nearMe) count += 1;
  if (filters.openNow) count += 1;
  return count;
}

export function parsePriceInput(value: string): number | undefined {
  const trimmed = value.trim().replace(/\./g, '').replace(',', '.');
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}
