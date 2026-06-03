/**
 * Variables de entorno de la app.
 */
export const API_BASE_URL: string =
  process.env['EXPO_PUBLIC_BACKEND_URL'] ?? 'https://outletgo-api.onrender.com';

/** Activa respuestas ficticias sin backend (desarrollo / demo). */
export const USE_MOCKS: boolean =
  process.env['EXPO_PUBLIC_USE_MOCKS'] === 'true';

/**
 * Google Maps SDK (Android/iOS) + Maps Embed API (web).
 * Habilitar Maps SDK for Android / iOS en Google Cloud Console.
 * Rebuild nativo tras agregar la key (no alcanza hot reload).
 */
export const GOOGLE_MAPS_API_KEY: string =
  process.env['EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? '';
