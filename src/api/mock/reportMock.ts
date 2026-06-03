import {
  getReportReasonLabel,
  type BuyerReport,
  type ReportStatusResponse,
  type ReportTargetType,
  type SubmitReportRequest,
} from '../reportTypes';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let reportSeq = 3;

const mockReports: BuyerReport[] = [
  {
    id: 'mock-report-1',
    targetType: 'PRODUCT',
    targetId: 'mock-prod-1',
    targetName: 'Remera básica algodón 1',
    reason: 'MISLEADING',
    reasonLabel: 'Información engañosa o incorrecta',
    details: 'La foto no coincide con el producto real.',
    status: 'RESOLVED',
    adminMessage:
      'Revisamos el producto y pedimos al vendedor actualizar las fotos. Gracias por avisar.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    seenByBuyer: true,
  },
  {
    id: 'mock-report-2',
    targetType: 'STORE',
    targetId: 'mock-store-2',
    targetName: 'Moda Sur',
    reason: 'LOCATION_HOURS',
    reasonLabel: 'Ubicación u horarios incorrectos',
    details: null,
    status: 'REVIEWING',
    adminMessage: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
    seenByBuyer: true,
  },
];

function isActiveStatus(status: BuyerReport['status']): boolean {
  return status === 'PENDING' || status === 'REVIEWING';
}

function findActiveReport(targetType: ReportTargetType, targetId: string): BuyerReport | undefined {
  return mockReports.find(
    (r) => r.targetType === targetType && r.targetId === targetId && isActiveStatus(r.status),
  );
}

function createReport(
  targetType: ReportTargetType,
  targetId: string,
  targetName: string,
  body: SubmitReportRequest,
): BuyerReport {
  if (findActiveReport(targetType, targetId)) {
    throw new Error('Ya enviaste un reporte sobre esto. Podés ver el estado en Perfil → Mis reportes.');
  }

  const report: BuyerReport = {
    id: `mock-report-${reportSeq++}`,
    targetType,
    targetId,
    targetName,
    reason: body.reason,
    reasonLabel: getReportReasonLabel(targetType, body.reason),
    details: body.details?.trim() || null,
    status: 'PENDING',
    adminMessage: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    seenByBuyer: false,
  };
  mockReports.unshift(report);
  return report;
}

export async function mockSubmitProductReport(
  productId: string,
  targetName: string,
  body: SubmitReportRequest,
): Promise<BuyerReport> {
  await delay();
  return createReport('PRODUCT', productId, targetName, body);
}

export async function mockSubmitStoreReport(
  storeId: string,
  targetName: string,
  body: SubmitReportRequest,
): Promise<BuyerReport> {
  await delay();
  return createReport('STORE', storeId, targetName, body);
}

export async function mockFetchMyReports(): Promise<BuyerReport[]> {
  await delay(250);
  return [...mockReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function mockFetchUnreadReportCount(): Promise<number> {
  await delay(150);
  return mockReports.filter(
    (r) =>
      !r.seenByBuyer &&
      (r.status === 'RESOLVED' || r.status === 'DISMISSED') &&
      r.adminMessage,
  ).length;
}

export async function mockMarkReportsSeen(): Promise<void> {
  await delay(100);
  for (const r of mockReports) {
    if (r.status === 'RESOLVED' || r.status === 'DISMISSED') {
      r.seenByBuyer = true;
    }
  }
}

export async function mockFetchReportStatus(
  targetType: ReportTargetType,
  targetId: string,
): Promise<ReportStatusResponse> {
  await delay(150);
  const active = findActiveReport(targetType, targetId);
  return {
    hasActiveReport: Boolean(active),
    reportId: active?.id ?? null,
  };
}
