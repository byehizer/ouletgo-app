/**
 * Refresca la lista de conversaciones cada CONV_POLL_INTERVAL_MS mientras el
 * tab Mensajes está en foco. Permite actualizar el badge de no leídos sin
 * que el usuario tenga que hacer pull-to-refresh manualmente.
 *
 * Usa el mismo patrón de setTimeout recursivo que useChatPolling para evitar
 * superposición de requests si la red es lenta.
 */
import { useCallback, useEffect, useRef } from 'react';

import { fetchConversations, type ConversationListItem } from '../api/chatApi';

/** Intervalo del polling de la lista (menos agresivo que el de la sala). */
export const CONV_POLL_INTERVAL_MS = 15_000;

interface UseConversationsPollingOptions {
  enabled: boolean;
  onUpdate: (conversations: ConversationListItem[]) => void;
}

export function useConversationsPolling({
  enabled,
  onUpdate,
}: UseConversationsPollingOptions) {
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const scheduleNextRef = useRef<() => void>(() => undefined);

  const scheduleNext = useCallback(() => {
    stopPolling();
    pollingRef.current = setTimeout(() => {
      void (async () => {
        if (!mountedRef.current) return;
        try {
          const page = await fetchConversations(0, 30);
          if (mountedRef.current) {
            onUpdateRef.current(page.content);
          }
        } catch {
          // Silencioso: la lista ya cargada sigue visible
        }
        if (mountedRef.current) scheduleNextRef.current();
      })();
    }, CONV_POLL_INTERVAL_MS);
  }, [stopPolling]);

  scheduleNextRef.current = scheduleNext;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }
    scheduleNext();
    return stopPolling;
  }, [enabled, scheduleNext, stopPolling]);
}
