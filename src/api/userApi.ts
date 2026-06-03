import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import {
  mockChangePassword,
  mockDeactivateAccount,
  mockUpdateEmail,
  mockUpdateProfile,
} from './mock/userMock';

import type { User } from './types';

export interface UpdateProfileRequest {
  name: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface UpdateEmailRequest {
  email: string;
  currentPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

function parseUser(raw: unknown): User {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de usuario inválida.');
  }
  const o = raw as Record<string, unknown>;
  const role = o['role'];
  if (role !== 'BUYER') {
    throw new Error('Esta app es solo para compradores.');
  }
  const id = o['id'];
  const email = o['email'];
  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new Error('Respuesta de usuario inválida.');
  }
  const name = o['name'];
  const lastName = o['lastName'] ?? o['last_name'];
  const avatarUrl = o['avatarUrl'] ?? o['avatar_url'];
  const isActive = o['isActive'] ?? o['is_active'];

  return {
    id,
    email,
    role: 'BUYER',
    name: typeof name === 'string' ? name : '',
    lastName: typeof lastName === 'string' ? lastName : '',
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
    isActive: typeof isActive === 'boolean' ? isActive : true,
  };
}

/** Actualiza nombre, apellido y opcionalmente avatarUrl (ya subido). */
export async function updateProfile(payload: UpdateProfileRequest): Promise<User> {
  if (USE_MOCKS) {
    return mockUpdateProfile(payload);
  }
  const raw = await apiClient.patch<unknown>('/api/buyer/me', payload);
  return parseUser(raw);
}

export async function updateEmail(payload: UpdateEmailRequest): Promise<User> {
  if (USE_MOCKS) {
    return mockUpdateEmail(payload);
  }
  const raw = await apiClient.patch<unknown>('/api/buyer/me/email', payload);
  return parseUser(raw);
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  if (USE_MOCKS) {
    return mockChangePassword(payload);
  }
  await apiClient.post<void>('/api/buyer/me/change-password', payload);
}

/** Desactiva la cuenta del comprador (soft delete). La sesión debe cerrarse en cliente. */
export async function deactivateAccount(): Promise<void> {
  if (USE_MOCKS) {
    return mockDeactivateAccount();
  }
  await apiClient.post<void>('/api/buyer/me/deactivate', {});
}
