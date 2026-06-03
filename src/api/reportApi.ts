/**
 * reportApi.ts — Reportes de producto / tienda por el comprador.
 *
 * Backend:
 *   POST /api/buyer/reports/product/{productId}
 *   POST /api/buyer/reports/store/{storeId}
 *   GET  /api/buyer/reports
 *   GET  /api/buyer/reports/unread-count
 *   POST /api/buyer/reports/mark-seen
 *   GET  /api/buyer/reports/product/{productId}/status
 *   GET  /api/buyer/reports/store/{storeId}/status
 */
import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import {
  mockFetchMyReports,
  mockFetchReportStatus,
  mockFetchUnreadReportCount,
  mockMarkReportsSeen,
  mockSubmitProductReport,
  mockSubmitStoreReport,
} from './mock/reportMock';

export type {
  BuyerReport,
  ReportReasonOption,
  ReportStatus,
  ReportStatusResponse,
  ReportTargetType,
  SubmitReportMeta,
  SubmitReportRequest,
} from './reportTypes';

export {
  getReportReasonLabel,
  getReportReasons,
  getReportStatusLabel,
  PRODUCT_REPORT_REASONS,
  STORE_REPORT_REASONS,
} from './reportTypes';

import type {
  BuyerReport,
  ReportStatusResponse,
  SubmitReportMeta,
  SubmitReportRequest,
} from './reportTypes';

export async function submitProductReport(
  productId: string,
  body: SubmitReportRequest,
  meta: SubmitReportMeta,
): Promise<BuyerReport> {
  if (USE_MOCKS) return mockSubmitProductReport(productId, meta.targetName, body);
  return apiClient.post<BuyerReport>(`/api/buyer/reports/product/${productId}`, {
    ...body,
    targetName: meta.targetName,
  });
}

export async function submitStoreReport(
  storeId: string,
  body: SubmitReportRequest,
  meta: SubmitReportMeta,
): Promise<BuyerReport> {
  if (USE_MOCKS) return mockSubmitStoreReport(storeId, meta.targetName, body);
  return apiClient.post<BuyerReport>(`/api/buyer/reports/store/${storeId}`, {
    ...body,
    targetName: meta.targetName,
  });
}

export async function fetchMyReports(): Promise<BuyerReport[]> {
  if (USE_MOCKS) return mockFetchMyReports();
  const raw = await apiClient.get<unknown>('/api/buyer/reports');
  return Array.isArray(raw) ? (raw as BuyerReport[]) : [];
}

export async function fetchUnreadReportCount(): Promise<number> {
  if (USE_MOCKS) return mockFetchUnreadReportCount();
  const raw = await apiClient.get<{ count: number }>('/api/buyer/reports/unread-count');
  return raw.count ?? 0;
}

export async function markReportsSeen(): Promise<void> {
  if (USE_MOCKS) return mockMarkReportsSeen();
  await apiClient.post<void>('/api/buyer/reports/mark-seen', {});
}

export async function fetchProductReportStatus(productId: string): Promise<ReportStatusResponse> {
  if (USE_MOCKS) return mockFetchReportStatus('PRODUCT', productId);
  return apiClient.get<ReportStatusResponse>(
    `/api/buyer/reports/product/${productId}/status`,
  );
}

export async function fetchStoreReportStatus(storeId: string): Promise<ReportStatusResponse> {
  if (USE_MOCKS) return mockFetchReportStatus('STORE', storeId);
  return apiClient.get<ReportStatusResponse>(`/api/buyer/reports/store/${storeId}/status`);
}
