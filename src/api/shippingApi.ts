/**
 * shippingApi.ts — Sistema de Envíos OutletGo
 *
 * MODELO LOGÍSTICO:
 *   OutletGo recolecta en cada tienda cuando está READY_FOR_PICKUP,
 *   consolida el pedido y lo entrega al comprador.
 *
 *   Opciones del comprador (en checkout):
 *     RETIRO_EN_PUNTO — pasa a buscar al punto/local OutletGo
 *     ENVIO_CORREO    — envío a domicilio; el comprador elige carrier:
 *                         · Correo Argentino
 *                         · Andreani
 *
 * Documento de referencia: docs/shipping-system-spec.md
 */

import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import type { ShippingCarrier, ShippingMethod } from './types';

// ---------------------------------------------------------------------------
// Punto de retiro OutletGo
// ---------------------------------------------------------------------------

/** Un punto físico de OutletGo donde el comprador puede retirar su pedido. */
export interface OutletGoPickupPoint {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  /** Horario de atención en texto libre. */
  businessHours: string;
  /** Distancia en km desde la ubicación del comprador (null si no hay geoloc). */
  distanceKm: number | null;
}

// ---------------------------------------------------------------------------
// Cotización de envío
// ---------------------------------------------------------------------------

/**
 * Cotización de un carrier para ENVIO_CORREO.
 * El backend consulta a Correo Argentino y Andreani y devuelve ambas opciones.
 */
export interface ShippingQuote {
  carrier: ShippingCarrier;
  /** Costo en ARS. */
  cost: number;
  /** Días hábiles estimados de entrega. */
  estimatedDays: number;
}

/** Request para cotizar los carriers disponibles para ENVIO_CORREO. */
export interface ShippingQuoteRequest {
  /** Código postal de destino. */
  postalCode: string;
  /** Peso total del pedido consolidado en gramos (estimado por el backend). */
  weightGrams?: number;
}

/**
 * Datos de envío confirmados que viajan al checkout.
 * Se persisten en la Order del backend.
 */
export interface OrderShippingConfirmation {
  method: ShippingMethod;
  shippingCost: number;
  /** Dirección de entrega. Requerida si method === 'ENVIO_CORREO'. */
  deliveryAddress: string | null;
  /** ID del punto de retiro elegido. Requerido si method === 'RETIRO_EN_PUNTO'. */
  pickupPointId: string | null;
  /** Carrier elegido por el comprador. Solo aplica a ENVIO_CORREO. */
  carrier: ShippingCarrier | null;
}

/** Estado de seguimiento de un envío. Solo aplica a ENVIO_CORREO. */
export interface ShippingTracking {
  orderId: string;
  carrier: ShippingCarrier;
  /** Número de seguimiento provisto por el carrier. */
  trackingNumber: string;
  currentStatus: string;
  estimatedDelivery: string | null; // ISO 8601
  events: ShippingTrackingEvent[];
}

export interface ShippingTrackingEvent {
  timestamp: string; // ISO 8601
  description: string;
  location: string | null;
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

async function mockGetShippingQuotes(_req: ShippingQuoteRequest): Promise<ShippingQuote[]> {
  await new Promise((r) => setTimeout(r, 400));
  return [
    { carrier: 'CORREO_ARGENTINO', cost: 2800, estimatedDays: 5 },
    { carrier: 'ANDREANI', cost: 3900, estimatedDays: 3 },
  ];
}

async function mockGetPickupPoints(_lat?: number, _lng?: number): Promise<OutletGoPickupPoint[]> {
  await new Promise((r) => setTimeout(r, 250));
  return [
    {
      id: 'punto-1',
      name: 'OutletGo Palermo',
      address: 'Thames 1540',
      neighborhood: 'Palermo',
      city: 'Buenos Aires',
      lat: -34.588,
      lng: -58.432,
      businessHours: 'Lun–Sáb 10–20 h',
      distanceKm: _lat ? 1.2 : null,
    },
    {
      id: 'punto-2',
      name: 'OutletGo Villa Crespo',
      address: 'Corrientes 5200',
      neighborhood: 'Villa Crespo',
      city: 'Buenos Aires',
      lat: -34.596,
      lng: -58.443,
      businessHours: 'Lun–Sáb 10–19 h',
      distanceKm: _lat ? 2.5 : null,
    },
  ];
}

async function mockGetShippingTracking(_orderId: string): Promise<ShippingTracking> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    orderId: _orderId,
    carrier: 'ANDREANI',
    trackingNumber: 'AND-MOCK-001',
    currentStatus: 'En tránsito',
    estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
    events: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Ingresó al centro de distribución',
        location: 'Avellaneda, Buenos Aires',
      },
      {
        timestamp: new Date().toISOString(),
        description: 'En camino a destino',
        location: null,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Devuelve las cotizaciones de Correo Argentino y Andreani para un código postal.
 * El comprador elige una en el checkout.
 *
 * Backend: GET /api/buyer/shipping/quotes?postalCode=&weightGrams=
 */
export async function getShippingQuotes(req: ShippingQuoteRequest): Promise<ShippingQuote[]> {
  if (USE_MOCKS) return mockGetShippingQuotes(req);

  try {
    const sp = new URLSearchParams();
    sp.set('postalCode', req.postalCode);
    if (req.weightGrams != null) sp.set('weightGrams', String(req.weightGrams));

    return await apiClient.get<ShippingQuote[]>(`/api/buyer/shipping/quotes?${sp.toString()}`);
  } catch {
    // Endpoint aún no disponible en backend — fallback demo en desarrollo
    if (__DEV__) return mockGetShippingQuotes(req);
    throw new Error('No se pudo cotizar el envío.');
  }
}

/**
 * Lista los puntos de retiro de OutletGo, ordenados por distancia si hay coordenadas.
 *
 * Backend: GET /api/buyer/shipping/pickup-points?lat=&lng=
 */
export async function getPickupPoints(lat?: number, lng?: number): Promise<OutletGoPickupPoint[]> {
  if (USE_MOCKS) return mockGetPickupPoints(lat, lng);

  const sp = new URLSearchParams();
  if (lat != null) sp.set('lat', String(lat));
  if (lng != null) sp.set('lng', String(lng));

  return apiClient.get<OutletGoPickupPoint[]>(`/api/buyer/shipping/pickup-points?${sp.toString()}`);
}

/**
 * Tracking de un envío activo por carrier (Correo Argentino / Andreani).
 * Solo disponible cuando la orden está en estado IN_TRANSIT.
 *
 * Backend: GET /api/buyer/orders/{orderId}/shipping-tracking
 */
export async function getShippingTracking(orderId: string): Promise<ShippingTracking> {
  if (USE_MOCKS) return mockGetShippingTracking(orderId);

  return apiClient.get<ShippingTracking>(`/api/buyer/orders/${orderId}/shipping-tracking`);
}
