/**
 * Estado global de conversaciones / no leídos para el badge del tab Mensajes.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { fetchConversations, type ConversationListItem } from '../api/chatApi';
import { CONV_POLL_INTERVAL_MS } from '../hooks/useConversationsPolling';
import { useAuth } from './AuthContext';

export interface UnreadMessagesStats {
  /** Suma de unreadCount en todas las conversaciones. */
  totalUnreadCount: number;
  /** Cantidad de tiendas (conversaciones) con al menos un mensaje sin leer. */
  unreadStoreCount: number;
}

export function getUnreadStats(conversations: ConversationListItem[]): UnreadMessagesStats {
  let totalUnreadCount = 0;
  let unreadStoreCount = 0;
  for (const c of conversations) {
    if (c.unreadCount > 0) {
      unreadStoreCount += 1;
      totalUnreadCount += c.unreadCount;
    }
  }
  return { totalUnreadCount, unreadStoreCount };
}

interface MessagesContextValue extends UnreadMessagesStats {
  refresh: () => Promise<void>;
  /** Sincroniza desde la pantalla Mensajes (evita doble fetch al estar en foco). */
  syncConversations: (conversations: ConversationListItem[]) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<UnreadMessagesStats>({
    totalUnreadCount: 0,
    unreadStoreCount: 0,
  });
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  const applyConversations = useCallback((list: ConversationListItem[]) => {
    setStats(getUnreadStats(list));
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStats({ totalUnreadCount: 0, unreadStoreCount: 0 });
      return;
    }
    try {
      const page = await fetchConversations(0, 30);
      if (mountedRef.current) applyConversations(page.content);
    } catch {
      // Mantener último valor conocido
    }
  }, [isAuthenticated, applyConversations]);

  const syncConversations = useCallback(
    (conversations: ConversationListItem[]) => {
      applyConversations(conversations);
    },
    [applyConversations],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      pollingRef.current = null;
      if (!isAuthenticated) {
        setStats({ totalUnreadCount: 0, unreadStoreCount: 0 });
      }
      return;
    }

    void refresh();

    const scheduleNext = () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      pollingRef.current = setTimeout(() => {
        void (async () => {
          await refresh();
          if (mountedRef.current && isAuthenticated) scheduleNext();
        })();
      }, CONV_POLL_INTERVAL_MS);
    };

    scheduleNext();
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      pollingRef.current = null;
    };
  }, [authLoading, isAuthenticated, refresh]);

  const value = useMemo<MessagesContextValue>(
    () => ({
      ...stats,
      refresh,
      syncConversations,
    }),
    [stats, refresh, syncConversations],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error('useMessages debe usarse dentro de MessagesProvider');
  }
  return ctx;
}

/** Texto del badge del tab: prioriza mensajes no leídos; si no hay, tiendas. */
export function formatMessagesTabBadge(stats: UnreadMessagesStats): string | undefined {
  const n = stats.totalUnreadCount > 0 ? stats.totalUnreadCount : stats.unreadStoreCount;
  if (n <= 0) return undefined;
  return n > 99 ? '99+' : String(n);
}
