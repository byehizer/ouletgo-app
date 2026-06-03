/**
 * CartContext — Carrito multitienda OutletGo.
 *
 * El método de envío (RETIRO_EN_PUNTO / ENVIO_CADETE) es único para toda la orden
 * y se elige en el checkout, no en el carrito. El carrito solo agrupa ítems por tienda
 * y calcula subtotales de productos. El costo de envío se agrega en el checkout.
 *
 * MODELO LOGÍSTICO: OutletGo recolecta en cada tienda y consolida el pedido.
 * El comprador NUNCA va a las tiendas por separado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ShippingCarrier, ShippingMethod } from '../api/types';

const CART_KEY = 'outletgo_cart';
const SHIPPING_KEY = 'outletgo_cart_shipping';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string;
  variationId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  maxStock: number;
  thumbnailUrl: string | null;
  variationLabel: string;
}

/**
 * Selección de envío para la orden completa.
 * Se elige en el checkout; el carrito la guarda como borrador.
 */
export interface StoreShippingSelection {
  method: ShippingMethod;
  /** Requerida cuando method === 'ENVIO_CORREO'. */
  deliveryAddress: string | null;
  /** Código postal de entrega. Requerido para cotizar con los carriers. */
  postalCode: string | null;
  /** ID del punto de retiro elegido. Requerido cuando method === 'RETIRO_EN_PUNTO'. */
  pickupPointId: string | null;
  /**
   * Carrier elegido por el comprador (Correo Argentino o Andreani).
   * Solo aplica a ENVIO_CORREO.
   */
  carrier: ShippingCarrier | null;
  /** Costo en ARS según la cotización del carrier. 0 para RETIRO_EN_PUNTO. */
  shippingCost: number;
  /** Días hábiles estimados según el carrier. null para RETIRO_EN_PUNTO. */
  estimatedDays: number | null;
}

export const DEFAULT_SHIPPING_SELECTION: StoreShippingSelection = {
  method: 'RETIRO_EN_PUNTO',
  deliveryAddress: null,
  postalCode: null,
  pickupPointId: null,
  carrier: null,
  shippingCost: 0,
  estimatedDays: null,
};

export interface CartStoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  /** Subtotal de productos (sin envío). */
  subtotal: number;
  shipping: StoreShippingSelection;
  /** Subtotal + costo de envío. */
  subtotalWithShipping: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  storeCount: number;
  /** Total de productos sin envío. */
  subtotal: number;
  /** Total de costos de envío de todas las tiendas. */
  shippingTotal: number;
  /** Subtotal + shippingTotal — es lo que se cobra en Mercado Pago. */
  total: number;
  groups: CartStoreGroup[];
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variationId: string, quantity: number) => void;
  removeItem: (variationId: string) => void;
  clearStore: (storeId: string) => void;
  clearCart: () => void;
  /** Actualiza el método y datos de envío para una tienda. */
  setShippingSelection: (storeId: string, selection: Partial<StoreShippingSelection>) => void;
  /** Devuelve la selección de envío actual de una tienda (o el default). */
  getShippingSelection: (storeId: string) => StoreShippingSelection;
}

// ---------------------------------------------------------------------------
// Internos
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(item: Pick<CartItem, 'variationId'>): string {
  return item.variationId;
}

function computeGroups(
  items: CartItem[],
  shippingSelections: Record<string, StoreShippingSelection>,
): CartStoreGroup[] {
  const map = new Map<string, Omit<CartStoreGroup, 'shipping' | 'subtotalWithShipping'>>();

  for (const item of items) {
    const existing = map.get(item.storeId);
    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.price * item.quantity;
    } else {
      map.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [item],
        subtotal: item.price * item.quantity,
      });
    }
  }

  return [...map.values()].map((g) => {
    const shipping = shippingSelections[g.storeId] ?? DEFAULT_SHIPPING_SELECTION;
    return {
      ...g,
      shipping,
      subtotalWithShipping: g.subtotal + shipping.shippingCost,
    };
  });
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingSelections, setShippingSelections] = useState<
    Record<string, StoreShippingSelection>
  >({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratación desde AsyncStorage
  useEffect(() => {
    void (async () => {
      try {
        const [rawItems, rawShipping] = await Promise.all([
          AsyncStorage.getItem(CART_KEY),
          AsyncStorage.getItem(SHIPPING_KEY),
        ]);
        if (rawItems) {
          const parsed = JSON.parse(rawItems) as CartItem[];
          if (Array.isArray(parsed)) setItems(parsed);
        }
        if (rawShipping) {
          const parsed = JSON.parse(rawShipping) as Record<string, StoreShippingSelection>;
          if (parsed && typeof parsed === 'object') setShippingSelections(parsed);
        }
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // Persistencia de ítems
  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  // Persistencia de selecciones de envío
  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(SHIPPING_KEY, JSON.stringify(shippingSelections));
  }, [shippingSelections, isHydrated]);

  // ---------------------------------------------------------------------------
  // Acciones de ítems
  // ---------------------------------------------------------------------------

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => cartKey(i) === cartKey(item));
      if (idx >= 0) {
        const next = [...prev];
        const current = next[idx];
        if (!current) return prev;
        const newQty = Math.min(current.maxStock, current.quantity + quantity);
        next[idx] = { ...current, quantity: newQty };
        return next;
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }];
    });
  }, []);

  const updateQuantity = useCallback((variationId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.variationId !== variationId);
      return prev.map((i) =>
        i.variationId === variationId
          ? { ...i, quantity: Math.min(quantity, i.maxStock) }
          : i,
      );
    });
  }, []);

  const removeItem = useCallback((variationId: string) => {
    setItems((prev) => prev.filter((i) => i.variationId !== variationId));
  }, []);

  const clearStore = useCallback((storeId: string) => {
    setItems((prev) => prev.filter((i) => i.storeId !== storeId));
    // Limpiar también la selección de envío de esa tienda
    setShippingSelections((prev) => {
      const next = { ...prev };
      delete next[storeId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setShippingSelections({});
  }, []);

  // ---------------------------------------------------------------------------
  // Acciones de envío
  // ---------------------------------------------------------------------------

  const setShippingSelection = useCallback(
    (storeId: string, selection: Partial<StoreShippingSelection>) => {
      setShippingSelections((prev) => ({
        ...prev,
        [storeId]: {
          ...(prev[storeId] ?? DEFAULT_SHIPPING_SELECTION),
          ...selection,
        },
      }));
    },
    [],
  );

  const getShippingSelection = useCallback(
    (storeId: string): StoreShippingSelection =>
      shippingSelections[storeId] ?? DEFAULT_SHIPPING_SELECTION,
    [shippingSelections],
  );

  // ---------------------------------------------------------------------------
  // Valores derivados
  // ---------------------------------------------------------------------------

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const storeCount = useMemo(() => new Set(items.map((i) => i.storeId)).size, [items]);

  const groups = useMemo(
    () => computeGroups(items, shippingSelections),
    [items, shippingSelections],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const shippingTotal = useMemo(
    () => groups.reduce((sum, g) => sum + g.shipping.shippingCost, 0),
    [groups],
  );

  const total = useMemo(() => subtotal + shippingTotal, [subtotal, shippingTotal]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      storeCount,
      subtotal,
      shippingTotal,
      total,
      groups,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearStore,
      clearCart,
      setShippingSelection,
      getShippingSelection,
    }),
    [
      items,
      itemCount,
      storeCount,
      subtotal,
      shippingTotal,
      total,
      groups,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearStore,
      clearCart,
      setShippingSelection,
      getShippingSelection,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
