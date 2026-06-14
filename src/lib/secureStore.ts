import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearMockUserState } from '../api/mock/mockUserState';

const TOKEN_KEY = 'outletgo_token';
const USER_KEY = 'outletgo_user';

/**
 * El token JWT va siempre en SecureStore (almacenamiento cifrado del dispositivo).
 * NUNCA en AsyncStorage — el token es un dato sensible.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * El objeto User va en AsyncStorage porque no es un dato sensible
 * (no es el secreto que da acceso, es solo la información del perfil).
 */
export async function saveUser(user: object): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

/**
 * Limpia toda la sesión local.
 * Se llama en logout y en cualquier respuesta 401 del backend.
 */
export async function clearSession(): Promise<void> {
  await Promise.all([deleteToken(), deleteUser(), clearMockUserState()]);
}
