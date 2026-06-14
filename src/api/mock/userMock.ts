import type { ChangePasswordRequest, UpdateEmailRequest, UpdateProfileRequest } from '../userApi';
import type { User } from '../types';

import {
  getMockProfileUser,
  setMockProfileUser,
  getMockUserPassword,
  setMockUserPassword,
} from './mockUserState';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function mockUpdateProfile(payload: UpdateProfileRequest): Promise<User> {
  await delay();
  const current = await getMockProfileUser();
  await setMockProfileUser({
    ...current,
    name: payload.name.trim(),
    lastName: payload.lastName.trim(),
    avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : current.avatarUrl,
  });
  return await getMockProfileUser();
}

export async function mockUpdateEmail(payload: UpdateEmailRequest): Promise<User> {
  await delay();
  const currentPassword = await getMockUserPassword();
  if (payload.currentPassword !== currentPassword) {
    throw new Error('Contraseña actual incorrecta.');
  }
  const email = payload.email.trim().toLowerCase();
  if (!email.includes('@')) {
    throw new Error('Ingresá un email válido.');
  }
  const current = await getMockProfileUser();
  await setMockProfileUser({ ...current, email });
  return await getMockProfileUser();
}

export async function mockChangePassword(payload: ChangePasswordRequest): Promise<void> {
  await delay();
  const currentPassword = await getMockUserPassword();
  if (payload.currentPassword !== currentPassword) {
    throw new Error('Contraseña actual incorrecta.');
  }
  if (payload.newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }
  await setMockUserPassword(payload.newPassword);
}

export async function mockDeactivateAccount(): Promise<void> {
  await delay(400);
  const current = await getMockProfileUser();
  await setMockProfileUser({ ...current, isActive: false });
}
