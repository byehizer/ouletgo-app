import type { ChangePasswordRequest, UpdateEmailRequest, UpdateProfileRequest } from '../userApi';
import type { User } from '../types';

import { MOCK_DEMO_PASSWORD } from './constants';
import { getMockProfileUser, setMockProfileUser } from './mockUserState';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function mockUpdateProfile(payload: UpdateProfileRequest): Promise<User> {
  await delay();
  const current = getMockProfileUser();
  setMockProfileUser({
    ...current,
    name: payload.name.trim(),
    lastName: payload.lastName.trim(),
    avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : current.avatarUrl,
  });
  return getMockProfileUser();
}

export async function mockUpdateEmail(payload: UpdateEmailRequest): Promise<User> {
  await delay();
  if (payload.currentPassword !== MOCK_DEMO_PASSWORD) {
    throw new Error('Contraseña actual incorrecta.');
  }
  const email = payload.email.trim().toLowerCase();
  if (!email.includes('@')) {
    throw new Error('Ingresá un email válido.');
  }
  setMockProfileUser({ ...getMockProfileUser(), email });
  return getMockProfileUser();
}

export async function mockChangePassword(payload: ChangePasswordRequest): Promise<void> {
  await delay();
  if (payload.currentPassword !== MOCK_DEMO_PASSWORD) {
    throw new Error('Contraseña actual incorrecta.');
  }
  if (payload.newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }
}

export async function mockDeactivateAccount(): Promise<void> {
  await delay(400);
  setMockProfileUser({ ...getMockProfileUser(), isActive: false });
}
