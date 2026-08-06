import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';

export interface UserAddress {
  id: string;
  name: string;
  street: string;
  number: string;
  apartment: string | null;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressRequest {
  name: string;
  street: string;
  number: string;
  apartment?: string | null;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateLogisticsRequest {
  type: 'PICKUP' | 'DELIVERY';
  referenceId: string;
}

// MOCKS LOCALES
let mockAddresses: UserAddress[] = [
  {
    id: 'addr-1',
    name: 'Casa',
    street: 'Av. Corrientes',
    number: '1234',
    apartment: '3B',
    postalCode: '1043',
    city: 'CABA',
    latitude: -34.6037,
    longitude: -58.3816,
    isDefault: true,
    createdAt: '2026-05-01T12:00:00Z',
  },
  {
    id: 'addr-2',
    name: 'Trabajo',
    street: 'Thames',
    number: '1540',
    apartment: null,
    postalCode: '1414',
    city: 'CABA',
    latitude: -34.588,
    longitude: -58.432,
    isDefault: false,
    createdAt: '2026-06-15T09:30:00Z',
  },
];

export async function fetchUserAddresses(): Promise<UserAddress[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return [...mockAddresses];
  }
  try {
    return await apiClient.get<UserAddress[]>('/api/buyer/addresses');
  } catch (err) {
    console.warn('Error backend en /api/buyer/addresses, usando fallback:', err);
    return [...mockAddresses];
  }
}

export async function createUserAddress(payload: CreateAddressRequest): Promise<UserAddress> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400));
    const newAddress: UserAddress = {
      id: `addr-${Date.now()}`,
      name: payload.name,
      street: payload.street,
      number: payload.number,
      apartment: payload.apartment ?? null,
      postalCode: payload.postalCode,
      city: payload.city,
      latitude: payload.latitude,
      longitude: payload.longitude,
      isDefault: payload.isDefault ?? false,
      createdAt: new Date().toISOString(),
    };
    if (newAddress.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    mockAddresses.push(newAddress);
    return newAddress;
  }
  return apiClient.post<UserAddress>('/api/buyer/addresses', payload);
}

export async function updateUserAddress(id: string, payload: Partial<CreateAddressRequest>): Promise<UserAddress> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    const idx = mockAddresses.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Dirección no encontrada.');
    const updated = {
      ...mockAddresses[idx],
      ...payload,
    } as UserAddress;
    if (payload.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    mockAddresses[idx] = updated;
    return updated;
  }
  return apiClient.put<UserAddress>(`/api/buyer/addresses/${id}`, payload);
}

export async function deleteUserAddress(id: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200));
    mockAddresses = mockAddresses.filter((a) => a.id !== id);
    return;
  }
  await apiClient.delete<void>(`/api/buyer/addresses/${id}`);
}

export async function updateLogisticsPreference(payload: UpdateLogisticsRequest): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 250));
    return;
  }
  await apiClient.put<void>('/api/buyer/me/logistics-preference', payload);
}
