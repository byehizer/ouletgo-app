import { Linking, Platform } from 'react-native';
import { PROVIDER_GOOGLE, type Provider } from 'react-native-maps';

import { GOOGLE_MAPS_API_KEY } from '../config/env';

/** Misma key para perfil de tienda (Paso 8) y tab Mapa (Paso 9). */
export function hasGoogleMapsKey(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

/** Provider Google Maps en Android (requiere key en app.config + rebuild), Apple Maps en iOS. */
export function getGoogleMapProvider(): Provider {
  return Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
}

/** iframe embed para web — Maps Embed API. */
export function buildGoogleMapsEmbedUrl(latitude: number, longitude: number): string | null {
  if (!hasGoogleMapsKey()) return null;
  const q = `${latitude},${longitude}`;
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&q=${encodeURIComponent(q)}&zoom=16`;
}

export function openInGoogleMaps(latitude: number, longitude: number, label: string) {
  const encoded = encodeURIComponent(label);
  const nativeUrl =
    Platform.OS === 'ios'
      ? `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=16`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encoded})`;

  void Linking.canOpenURL(nativeUrl).then((can) => {
    if (can) {
      void Linking.openURL(nativeUrl);
      return;
    }
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    );
  });
}
