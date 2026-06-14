import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

import { MOCK_DEMO_EMAIL } from './constants';

/** Usuario demo inicial (solo plantilla; el estado vivo es `mockProfileUser`). */
export const MOCK_USER: User = {
  id: 'demo-user-001',
  email: MOCK_DEMO_EMAIL,
  role: 'BUYER',
  name: 'María',
  lastName: 'González',
  avatarUrl: null,
  isActive: true,
};

let mockProfileUser: User = { ...MOCK_USER };
let mockUserPassword = 'demo1234';
let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  try {
    const rawUser = await AsyncStorage.getItem('outletgo_user');
    if (rawUser) {
      mockProfileUser = JSON.parse(rawUser);
    }
    const rawPass = await AsyncStorage.getItem('outletgo_mock_password');
    if (rawPass) {
      mockUserPassword = rawPass;
    }
  } catch (e) {
    console.error('Failed to load mock user state', e);
  }
  isInitialized = true;
}

export async function getMockProfileUser(): Promise<User> {
  await ensureInitialized();
  return { ...mockProfileUser };
}

export async function setMockProfileUser(user: User): Promise<void> {
  mockProfileUser = { ...user };
  isInitialized = true;
  await AsyncStorage.setItem('outletgo_user', JSON.stringify(user)).catch(() => {});
}

export async function getMockUserPassword(): Promise<string> {
  await ensureInitialized();
  return mockUserPassword;
}

export async function setMockUserPassword(password: string): Promise<void> {
  mockUserPassword = password;
  isInitialized = true;
  await AsyncStorage.setItem('outletgo_mock_password', password).catch(() => {});
}

export async function clearMockUserState(): Promise<void> {
  mockProfileUser = { ...MOCK_USER };
  mockUserPassword = 'demo1234';
  isInitialized = false;
  await Promise.all([
    AsyncStorage.removeItem('outletgo_user'),
    AsyncStorage.removeItem('outletgo_mock_password'),
  ]).catch(() => {});
}

export function createMockUserFromTemplate(
  overrides: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'lastName'>,
): User {
  return {
    ...MOCK_USER,
    ...overrides,
  };
}
