import type { AuthResponse, User } from '../types';

import { MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD, MOCK_TOKEN } from './constants';
import { createMockUserFromTemplate, getMockProfileUser } from './mockUserState';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export { MOCK_USER } from './mockUserState';

export function isMockToken(token: string | null | undefined): boolean {
  return token === MOCK_TOKEN;
}

export async function mockLogin(email: string, password: string): Promise<AuthResponse> {
  await delay();
  if (email === MOCK_DEMO_EMAIL && password === MOCK_DEMO_PASSWORD) {
    return { token: MOCK_TOKEN, user: getMockProfileUser() };
  }
  throw new Error('Credenciales inválidas. En modo demo usá demo@outletgo.com / demo1234');
}

export async function mockRegister(data: {
  name: string;
  lastName: string;
  email: string;
}): Promise<AuthResponse> {
  await delay();
  const user = createMockUserFromTemplate({
    id: `demo-user-${Date.now()}`,
    email: data.email,
    name: data.name,
    lastName: data.lastName,
  });
  return { token: MOCK_TOKEN, user };
}

export async function mockFetchMe(): Promise<User> {
  await delay(200);
  return getMockProfileUser();
}

export async function mockRecoverPassword(): Promise<void> {
  await delay();
}

export async function mockGoogleLogin(): Promise<AuthResponse> {
  await delay(600);
  return { token: MOCK_TOKEN, user: getMockProfileUser() };
}
