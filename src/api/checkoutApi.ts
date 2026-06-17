/**
 * checkoutApi.ts — Creación de órdenes y Mercado Pago Checkout Pro.
 *
 * Flujo:
 *   1. getCheckoutSummary() → desglose de precios (productos + envío + tarifa de servicio)
 *   2. createOrder()        → orderId + mpInitPoint (URL de MP Checkout Pro)
 *   3. App abre mpInitPoint en WebBrowser
 *   4. MP redirige a outletgo://checkout/return?status=approved|pending|failure&order_id=xxx
 *   5. App muestra resultado y (si approved) limpia el carrito
 *
 * TARIFA DE SERVICIO:
 *   OutletGo cobra una tarifa propia por actuar como operador logístico.
 *   La calcula el backend según las reglas en `service_fee_rules`.
 *   El mobile nunca la calcula — solo muestra el desglose.
 *   Ver: docs/shipping-system-spec.md § 8
 */
import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import type { ShippingCarrier, ShippingMethod } from './types';

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface CheckoutItemPayload {
  productId: string;
  variationId: string;
  quantity: number;
  unitPrice: number;
}

export interface CheckoutStorePayload {
  storeId: string;
  items: CheckoutItemPayload[];
}

export interface CheckoutShippingPayload {
  method: ShippingMethod;
  /** Carrier elegido por el comprador. Solo para ENVIO_CORREO. */
  carrier: ShippingCarrier | null;
  /** Costo cotizado en ARS. 0 para RETIRO_EN_PUNTO. */
  quotedCost: number;
  /** Días estimados según carrier. null para RETIRO_EN_PUNTO. */
  estimatedDays: number | null;
  /** Dirección de entrega. Solo para ENVIO_CORREO. */
  deliveryAddress: string | null;
  /** Código postal de entrega. Solo para ENVIO_CORREO. */
  postalCode: string | null;
  /** ID del punto de retiro. Solo para RETIRO_EN_PUNTO. */
  pickupPointId: string | null;
}

export interface CreateOrderRequest {
  storeGroups: CheckoutStorePayload[];
  shipping: CheckoutShippingPayload;
  /** UUID v4 generado en cliente. Previene órdenes duplicadas. */
  idempotencyKey: string;
}

// ---------------------------------------------------------------------------
// Summary / pricing types
// ---------------------------------------------------------------------------

/**
 * Desglose de precios que el backend calcula antes de crear la orden.
 * El backend aplica las reglas de service_fee_rules.
 *
 * Backend: GET /api/buyer/checkout/summary
 */
export interface CheckoutSummary {
  /** Suma de precios de ítems del carrito. */
  productSubtotal: number;
  /** Costo del carrier (Andreani / Correo Argentino). 0 para RETIRO_EN_PUNTO. */
  shippingCost: number;
  /**
   * Tarifa de servicio de OutletGo (recolección + consolidación).
   * Calculada según service_fee_rules (% o fijo).
   * 0 si no hay regla activa.
   */
  serviceFee: number;
  /** productSubtotal + shippingCost + serviceFee */
  total: number;
  /** Texto descriptivo de la tarifa de servicio para mostrar al usuario. */
  serviceFeeLabel: string | null;
}

export interface CheckoutSummaryRequest {
  productSubtotal: number;
  method: ShippingMethod;
  carrier: ShippingCarrier | null;
  quotedShippingCost: number;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface CreateOrderResponse {
  /** ID de la orden recién creada. */
  orderId: string;
  /** URL de Mercado Pago Checkout Pro. Abrir con expo-web-browser. */
  mpInitPoint: string;
}

/** Respuesta de MP al retornar vía deep link. */
export type MpPaymentStatus = 'approved' | 'pending' | 'failure' | 'cancelled';

export interface MpReturnParams {
  status: MpPaymentStatus;
  orderId: string | null;
  paymentId: string | null;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function mockCalculateServiceFee(productSubtotal: number): number {
  // Mock: 5% sobre el subtotal de productos, mínimo $500
  const fee = productSubtotal * 0.05;
  return Math.max(fee, 500);
}

async function mockGetCheckoutSummary(req: CheckoutSummaryRequest): Promise<CheckoutSummary> {
  await new Promise((r) => setTimeout(r, 200));
  const serviceFee = mockCalculateServiceFee(req.productSubtotal);
  const total = req.productSubtotal + req.quotedShippingCost + serviceFee;
  return {
    productSubtotal: req.productSubtotal,
    shippingCost: req.quotedShippingCost,
    serviceFee,
    total,
    serviceFeeLabel: 'Tarifa de servicio OutletGo (5%)',
  };
}

async function mockCreateOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  await new Promise((r) => setTimeout(r, 800));
  const orderId = `ORD-MOCK-${Date.now()}`;
  const returnUrl = `outletgo://checkout/return?status=approved&order_id=${orderId}&payment_id=MOCK_PAY_001`;
  return { orderId, mpInitPoint: returnUrl };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Obtiene el desglose completo de precios antes de pagar.
 * El backend calcula la tarifa de servicio según service_fee_rules.
 *
 * Backend: GET /api/buyer/checkout/summary
 */
export async function getCheckoutSummary(
  req: CheckoutSummaryRequest,
): Promise<CheckoutSummary> {
  if (USE_MOCKS) return mockGetCheckoutSummary(req);

  try {
    const sp = new URLSearchParams();
    sp.set('productSubtotal', String(req.productSubtotal));
    sp.set('method', req.method);
    if (req.carrier) sp.set('carrier', req.carrier);
    sp.set('quotedShippingCost', String(req.quotedShippingCost));
    return await apiClient.get<CheckoutSummary>(
      `/api/buyer/checkout/summary?${sp.toString()}`,
    );
  } catch {
    if (__DEV__) return mockGetCheckoutSummary(req);
    throw new Error('No se pudo calcular el total. Intentá de nuevo.');
  }
}

/**
 * Crea la orden en el backend y obtiene la preferencia de Mercado Pago.
 *
 * Backend: POST /api/buyer/checkout
 * Headers: Idempotency-Key: {idempotencyKey}
 */
export async function createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  if (USE_MOCKS) return mockCreateOrder(req);

  return apiClient.post<CreateOrderResponse>('/api/buyer/checkout', req, {
    idempotencyKey: req.idempotencyKey,
  });
}

/**
 * Notifica al backend el resultado del pago para actualizar el estado del pedido.
 */
export async function updateOrderPaymentStatus(orderId: string, status: MpPaymentStatus): Promise<void> {
  if (USE_MOCKS) return;
  await apiClient.post(`/api/buyer/orders/${orderId}/payment-status?status=${status}`);
}

/**
 * Parsea los parámetros que MP devuelve en el deep link de retorno.
 * outletgo://checkout/return?status=approved&order_id=123&payment_id=456
 */
export function parseMpReturnUrl(url: string): MpReturnParams {
  try {
    const parsed = new URL(url);
    const status = (parsed.searchParams.get('status') ?? 'failure') as MpPaymentStatus;
    const orderId = parsed.searchParams.get('order_id') ?? parsed.searchParams.get('orderId');
    const paymentId =
      parsed.searchParams.get('payment_id') ?? parsed.searchParams.get('paymentId');
    return { status, orderId, paymentId };
  } catch {
    return { status: 'failure', orderId: null, paymentId: null };
  }
}
