import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import {
  mockAddFavoriteProduct,
  mockAddFavoriteStore,
  mockFetchFavoriteProducts,
  mockFetchFavoriteStores,
  mockIsProductFavorite,
  mockIsStoreFavorite,
  mockRemoveFavoriteProduct,
  mockRemoveFavoriteStore,
} from './mock/favoritesMock';

export interface FavoriteProduct {
  productId: string;
  productName: string;
  thumbnailUrl: string | null;
  price: number;
  storeId: string;
  storeName: string;
  addedAt: string;
}

export interface FavoriteStore {
  storeId: string;
  storeName: string;
  address: string;
  ratingAvg: number | null;
  ratingCount: number;
  addedAt: string;
}

/** Metadatos al agregar un producto a favoritos (para persistir en backend/mock). */
export interface FavoriteProductMeta {
  productName: string;
  thumbnailUrl: string | null;
  price: number;
  storeId: string;
  storeName: string;
}

export interface FavoriteStoreMeta {
  storeName: string;
  address: string;
  ratingAvg: number | null;
  ratingCount: number;
}

function parseFavoriteProduct(raw: unknown): FavoriteProduct | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const productId = o['productId'] ?? o['product_id'];
  const productName = o['productName'] ?? o['product_name'];
  const price = o['price'];
  const storeId = o['storeId'] ?? o['store_id'];
  const storeName = o['storeName'] ?? o['store_name'];
  const addedAt = o['addedAt'] ?? o['added_at'];
  if (typeof productId !== 'string' || typeof productName !== 'string') return null;
  return {
    productId,
    productName,
    thumbnailUrl: typeof o['thumbnailUrl'] === 'string' ? o['thumbnailUrl'] : typeof o['thumbnail_url'] === 'string' ? o['thumbnail_url'] : null,
    price: typeof price === 'number' ? price : 0,
    storeId: typeof storeId === 'string' ? storeId : '',
    storeName: typeof storeName === 'string' ? storeName : '',
    addedAt: typeof addedAt === 'string' ? addedAt : new Date().toISOString(),
  };
}

function parseFavoriteStore(raw: unknown): FavoriteStore | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const storeId = o['storeId'] ?? o['store_id'];
  const storeName = o['storeName'] ?? o['store_name'];
  const address = o['address'];
  const addedAt = o['addedAt'] ?? o['added_at'];
  if (typeof storeId !== 'string' || typeof storeName !== 'string') return null;
  return {
    storeId,
    storeName,
    address: typeof address === 'string' ? address : '',
    ratingAvg: typeof o['ratingAvg'] === 'number' ? o['ratingAvg'] : typeof o['rating_avg'] === 'number' ? o['rating_avg'] : null,
    ratingCount: typeof o['ratingCount'] === 'number' ? o['ratingCount'] : typeof o['rating_count'] === 'number' ? o['rating_count'] : 0,
    addedAt: typeof addedAt === 'string' ? addedAt : new Date().toISOString(),
  };
}

export async function fetchFavoriteProducts(): Promise<FavoriteProduct[]> {
  if (USE_MOCKS) {
    return mockFetchFavoriteProducts();
  }
  const raw = await apiClient.get<unknown>('/api/buyer/me/favorites/products');
  if (!Array.isArray(raw)) return [];
  return raw.map(parseFavoriteProduct).filter((f): f is FavoriteProduct => f !== null);
}

export async function fetchFavoriteStores(): Promise<FavoriteStore[]> {
  if (USE_MOCKS) {
    return mockFetchFavoriteStores();
  }
  const raw = await apiClient.get<unknown>('/api/buyer/me/favorites/stores');
  if (!Array.isArray(raw)) return [];
  return raw.map(parseFavoriteStore).filter((f): f is FavoriteStore => f !== null);
}

export async function isProductFavorite(productId: string): Promise<boolean> {
  if (USE_MOCKS) {
    return mockIsProductFavorite(productId);
  }
  const raw = await apiClient.get<{ favorite: boolean }>(
    `/api/buyer/me/favorites/products/${productId}/status`,
  );
  return Boolean(raw.favorite);
}

export async function isStoreFavorite(storeId: string): Promise<boolean> {
  if (USE_MOCKS) {
    return mockIsStoreFavorite(storeId);
  }
  const raw = await apiClient.get<{ favorite: boolean }>(
    `/api/buyer/me/favorites/stores/${storeId}/status`,
  );
  return Boolean(raw.favorite);
}

export async function addFavoriteProduct(
  productId: string,
  meta: FavoriteProductMeta,
): Promise<void> {
  if (USE_MOCKS) {
    return mockAddFavoriteProduct(productId, meta);
  }
  await apiClient.post<void>(`/api/buyer/me/favorites/products/${productId}`, meta);
}

export async function removeFavoriteProduct(productId: string): Promise<void> {
  if (USE_MOCKS) {
    return mockRemoveFavoriteProduct(productId);
  }
  await apiClient.delete<void>(`/api/buyer/me/favorites/products/${productId}`);
}

export async function addFavoriteStore(storeId: string, meta: FavoriteStoreMeta): Promise<void> {
  if (USE_MOCKS) {
    return mockAddFavoriteStore(storeId, meta);
  }
  await apiClient.post<void>(`/api/buyer/me/favorites/stores/${storeId}`, meta);
}

export async function removeFavoriteStore(storeId: string): Promise<void> {
  if (USE_MOCKS) {
    return mockRemoveFavoriteStore(storeId);
  }
  await apiClient.delete<void>(`/api/buyer/me/favorites/stores/${storeId}`);
}
