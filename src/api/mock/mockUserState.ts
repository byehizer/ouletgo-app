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

export function getMockProfileUser(): User {
  return { ...mockProfileUser };
}

export function setMockProfileUser(user: User): void {
  mockProfileUser = { ...user };
}

export function createMockUserFromTemplate(
  overrides: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'lastName'>,
): User {
  return {
    ...MOCK_USER,
    ...overrides,
  };
}
