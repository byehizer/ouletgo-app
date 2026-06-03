import type { OrderDetail, OrderListItem } from '../orderApi';
import type { Page } from '../types';

const MOCK_ORDERS: OrderDetail[] = [
  {
    id: 'ORD-MOCK-1001',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'IN_TRANSIT',
    shippingMethod: 'ENVIO_CORREO',
    carrier: 'ANDREANI',
    trackingNumber: 'AND-MOCK-1001',
    productSubtotal: 28500,
    shippingCost: 3900,
    serviceFee: 1425,
    totalPrice: 33825,
    deliveryAddress: 'Av. Corrientes 1234, CABA',
    pickupPoint: null,
    stores: [
      {
        storeId: 'store-1',
        storeName: 'Outlet Textil Avellaneda',
        status: 'COLLECTED_BY_OUTLETGO',
        refundAmount: null,
        items: [
          {
            productId: 'p1',
            productName: 'Remera básica algodón',
            variationLabel: 'M · Negro',
            quantity: 2,
            unitPrice: 4500,
            thumbnailUrl: null,
          },
        ],
      },
      {
        storeId: 'store-2',
        storeName: 'Moda Sur',
        status: 'COLLECTED_BY_OUTLETGO',
        refundAmount: null,
        items: [
          {
            productId: 'p2',
            productName: 'Jean mom fit',
            variationLabel: '38 · Azul',
            quantity: 1,
            unitPrice: 19500,
            thumbnailUrl: null,
          },
        ],
      },
    ],
  },
  {
    id: 'ORD-MOCK-1002',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'READY_FOR_PICKUP',
    shippingMethod: 'RETIRO_EN_PUNTO',
    carrier: null,
    trackingNumber: null,
    productSubtotal: 12800,
    shippingCost: 0,
    serviceFee: 640,
    totalPrice: 13440,
    deliveryAddress: null,
    pickupPoint: {
      id: 'punto-1',
      name: 'OutletGo Palermo',
      address: 'Thames 1540',
      neighborhood: 'Palermo',
      businessHours: 'Lun–Sáb 10–20 h',
    },
    stores: [
      {
        storeId: 'store-3',
        storeName: 'Bazar del Polo',
        status: 'COLLECTED_BY_OUTLETGO',
        refundAmount: null,
        items: [
          {
            productId: 'p3',
            productName: 'Buzo canguro',
            variationLabel: 'L · Gris',
            quantity: 1,
            unitPrice: 12800,
            thumbnailUrl: null,
          },
        ],
      },
    ],
  },
  {
    id: 'ORD-MOCK-1003',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    status: 'DELIVERED',
    shippingMethod: 'ENVIO_CORREO',
    carrier: 'CORREO_ARGENTINO',
    trackingNumber: 'CA-MOCK-8842',
    productSubtotal: 8900,
    shippingCost: 2800,
    serviceFee: 500,
    totalPrice: 12200,
    deliveryAddress: 'Defensa 567, CABA',
    pickupPoint: null,
    stores: [
      {
        storeId: 'store-1',
        storeName: 'Outlet Textil Avellaneda',
        status: 'COLLECTED_BY_OUTLETGO',
        refundAmount: null,
        items: [
          {
            productId: 'p4',
            productName: 'Campera liviana',
            variationLabel: 'S · Verde',
            quantity: 1,
            unitPrice: 8900,
            thumbnailUrl: null,
          },
        ],
      },
    ],
  },
  {
    id: 'ORD-MOCK-1004',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'PREPARING',
    shippingMethod: 'RETIRO_EN_PUNTO',
    carrier: null,
    trackingNumber: null,
    productSubtotal: 22400,
    shippingCost: 0,
    serviceFee: 1120,
    totalPrice: 23520,
    deliveryAddress: null,
    pickupPoint: {
      id: 'punto-2',
      name: 'OutletGo Villa Crespo',
      address: 'Corrientes 5200',
      neighborhood: 'Villa Crespo',
      businessHours: 'Lun–Sáb 10–19 h',
    },
    stores: [
      {
        storeId: 'store-2',
        storeName: 'Moda Sur',
        status: 'PREPARING',
        refundAmount: null,
        items: [
          {
            productId: 'p5',
            productName: 'Vestido midi',
            variationLabel: 'M',
            quantity: 1,
            unitPrice: 11200,
            thumbnailUrl: null,
          },
        ],
      },
      {
        storeId: 'store-4',
        storeName: 'Punto Jeans',
        status: 'STOCK_ISSUE',
        refundAmount: 11200,
        items: [
          {
            productId: 'p6',
            productName: 'Short denim',
            variationLabel: '32',
            quantity: 1,
            unitPrice: 11200,
            thumbnailUrl: null,
          },
        ],
      },
    ],
  },
];

function toListItem(order: OrderDetail): OrderListItem {
  const itemCount = order.stores.reduce(
    (sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    storeCount: order.stores.length,
    itemCount,
    totalPrice: order.totalPrice,
    shippingMethod: order.shippingMethod,
  };
}

const LIST_ITEMS = MOCK_ORDERS.map(toListItem);

export async function mockFetchOrders(page: number, size: number): Promise<Page<OrderListItem>> {
  await new Promise((r) => setTimeout(r, 350));
  const start = page * size;
  const content = LIST_ITEMS.slice(start, start + size);
  return {
    content,
    totalElements: LIST_ITEMS.length,
    number: page,
    size,
  };
}

export async function mockFetchOrderById(orderId: string): Promise<OrderDetail | null> {
  await new Promise((r) => setTimeout(r, 300));
  return MOCK_ORDERS.find((o) => o.id === orderId) ?? null;
}
