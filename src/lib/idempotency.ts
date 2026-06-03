/**
 * Idempotency keys para evitar órdenes duplicadas en Mercado Pago.
 *
 * La key se genera una sola vez por "fingerprint" del carrito y se persiste
 * en AsyncStorage. Si el usuario intenta pagar dos veces el mismo carrito,
 * el backend recibe la misma key y no genera dos órdenes.
 *
 * Limpiar la key después de un pago exitoso con clearIdempotencyKey().
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'outletgo_idem_';

function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Genera un fingerprint simple del carrito a partir de los IDs de variaciones
 * y cantidades. Lo usamos como sufijo de la storage key.
 */
export function cartFingerprint(
  items: Array<{ variationId: string; quantity: number }>,
): string {
  return items
    .slice()
    .sort((a, b) => a.variationId.localeCompare(b.variationId))
    .map((i) => `${i.variationId}:${i.quantity}`)
    .join('|');
}

/**
 * Devuelve la idempotency key para este carrito.
 * Si no existe, la genera y persiste.
 */
export async function getOrCreateIdempotencyKey(fingerprint: string): Promise<string> {
  const storageKey = PREFIX + fingerprint;
  const existing = await AsyncStorage.getItem(storageKey);
  if (existing) return existing;
  const key = uuidV4();
  await AsyncStorage.setItem(storageKey, key);
  return key;
}

/**
 * Elimina la key después de un pago exitoso para permitir futuros pagos.
 */
export async function clearIdempotencyKey(fingerprint: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + fingerprint);
}
