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

export const CLOTHING_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const FOOTWEAR_SIZE_OPTIONS = [
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
] as const;

export const SIZE_OPTIONS = CLOTHING_SIZE_OPTIONS;

export function isFootwearCategoryName(name?: string | null): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes('zapato') ||
    lower.includes('calzado') ||
    lower.includes('zapatilla') ||
    lower.includes('bota') ||
    lower.includes('sandalia') ||
    lower.includes('ojota') ||
    lower.includes('shoe') ||
    lower.includes('sneaker') ||
    lower.includes('footwear')
  );
}

export function getAvailableSizes(categoryName?: string | null): readonly string[] {
  return isFootwearCategoryName(categoryName) ? FOOTWEAR_SIZE_OPTIONS : CLOTHING_SIZE_OPTIONS;
}

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
