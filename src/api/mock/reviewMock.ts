import { mockFetchOrderById } from './orderMock';

import type { OrderDetail } from '../orderApi';
import type {
  OrderReviewStatus,
  ProductReviewTarget,
  ReviewSummary,
  StoreReviewTarget,
  SubmitProductReviewRequest,
  SubmitStoreReviewRequest,
} from '../reviewApi';

const productReviews = new Map<string, ReviewSummary>();
const storeReviews = new Map<string, ReviewSummary>();

function productKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}

function storeKey(orderId: string, storeId: string): string {
  return `${orderId}:${storeId}`;
}

function delay(ms = 180): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildStatusFromOrder(orderId: string, order: OrderDetail | null): OrderReviewStatus {
  if (!order) {
    return {
      orderId,
      canReview: false,
      products: [],
      stores: [],
    };
  }

  const canReview = order.status === 'DELIVERED';

  const products: ProductReviewTarget[] = [];
  const seenProducts = new Set<string>();

  for (const slice of order.stores) {
    if (slice.status === 'STOCK_ISSUE') continue;
    for (const item of slice.items) {
      if (seenProducts.has(item.productId)) continue;
      seenProducts.add(item.productId);
      const key = productKey(orderId, item.productId);
      const review = productReviews.get(key) ?? null;
      products.push({
        productId: item.productId,
        productName: item.productName,
        variationLabel: item.variationLabel,
        thumbnailUrl: item.thumbnailUrl,
        storeId: slice.storeId,
        storeName: slice.storeName,
        reviewed: review !== null,
        review,
      });
    }
  }

  const stores: StoreReviewTarget[] = order.stores
    .filter((s) => s.status !== 'STOCK_ISSUE')
    .map((slice) => {
      const key = storeKey(orderId, slice.storeId);
      const review = storeReviews.get(key) ?? null;
      return {
        storeId: slice.storeId,
        storeName: slice.storeName,
        reviewed: review !== null,
        review,
      };
    });

  return { orderId, canReview, products, stores };
}

export async function mockFetchOrderReviewStatus(orderId: string): Promise<OrderReviewStatus> {
  await delay();
  const order = await mockFetchOrderById(orderId);
  return buildStatusFromOrder(orderId, order);
}

export async function mockSubmitProductReview(
  orderId: string,
  payload: SubmitProductReviewRequest,
  imageUrls: string[] = [],
): Promise<ReviewSummary> {
  await delay(300);
  const order = await mockFetchOrderById(orderId);
  const status = buildStatusFromOrder(orderId, order);
  if (!status.canReview) {
    throw new Error('Solo podés reseñar pedidos entregados.');
  }
  const target = status.products.find((p) => p.productId === payload.productId);
  if (!target) {
    throw new Error('Producto no encontrado en este pedido.');
  }
  if (target.reviewed) {
    throw new Error('Ya dejaste una reseña para este producto.');
  }

  const review: ReviewSummary = {
    rating: payload.rating,
    comment: payload.comment?.trim() || null,
    createdAt: new Date().toISOString(),
    imageUrls,
  };
  productReviews.set(productKey(orderId, payload.productId), review);
  return review;
}

export async function mockSubmitStoreReview(
  orderId: string,
  payload: SubmitStoreReviewRequest,
): Promise<ReviewSummary> {
  await delay(300);
  const order = await mockFetchOrderById(orderId);
  const status = buildStatusFromOrder(orderId, order);
  if (!status.canReview) {
    throw new Error('Solo podés reseñar pedidos entregados.');
  }
  const target = status.stores.find((s) => s.storeId === payload.storeId);
  if (!target) {
    throw new Error('Tienda no encontrada en este pedido.');
  }
  if (target.reviewed) {
    throw new Error('Ya dejaste una reseña para esta tienda.');
  }

  const review: ReviewSummary = {
    rating: payload.rating,
    comment: payload.comment?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  storeReviews.set(storeKey(orderId, payload.storeId), review);
  return review;
}
