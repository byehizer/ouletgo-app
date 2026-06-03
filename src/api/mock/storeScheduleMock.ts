import type { StoreSchedule } from '../storeApi';

/** Horario base demo — alineado con entidad `StoreSchedule` del backend. */
export const DEFAULT_STORE_SCHEDULE: StoreSchedule[] = [
  { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00' },
  { dayOfWeek: 7, isOpen: false, openTime: null, closeTime: null },
];

/** Por tienda en demo — variación para probar filtro "abiertas ahora". */
export const MOCK_STORE_SCHEDULES: Record<string, StoreSchedule[]> = {
  'mock-store-1': DEFAULT_STORE_SCHEDULE,
  'mock-store-2': DEFAULT_STORE_SCHEDULE,
  'mock-store-3': DEFAULT_STORE_SCHEDULE,
  'mock-store-4': [
    { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '19:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '19:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '10:00', closeTime: '19:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '10:00', closeTime: '19:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '10:00', closeTime: '19:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '14:00' },
    { dayOfWeek: 7, isOpen: false, openTime: null, closeTime: null },
  ],
  /** Horario nocturno para contrastar en filtros (ej. cerrada de madrugada). */
  'mock-store-5': [
    { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 7, isOpen: true, openTime: '10:00', closeTime: '16:00' },
  ],
};

export function getMockStoreSchedule(storeId: string): StoreSchedule[] {
  return MOCK_STORE_SCHEDULES[storeId] ?? DEFAULT_STORE_SCHEDULE;
}
