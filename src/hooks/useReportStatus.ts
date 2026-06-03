import { useCallback, useEffect, useState } from 'react';

import {
  fetchProductReportStatus,
  fetchStoreReportStatus,
  type ReportTargetType,
} from '../api/reportApi';

interface UseReportStatusResult {
  hasActiveReport: boolean;
  refresh: () => void;
}

export function useReportStatus(
  targetType: ReportTargetType,
  targetId: string,
): UseReportStatusResult {
  const [hasActiveReport, setHasActiveReport] = useState(false);

  const refresh = useCallback(() => {
    if (!targetId) return;
    const fn =
      targetType === 'PRODUCT'
        ? fetchProductReportStatus(targetId)
        : fetchStoreReportStatus(targetId);
    void fn
      .then((s) => setHasActiveReport(s.hasActiveReport))
      .catch(() => setHasActiveReport(false));
  }, [targetType, targetId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { hasActiveReport, refresh };
}
