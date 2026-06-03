/**
 * Handlers invocados cuando el backend responde 401 (token inválido o expirado).
 * AuthContext (Paso 3) se suscribe para limpiar sesión y redirigir a login.
 *
 * En React Native no existe window.dispatchEvent — usamos pub/sub propio,
 * igual que el patrón del panel web pero sin depender del DOM.
 */
type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dispatchUnauthorized(): void {
  for (const fn of [...listeners]) {
    fn();
  }
}
