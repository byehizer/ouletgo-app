import { apiClient, normalizePage } from './client';
import { mockFetchStoreProfile, mockFetchStoreProducts, mockFetchNearbyStores, mockSearchStoresByName } from './mock/storeMock';
import { USE_MOCKS } from '../config/env';
import type { Coordinates } from '../lib/location';

import type { CatalogProduct } from './catalogApi';
import type { ProductReview } from './productApi';
import type { Page, ShippingCapability } from './types';

export interface StoreSchedule {
  /** Java DayOfWeek: 1 = Lunes … 7 = Domingo */
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface StoreProfile {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  ratingAvg: number | null;
  ratingCount: number;
  instagramUrl: string | null;
  whatsapp: string | null;
  schedule: StoreSchedule[];
  /** Calculado en backend (`isStoreOpenNow`) o derivado del schedule en cliente. */
  isOpenNow?: boolean;
  reviews: ProductReview[];
  distanceKm?: number | null;
  /**
   * Opción C — capacidad de envío de la tienda.
   * Backend: columna `shipping_capability` en tabla `stores`.
   * Default: 'SOLO_RETIRO' para tiendas existentes (migración backward-compatible).
   */
  shippingCapability: ShippingCapability;
  /**
   * Costo base de envío en ARS cuando shippingCapability incluye ENVIO_CORREO.
   * null si la tienda no ofrece envío.
   * El backend puede calcular un costo dinámico según peso/distancia en el endpoint de cotización.
   */
  shippingCostBase: number | null;
}

export interface StoreProductsQuery {
  page?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
  name?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sizeFilter?: string;
}

/** Resumen de tienda para mapa y listado cercano. */
export interface NearbyStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  ratingAvg: number | null;
  ratingCount: number;
  distanceKm: number;
  isOpenNow?: boolean;
  /** Indica si la tienda ofrece envío a domicilio, retiro o ambos. */
  shippingCapability?: ShippingCapability;
}

export interface NearbyStoresQuery {
  latitude: number;
  longitude: number;
  /** Omitir o `null` = todas las tiendas (sin límite de radio). */
  radiusKm?: number | null;
  openNow?: boolean;
}

export interface StoreSearchQuery {
  name: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

const STORE_PATH = '/api/buyer/stores';

export async function fetchStoreProfile(
  storeId: string,
  coords?: Coordinates | null,
): Promise<StoreProfile> {
  if (USE_MOCKS) {
    return mockFetchStoreProfile(storeId, coords);
  }

  const sp = new URLSearchParams();
  if (coords?.latitude != null) sp.set('latitude', String(coords.latitude));
  if (coords?.longitude != null) sp.set('longitude', String(coords.longitude));
  const qs = sp.toString();
  const url = qs ? `${STORE_PATH}/${storeId}?${qs}` : `${STORE_PATH}/${storeId}`;

  return apiClient.get<StoreProfile>(url, { skipAuth: true });
}

export async function fetchStoreProducts(
  storeId: string,
  params: StoreProductsQuery = {},
): Promise<Page<CatalogProduct>> {
  if (USE_MOCKS) {
    return mockFetchStoreProducts(storeId, params);
  }

  const sp = new URLSearchParams();
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.size ?? 10));
  if (params.latitude != null) sp.set('latitude', String(params.latitude));
  if (params.longitude != null) sp.set('longitude', String(params.longitude));
  if (params.name) sp.set('name', params.name);
  if (params.categoryId) sp.set('categoryId', params.categoryId);
  if (params.minPrice != null) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));
  if (params.sizeFilter) sp.set('sizeFilter', params.sizeFilter);

  const raw = await apiClient.get<unknown>(
    `${STORE_PATH}/${storeId}/products?${sp.toString()}`,
    { skipAuth: true },
  );
  return normalizePage<CatalogProduct>(raw);
}

export async function fetchNearbyStores(query: NearbyStoresQuery): Promise<NearbyStore[]> {
  if (USE_MOCKS) {
    return mockFetchNearbyStores(query);
  }

  const sp = new URLSearchParams();
  sp.set('latitude', String(query.latitude));
  sp.set('longitude', String(query.longitude));
  if (query.radiusKm != null) sp.set('radiusKm', String(query.radiusKm));
  if (query.openNow) sp.set('openNow', 'true');

  const raw = await apiClient.get<unknown>(`${STORE_PATH}/nearby?${sp.toString()}`, {
    skipAuth: true,
  });
  return Array.isArray(raw) ? (raw as NearbyStore[]) : [];
}

export async function searchStoresByName(query: StoreSearchQuery): Promise<NearbyStore[]> {
  if (USE_MOCKS) {
    return mockSearchStoresByName(query);
  }

  const sp = new URLSearchParams();
  sp.set('name', query.name.trim());
  if (query.latitude != null) sp.set('latitude', String(query.latitude));
  if (query.longitude != null) sp.set('longitude', String(query.longitude));
  if (query.limit != null) sp.set('limit', String(query.limit));

  const raw = await apiClient.get<unknown>(`${STORE_PATH}/search?${sp.toString()}`, {
    skipAuth: true,
  });
  return Array.isArray(raw) ? (raw as NearbyStore[]) : [];
}
