import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePaginatedListOptions<T> {
  /** Función que recibe el número de página y devuelve `{ content, totalElements }`. */
  fetcher: (page: number) => Promise<{ content: T[]; totalElements: number }>;
  pageSize: number;
}

interface UsePaginatedListResult<T> {
  items: T[];
  loadingInitial: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  reload: () => void;
}

export function usePaginatedList<T>({
  fetcher,
  pageSize,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const result = await fetcher(pageNum);
        if (!mountedRef.current) return;
        setItems((prev) => (replace ? result.content : [...prev, ...result.content]));
        setPage(pageNum);
        setHasMore(
          result.content.length === pageSize &&
            (pageNum + 1) * pageSize < result.totalElements,
        );
        setError(null);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : 'Error al cargar.');
        if (replace) setItems([]);
      } finally {
        loadingRef.current = false;
      }
    },
    [fetcher, pageSize],
  );

  // Carga inicial
  useEffect(() => {
    void (async () => {
      setLoadingInitial(true);
      await loadPage(0, true);
      if (mountedRef.current) setLoadingInitial(false);
    })();
  }, [loadPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void loadPage(0, true).finally(() => {
      if (mountedRef.current) setRefreshing(false);
    });
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loadingInitial || loadingRef.current) return;
    setLoadingMore(true);
    void loadPage(page + 1, false).finally(() => {
      if (mountedRef.current) setLoadingMore(false);
    });
  }, [hasMore, loadingMore, loadingInitial, loadPage, page]);

  const reload = useCallback(() => {
    setLoadingInitial(true);
    void loadPage(0, true).finally(() => {
      if (mountedRef.current) setLoadingInitial(false);
    });
  }, [loadPage]);

  return { items, loadingInitial, loadingMore, refreshing, error, hasMore, refresh, loadMore, reload };
}
