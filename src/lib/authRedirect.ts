import * as Linking from 'expo-linking';

/**
 * Extrae el JWT del deep link de OAuth: outletgo://callback?token=...
 */
export function extractTokenFromAuthUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const token = parsed.queryParams?.['token'];

  if (typeof token === 'string' && token.length > 0) {
    return token;
  }

  if (Array.isArray(token) && token.length > 0 && typeof token[0] === 'string') {
    return token[0];
  }

  return null;
}

/** URL de retorno para expo-web-browser (Expo Go usa exp://, build usa outletgo://). */
export function getOAuthRedirectUrl(): string {
  return Linking.createURL('callback');
}
