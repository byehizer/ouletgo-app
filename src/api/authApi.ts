import { apiClient } from './client';
import {
  isMockToken,
  mockFetchMe,
  mockLogin,
  mockRecoverPassword,
  mockRegister,
} from './mock/authMock';
import { USE_MOCKS } from '../config/env';
import { getToken } from '../lib/secureStore';

import type { AuthResponse, BuyerRole, User } from './types';

const PUBLIC_AUTH = {
  skipAuth: true,
  suppressUnauthorizedEvent: true,
} as const;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RecoverPasswordRequest {
  email: string;
}

export interface GoogleInitResponse {
  url: string;
}

export class AuthRoleError extends Error {
  constructor() {
    super('Esta app es solo para compradores.');
    this.name = 'AuthRoleError';
  }
}

function parseUser(raw: unknown): User {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de usuario inválida.');
  }

  const obj = raw as Record<string, unknown>;
  let role = obj['role'];

  if (role === 'CLIENT') {
    role = 'BUYER';
  }

  if (role !== 'BUYER') {
    throw new AuthRoleError();
  }

  const id = obj['id'];
  const email = obj['email'];
  const name = obj['name'];
  const lastName = obj['lastName'] ?? obj['last_name'];
  const avatarUrl = obj['avatarUrl'] ?? obj['avatar_url'] ?? null;
  const isActive = obj['isActive'] ?? obj['is_active'];

  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new Error('Respuesta de usuario inválida.');
  }

  return {
    id,
    email,
    role: role as BuyerRole,
    name: typeof name === 'string' ? name : '',
    lastName: typeof lastName === 'string' ? lastName : '',
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
    isActive: typeof isActive === 'boolean' ? isActive : true,
  };
}

function parseAuthResponse(raw: unknown): AuthResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de autenticación inválida.');
  }

  const obj = raw as Record<string, unknown>;
  const token = obj['token'];

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Respuesta de autenticación inválida.');
  }

  return {
    token,
    user: parseUser(obj['user']),
  };
}

export async function loginWithEmail(data: LoginRequest): Promise<AuthResponse> {
  if (USE_MOCKS) return mockLogin(data.email.trim(), data.password);
  const raw = await apiClient.post<unknown>('/api/auth/login', data, PUBLIC_AUTH);
  return parseAuthResponse(raw);
}

export async function registerBuyer(data: RegisterRequest): Promise<AuthResponse> {
  if (USE_MOCKS) return mockRegister(data);
  const raw = await apiClient.post<unknown>(
    '/api/auth/register',
    { ...data, role: 'CLIENT' },
    PUBLIC_AUTH,
  );
  return parseAuthResponse(raw);
}

export async function fetchGoogleInitUrl(): Promise<string> {
  const raw = await apiClient.get<unknown>('/api/auth/google/init', PUBLIC_AUTH);

  if (!raw || typeof raw !== 'object') {
    throw new Error('No se pudo iniciar Google.');
  }

  const url = (raw as Record<string, unknown>)['url'];
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('No se pudo iniciar Google.');
  }

  return url;
}

export async function fetchCurrentUser(options?: { silent401?: boolean }): Promise<User> {
  if (USE_MOCKS) {
    const token = await getToken();
    if (isMockToken(token)) return mockFetchMe();
  }
  const raw = await apiClient.get<unknown>('/api/auth/me', {
    suppressUnauthorizedEvent: options?.silent401 ?? false,
  });
  return parseUser(raw);
}

export async function fetchMeWithToken(bearerToken: string): Promise<User> {
  if (USE_MOCKS && isMockToken(bearerToken)) return mockFetchMe();
  const raw = await apiClient.get<unknown>('/api/auth/me', {
    bearerToken,
    suppressUnauthorizedEvent: true,
  });
  return parseUser(raw);
}

export async function recoverPassword(data: RecoverPasswordRequest): Promise<void> {
  if (USE_MOCKS) {
    await mockRecoverPassword();
    return;
  }
  await apiClient.post<unknown>('/api/auth/recover-password', data, PUBLIC_AUTH);
}
