/**
 * notificationApi.ts — Registro de push tokens en el backend.
 *
 * Backend:
 *   POST   /api/buyer/notifications/register   { token, platform }
 *   DELETE /api/buyer/notifications/register   { token }
 */
import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export async function registerPushTokenOnBackend(
  payload: RegisterPushTokenRequest,
): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150));
    return;
  }

  try {
    await apiClient.post('/api/buyer/notifications/register', payload);
  } catch {
    if (__DEV__) return;
    throw new Error('No se pudo registrar el dispositivo para notificaciones.');
  }
}

export async function unregisterPushTokenOnBackend(token: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 100));
    return;
  }

  try {
    const sp = new URLSearchParams();
    sp.set('token', token);
    await apiClient.delete(`/api/buyer/notifications/register?${sp.toString()}`);
  } catch {
    // En logout no bloqueamos si falla el unregister
    if (__DEV__) return;
  }
}
