/**
 * Tipos compartidos del API de OutletGo.
 * Fuente de verdad: API_CONTRACT del backend Spring Boot.
 *
 * MODELO LOGÍSTICO — OutletGo como operador:
 *   OutletGo recolecta en cada tienda (READY_FOR_PICKUP = "listo para que OutletGo lo busque"),
 *   consolida el pedido y lo entrega al comprador. El comprador NUNCA va a cada tienda.
 *
 *   ShippingMethod (opciones del comprador):
 *     RETIRO_EN_PUNTO — el comprador retira en el punto/local de OutletGo
 *     ENVIO_CADETE    — OutletGo manda un cadete al domicilio del comprador
 */

// ---------------------------------------------------------------------------
// Paginación Spring — todos los listados usan esta estructura
// ---------------------------------------------------------------------------
export interface Page<T> {
  content: T[];
  totalElements: number;
  number: number; // página actual, 0-based
  size: number;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
export type BuyerRole = 'BUYER';

// ---------------------------------------------------------------------------
// Usuario autenticado (comprador)
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  email: string;
  role: BuyerRole;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// ShippingMethod — lo que elige el COMPRADOR al hacer checkout
//
//   RETIRO_EN_PUNTO  — el comprador pasa a buscar al punto/local de OutletGo
//   ENVIO_CORREO     — envío a domicilio; el comprador elige el carrier (ver ShippingCarrier)
//
//   ⚠️  El comprador NUNCA va a cada tienda por separado.
//   OutletGo recolecta internamente en las tiendas y consolida el pedido.
// ---------------------------------------------------------------------------
export type ShippingMethod = 'RETIRO_EN_PUNTO' | 'ENVIO_CORREO';

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  RETIRO_EN_PUNTO: 'Retiro en punto OutletGo',
  ENVIO_CORREO: 'Envío a domicilio',
};

export const SHIPPING_METHOD_ICONS: Record<ShippingMethod, string> = {
  RETIRO_EN_PUNTO: 'storefront-outline',
  ENVIO_CORREO: 'cube-outline',
};

export const SHIPPING_METHOD_DESCRIPTIONS: Record<ShippingMethod, string> = {
  RETIRO_EN_PUNTO: 'Pasás a buscarlo cuando esté listo',
  ENVIO_CORREO: 'Te lo enviamos por correo a tu domicilio',
};

// ---------------------------------------------------------------------------
// ShippingCarrier — carriers disponibles para ENVIO_CORREO
// El comprador elige uno en el checkout; cada uno cotiza precio y plazo distinto.
// ---------------------------------------------------------------------------
export type ShippingCarrier = 'CORREO_ARGENTINO' | 'ANDREANI';

export const SHIPPING_CARRIER_LABELS: Record<ShippingCarrier, string> = {
  CORREO_ARGENTINO: 'Correo Argentino',
  ANDREANI: 'Andreani',
};

export const SHIPPING_CARRIER_LOGOS: Record<ShippingCarrier, string> = {
  CORREO_ARGENTINO: 'correo-argentino',
  ANDREANI: 'andreani',
};

// ---------------------------------------------------------------------------
// ShippingCapability — capacidad logística de una tienda (interna para OutletGo)
// ---------------------------------------------------------------------------
export type ShippingCapability = 'SOLO_RETIRO' | 'SOLO_ENVIO' | 'AMBOS';

export const SHIPPING_CAPABILITY_LABELS: Record<ShippingCapability, string> = {
  SOLO_RETIRO: 'Solo recolección en tienda',
  SOLO_ENVIO: 'Solo despacho',
  AMBOS: 'Recolección y despacho',
};

// ---------------------------------------------------------------------------
// OrderStatus — fuente de verdad: API_CONTRACT del backend
//
// Nivel OrderStore (lo que ven los vendedores):
//   PENDING → PAID → PREPARING → READY_FOR_PICKUP → COLLECTED_BY_OUTLETGO
//
// Nivel Order (lo que ve el comprador):
//   PENDING → PAID → PREPARING → COLLECTING → CONSOLIDATED
//     → RETIRO_EN_PUNTO: READY_FOR_PICKUP → DELIVERED
//     → ENVIO_CADETE:    IN_TRANSIT       → DELIVERED
//
//   READY_FOR_PICKUP en la Order significa "listo en punto OutletGo para el comprador"
//   (diferente semántica que el READY_FOR_PICKUP de OrderStore que es "listo para que OutletGo recolecte")
//
//   DELIVERED es el terminal exitoso y habilita reseñar.
// ---------------------------------------------------------------------------
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'           // tiendas armando sus partes
  | 'COLLECTING'          // OutletGo recolectando en las tiendas
  | 'CONSOLIDATED'        // OutletGo tiene todo el pedido junto
  | 'READY_FOR_PICKUP'    // listo en punto OutletGo (solo RETIRO_EN_PUNTO)
  | 'IN_TRANSIT'          // cadete en camino (solo ENVIO_CADETE)
  | 'DELIVERED'           // terminal exitoso para ambos caminos
  | 'CANCELED'
  | 'STOCK_ISSUE';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de pago',
  PAID: 'Pago confirmado',
  PREPARING: 'Tiendas preparando tu pedido',
  COLLECTING: 'OutletGo buscando tus productos',
  CONSOLIDATED: 'Pedido consolidado',
  READY_FOR_PICKUP: 'Listo para retirar',
  IN_TRANSIT: 'Cadete en camino',
  DELIVERED: 'Entregado',
  CANCELED: 'Cancelado',
  STOCK_ISSUE: 'Problema de stock',
};

export type OrderStatusBadgeVariant = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

export const ORDER_STATUS_BADGE: Record<OrderStatus, OrderStatusBadgeVariant> = {
  PENDING: 'warning',
  PAID: 'info',
  PREPARING: 'info',
  COLLECTING: 'info',
  CONSOLIDATED: 'info',
  READY_FOR_PICKUP: 'info',
  IN_TRANSIT: 'info',
  DELIVERED: 'success',
  CANCELED: 'danger',
  STOCK_ISSUE: 'warning',
};

/** Estados terminales: no pueden avanzar ni retroceder. */
export const ORDER_TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'DELIVERED',
  'CANCELED',
]);

/** El pedido llegó a su destino exitosamente (habilita reseñar). */
export function isOrderDelivered(status: OrderStatus): boolean {
  return status === 'DELIVERED';
}

/** El pedido está activo y puede seguir avanzando. */
export function isOrderActive(status: OrderStatus): boolean {
  return !ORDER_TERMINAL_STATUSES.has(status);
}

// ---------------------------------------------------------------------------
// ProductStatus
// ---------------------------------------------------------------------------
export type ProductStatus =
  | 'ACTIVE'
  | 'PAUSED_BY_SELLER'
  | 'DISABLED_BY_ADMIN';

// ---------------------------------------------------------------------------
// Respuesta de error del backend
// ---------------------------------------------------------------------------
export interface ApiErrorBody {
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

// ---------------------------------------------------------------------------
// Respuesta de auth
// ---------------------------------------------------------------------------
export interface AuthResponse {
  token: string;
  user: User;
}
