import { apiClient, normalizePage } from './client';
import { mockFetchCatalogProducts, mockFetchCategories } from './mock/catalogMock';
import { USE_MOCKS } from '../config/env';

import type { Page } from './types';

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  storeName: string;
  storeId: string;
  ratingAvg: number | null;
  ratingCount: number;
  /** Distancia en km cuando el backend filtra por ubicación (PostGIS). */
  distanceKm?: number | null;
}

export interface CatalogQuery {
  page?: number;
  size?: number;
  categoryId?: string;
  storeId?: string;
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  sizeFilter?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  /** Filtra productos cuya tienda está abierta (StoreSchedule, America/Argentina/Buenos_Aires). */
  openNow?: boolean;
}

const CATEGORIES_PATH = '/api/buyer/catalog/categories';
const PRODUCTS_PATH = '/api/buyer/catalog/products';

export async function fetchCategories(): Promise<CatalogCategory[]> {
  if (USE_MOCKS) return mockFetchCategories();
  const raw = await apiClient.get<unknown>(CATEGORIES_PATH, { skipAuth: true });
  if (!Array.isArray(raw)) return [];
  return raw as CatalogCategory[];
}

export async function fetchCatalogProducts(
  params: CatalogQuery,
): Promise<Page<CatalogProduct>> {
  if (USE_MOCKS) {
    return mockFetchCatalogProducts(params);
  }
  const sp = new URLSearchParams();
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.size ?? 10));
  if (params.categoryId) sp.set('categoryId', params.categoryId);
  if (params.storeId) sp.set('storeId', params.storeId);
  if (params.name) sp.set('name', params.name);
  if (params.minPrice != null) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));
  if (params.sizeFilter) sp.set('size', params.sizeFilter);
  if (params.latitude != null) sp.set('latitude', String(params.latitude));
  if (params.longitude != null) sp.set('longitude', String(params.longitude));
  if (params.radiusKm != null) sp.set('radiusKm', String(params.radiusKm));
  if (params.openNow) sp.set('openNow', 'true');

  const raw = await apiClient.get<unknown>(`${PRODUCTS_PATH}?${sp.toString()}`, {
    skipAuth: true,
  });
  return normalizePage<CatalogProduct>(raw);
}
