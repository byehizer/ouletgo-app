import type { StoreSchedule } from '../api/storeApi';

/** Misma zona que el backend Java (`ZoneId.of("America/Argentina/Buenos_Aires")`). */
export const STORE_TIMEZONE = 'America/Argentina/Buenos_Aires';

const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

const WEEKDAY_TO_JAVA: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** Etiqueta en español para `dayOfWeek` (Java DayOfWeek: 1=Lunes … 7=Domingo). */
export function getDayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? `Día ${dayOfWeek}`;
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Hora y día de la semana en Argentina (para schedule y badge "hoy"). */
export function getStoreLocalParts(at: Date = new Date()): {
  dayOfWeek: number;
  minutesOfDay: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

  if (hour === 24) hour = 0;

  return {
    dayOfWeek: WEEKDAY_TO_JAVA[weekday] ?? 1,
    minutesOfDay: hour * 60 + minute,
  };
}

/** Indica si la tienda está abierta según `StoreSchedule` (1 fila/día, hora Argentina). */
export function isStoreOpenNow(schedule: StoreSchedule[], at: Date = new Date()): boolean {
  const { dayOfWeek, minutesOfDay } = getStoreLocalParts(at);
  const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek);
  if (!entry?.isOpen || !entry.openTime || !entry.closeTime) return false;

  const openMin = parseTimeToMinutes(entry.openTime);
  const closeMin = parseTimeToMinutes(entry.closeTime);
  if (openMin == null || closeMin == null) return false;

  return minutesOfDay >= openMin && minutesOfDay < closeMin;
}

export function formatScheduleSlot(entry: StoreSchedule): string {
  if (!entry.isOpen || !entry.openTime || !entry.closeTime) {
    return 'Cerrado';
  }
  return `${entry.openTime} – ${entry.closeTime}`;
}
