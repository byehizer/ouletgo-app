/** Tipos y motivos de reporte (sin dependencias de API ni mocks). */

export type ReportTargetType = 'PRODUCT' | 'STORE';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export interface ReportReasonOption {
  id: string;
  label: string;
}

export const PRODUCT_REPORT_REASONS: ReportReasonOption[] = [
  { id: 'MISLEADING', label: 'Información engañosa o incorrecta' },
  { id: 'PROHIBITED', label: 'Producto prohibido o ilegal' },
  { id: 'INAPPROPRIATE_MEDIA', label: 'Imágenes inapropiadas' },
  { id: 'PRICE_STOCK', label: 'Precio o stock incorrecto' },
  { id: 'OTHER', label: 'Otro motivo' },
];

export const STORE_REPORT_REASONS: ReportReasonOption[] = [
  { id: 'FALSE_INFO', label: 'Información falsa de la tienda' },
  { id: 'INAPPROPRIATE', label: 'Comportamiento inapropiado' },
  { id: 'PROHIBITED_PRODUCTS', label: 'Vende productos no permitidos' },
  { id: 'LOCATION_HOURS', label: 'Ubicación u horarios incorrectos' },
  { id: 'OTHER', label: 'Otro motivo' },
];

export function getReportReasons(targetType: ReportTargetType): ReportReasonOption[] {
  return targetType === 'PRODUCT' ? PRODUCT_REPORT_REASONS : STORE_REPORT_REASONS;
}

export function getReportReasonLabel(
  targetType: ReportTargetType,
  reasonId: string,
): string {
  const found = getReportReasons(targetType).find((r) => r.id === reasonId);
  return found?.label ?? reasonId;
}

export interface SubmitReportRequest {
  reason: string;
  details?: string;
}

export interface SubmitReportMeta {
  targetName: string;
}

export interface BuyerReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  reason: string;
  reasonLabel: string;
  details: string | null;
  status: ReportStatus;
  adminMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
  seenByBuyer: boolean;
}

export interface ReportStatusResponse {
  hasActiveReport: boolean;
  reportId: string | null;
}

export function getReportStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'REVIEWING':
      return 'En revisión';
    case 'RESOLVED':
      return 'Resuelto';
    case 'DISMISSED':
      return 'Desestimado';
    default:
      return status;
  }
}
