import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Fecha ISO 8601 del backend → dd/MM/yyyy (es-AR). */
export function formatDate(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) {
    return '—';
  }
  return format(date, 'dd/MM/yyyy', { locale: es });
}

/** Fecha y hora compacta para chat y notificaciones. */
export function formatDateTime(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) {
    return '—';
  }
  return format(date, "d MMM · HH:mm", { locale: es });
}

/** Montos en pesos argentinos (número crudo del backend). */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
