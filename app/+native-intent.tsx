export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // Solo interceptar y normalizar las rutas de negocio conocidas:
  // - Retorno de Mercado Pago: outletgo://checkout/return
  // - Callback de Google OAuth: outletgo://callback
  // Esto previene interceptar URLs de configuración de Expo Development Client como 'outletgo://expo-development-client/?url=...'
  if (path.startsWith('outletgo:')) {
    const cleanPath = path.replace(/^outletgo:\/*/, '');
    if (cleanPath.startsWith('checkout/return') || cleanPath.startsWith('callback')) {
      return '/' + cleanPath;
    }
  }

  return path;
}
