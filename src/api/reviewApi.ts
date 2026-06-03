/**
 * reviewApi.ts — Reseñas post-compra (solo pedidos DELIVERED).
 *
 * Backend:
 *   GET  /api/buyer/orders/{orderId}/reviews
 *   POST /api/buyer/orders/{orderId}/reviews/product
 *   POST /api/buyer/orders/{orderId}/reviews/store
 */
import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import { uploadReviewImages } from '../lib/imageUpload';
import {
  mockFetchOrderReviewStatus,
  mockSubmitProductReview,
  mockSubmitStoreReview,
} from './mock/reviewMock';

export interface ReviewSummary {
  rating: number;
  comment: string | null;
  createdAt: string;
  /** Solo en reseñas de producto. Las reseñas de tienda no llevan imágenes. */
  imageUrls?: string[];
}

export interface ProductReviewTarget {
  productId: string;
  productName: string;
  variationLabel: string | null;
  thumbnailUrl: string | null;
  storeId: string;
  storeName: string;
  reviewed: boolean;
  review: ReviewSummary | null;
}

export interface StoreReviewTarget {
  storeId: string;
  storeName: string;
  reviewed: boolean;
  review: ReviewSummary | null;
}

export interface OrderReviewStatus {
  orderId: string;
  canReview: boolean;
  products: ProductReviewTarget[];
  stores: StoreReviewTarget[];
}

export interface SubmitProductReviewRequest {
  productId: string;
  rating: number;
  comment?: string;
  /** URIs locales — se suben antes de enviar la reseña y se convierten en URLs públicas. */
  imageUris?: string[];
}

export interface SubmitStoreReviewRequest {
  storeId: string;
  rating: number;
  comment?: string;
}

export async function fetchOrderReviewStatus(orderId: string): Promise<OrderReviewStatus> {
  if (USE_MOCKS) {
    return mockFetchOrderReviewStatus(orderId);
  }
  return apiClient.get<OrderReviewStatus>(`/api/buyer/orders/${orderId}/reviews`);
}

export async function submitProductReview(
  orderId: string,
  payload: SubmitProductReviewRequest,
): Promise<ReviewSummary> {
  validateRating(payload.rating);

  // Subir imágenes antes de persistir la reseña
  const imageUrls = payload.imageUris?.length
    ? await uploadReviewImages(payload.imageUris)
    : [];

  const body = {
    productId: payload.productId,
    rating: payload.rating,
    comment: payload.comment,
    imageUrls,
  };

  if (USE_MOCKS) {
    return mockSubmitProductReview(orderId, { ...payload, imageUris: undefined }, imageUrls);
  }
  return apiClient.post<ReviewSummary>(`/api/buyer/orders/${orderId}/reviews/product`, body);
}

export async function submitStoreReview(
  orderId: string,
  payload: SubmitStoreReviewRequest,
): Promise<ReviewSummary> {
  validateRating(payload.rating);
  if (USE_MOCKS) {
    return mockSubmitStoreReview(orderId, payload);
  }
  return apiClient.post<ReviewSummary>(`/api/buyer/orders/${orderId}/reviews/store`, payload);
}

function validateRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Elegí una calificación de 1 a 5 estrellas.');
  }
}

export function hasPendingReviews(status: OrderReviewStatus): boolean {
  if (!status.canReview) return false;
  return (
    status.products.some((p) => !p.reviewed) || status.stores.some((s) => !s.reviewed)
  );
}

export function countPendingReviews(status: OrderReviewStatus): number {
  if (!status.canReview) return 0;
  return (
    status.products.filter((p) => !p.reviewed).length +
    status.stores.filter((s) => !s.reviewed).length
  );
}
