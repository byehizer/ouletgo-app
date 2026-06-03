import { USE_MOCKS } from '../config/env';

import { apiClient } from './client';
import { mockFetchProductDetail } from './mock/productMock';

export interface ProductVariation {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
  isVisible: boolean;
  /** Imágenes opcionales que el comprador adjuntó al reseñar el producto. */
  imageUrls: string[];
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  thumbnailUrl: string | null;
  price: number;
  storeId: string;
  storeName: string;
  ratingAvg: number | null;
  ratingCount: number;
  variations: ProductVariation[];
  reviews: ProductReview[];
}

const PRODUCT_PATH = '/api/buyer/products';

export async function fetchProductDetail(productId: string): Promise<ProductDetail> {
  if (USE_MOCKS) {
    return mockFetchProductDetail(productId);
  }

  const raw = await apiClient.get<unknown>(`${PRODUCT_PATH}/${productId}`, { skipAuth: true });
  return parseProductDetail(raw);
}

function parseVariation(raw: unknown): ProductVariation | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o['id'];
  const size = o['size'];
  const stock = o['stock'];
  const price = o['price'];
  if (typeof id !== 'string' || typeof size !== 'string') return null;
  return {
    id,
    size,
    color: typeof o['color'] === 'string' ? o['color'] : null,
    stock: typeof stock === 'number' ? stock : 0,
    price: typeof price === 'number' ? price : 0,
  };
}

function parseReview(raw: unknown): ProductReview | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o['id'];
  const rating = o['rating'];
  const authorName = o['authorName'] ?? o['author_name'];
  const createdAt = o['createdAt'] ?? o['created_at'];
  const isVisible = o['isVisible'] ?? o['is_visible'];

  if (typeof id !== 'string' || typeof rating !== 'number') return null;

  const rawUrls = o['imageUrls'] ?? o['image_urls'];
  const imageUrls = Array.isArray(rawUrls)
    ? (rawUrls as unknown[]).filter((u): u is string => typeof u === 'string')
    : [];

  return {
    id,
    rating,
    comment: typeof o['comment'] === 'string' ? o['comment'] : null,
    authorName: typeof authorName === 'string' ? authorName : 'Comprador',
    createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    isVisible: typeof isVisible === 'boolean' ? isVisible : true,
    imageUrls,
  };
}

function parseProductDetail(raw: unknown): ProductDetail {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Producto no encontrado.');
  }

  const o = raw as Record<string, unknown>;
  const id = o['id'];
  const name = o['name'];

  if (typeof id !== 'string' || typeof name !== 'string') {
    throw new Error('Producto no encontrado.');
  }

  const rawVariations = Array.isArray(o['variations']) ? o['variations'] : [];
  const variations = rawVariations
    .map(parseVariation)
    .filter((v): v is ProductVariation => v !== null);

  const rawReviews = Array.isArray(o['reviews']) ? o['reviews'] : [];
  const reviews = rawReviews
    .map(parseReview)
    .filter((r): r is ProductReview => r !== null);

  const imageUrls = Array.isArray(o['imageUrls'])
    ? (o['imageUrls'] as unknown[]).filter((u): u is string => typeof u === 'string')
    : Array.isArray(o['image_urls'])
      ? (o['image_urls'] as unknown[]).filter((u): u is string => typeof u === 'string')
      : [];

  const thumbnailUrl = o['thumbnailUrl'] ?? o['thumbnail_url'];

  return {
    id,
    name,
    description: typeof o['description'] === 'string' ? o['description'] : '',
    imageUrls,
    thumbnailUrl: typeof thumbnailUrl === 'string' ? thumbnailUrl : null,
    price: typeof o['price'] === 'number' ? o['price'] : 0,
    storeId: typeof o['storeId'] === 'string' ? o['storeId'] : '',
    storeName: typeof o['storeName'] === 'string' ? o['storeName'] : '',
    ratingAvg: typeof o['ratingAvg'] === 'number' ? o['ratingAvg'] : null,
    ratingCount: typeof o['ratingCount'] === 'number' ? o['ratingCount'] : 0,
    variations,
    reviews,
  };
}

export function getVisibleReviews(reviews: ProductReview[]): ProductReview[] {
  return reviews.filter((r) => r.isVisible);
}
