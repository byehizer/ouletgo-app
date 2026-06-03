/**
 * orderApi.ts — Historial y detalle de pedidos del comprador.
 *
 * Backend:
 *   GET /api/buyer/orders?page=&size=
 *   GET /api/buyer/orders/{orderId}
 */
import { apiClient, normalizePage } from './client';
import { USE_MOCKS } from '../config/env';
import { mockFetchOrderById, mockFetchOrders } from './mock/orderMock';

import type { Page } from './types';
import type { OrderStatus, ShippingCarrier, ShippingMethod } from './types';

// ---------------------------------------------------------------------------
// OrderStore (slice) — estado del vendedor
// ---------------------------------------------------------------------------

export type OrderStoreStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED_BY_OUTLETGO'
  | 'CANCELED'
  | 'STOCK_ISSUE';

export const ORDER_STORE_STATUS_LABELS: Record<OrderStoreStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pago confirmado',
  PREPARING: 'Preparando',
  READY_FOR_PICKUP: 'Listo para que OutletGo retire',
  COLLECTED_BY_OUTLETGO: 'Retirado por OutletGo',
  CANCELED: 'Cancelado',
  STOCK_ISSUE: 'Sin stock',
};

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface OrderListItem {
  id: string;
  createdAt: string;
  status: OrderStatus;
  storeCount: number;
  itemCount: number;
  totalPrice: number;
  shippingMethod: ShippingMethod;
}

export interface OrderSliceItem {
  productId: string;
  productName: string;
  variationLabel: string | null;
  quantity: number;
  unitPrice: number;
  thumbnailUrl: string | null;
}

export interface OrderStoreSlice {
  storeId: string;
  storeName: string;
  status: OrderStoreStatus;
  items: OrderSliceItem[];
  /** Monto reembolsado parcialmente si hubo STOCK_ISSUE. */
  refundAmount: number | null;
}

export interface OrderPickupPoint {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  businessHours: string;
}

export interface OrderDetail {
  id: string;
  createdAt: string;
  status: OrderStatus;
  shippingMethod: ShippingMethod;
  carrier: ShippingCarrier | null;
  trackingNumber: string | null;
  productSubtotal: number;
  shippingCost: number;
  serviceFee: number;
  totalPrice: number;
  deliveryAddress: string | null;
  pickupPoint: OrderPickupPoint | null;
  stores: OrderStoreSlice[];
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function fetchOrders(page = 0, size = 10): Promise<Page<OrderListItem>> {
  if (USE_MOCKS) return mockFetchOrders(page, size);

  try {
    const raw = await apiClient.get<unknown>(
      `/api/buyer/orders?page=${page}&size=${size}`,
    );
    return normalizePage<OrderListItem>(raw);
  } catch {
    if (__DEV__) return mockFetchOrders(page, size);
    throw new Error('No se pudieron cargar los pedidos.');
  }
}

export async function fetchOrderById(orderId: string): Promise<OrderDetail> {
  if (USE_MOCKS) {
    const order = await mockFetchOrderById(orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    return order;
  }

  try {
    return await apiClient.get<OrderDetail>(`/api/buyer/orders/${orderId}`);
  } catch {
    if (__DEV__) {
      const order = await mockFetchOrderById(orderId);
      if (order) return order;
    }
    throw new Error('No se pudo cargar el pedido.');
  }
}
