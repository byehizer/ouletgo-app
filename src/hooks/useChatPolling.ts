import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CHAT_POLL_INTERVAL_MS,
  fetchMessages,
  getLatestMessageTimestamp,
  markConversationRead,
  mergeChatMessages,
  sendImageMessage,
  sendTextMessage,
  type ChatMessage,
} from '../api/chatApi';

interface UseChatPollingOptions {
  conversationId: string;
  /** Pausar polling (p. ej. pantalla sin foco). */
  enabled?: boolean;
}

export function useChatPolling({ conversationId, enabled = true }: UseChatPollingOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs de control de ciclo de vida — no triggerean re-renders
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // ─── Carga inicial ────────────────────────────────────────────────────────

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoadingInitial(true);
    setError(null);
    try {
      const list = await fetchMessages(conversationId, { limit: 100 });
      if (!mountedRef.current) return;
      setMessages(list);
      await markConversationRead(conversationId);
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los mensajes.');
      }
    } finally {
      if (mountedRef.current) setLoadingInitial(false);
    }
  }, [conversationId]);

  // ─── Polling con setTimeout recursivo (evita superposición de requests) ──

  const pollNewMessages = useCallback(async () => {
    if (!conversationId || !mountedRef.current) return;
    try {
      const since = getLatestMessageTimestamp(messagesRef.current);
      const incoming = await fetchMessages(conversationId, { since, limit: 100 });
      if (!mountedRef.current) return;
      if (incoming.length > 0) {
        setMessages((prev) => mergeChatMessages(prev, incoming));
      }
      setError(null);
    } catch {
      // Polling silencioso; el error de carga inicial ya se mostró
    }
  }, [conversationId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // pollNewMessages y scheduleNext se referencian mutuamente a través de refs
  // para evitar dependencias circulares en useCallback.
  const pollNewMessagesRef = useRef(pollNewMessages);
  pollNewMessagesRef.current = pollNewMessages;

  const scheduleNextRef = useRef<() => void>(() => undefined);

  const scheduleNext = useCallback(() => {
    stopPolling();
    pollingRef.current = setTimeout(() => {
      void (async () => {
        await pollNewMessagesRef.current();
        if (mountedRef.current) scheduleNextRef.current();
      })();
    }, CHAT_POLL_INTERVAL_MS);
  }, [stopPolling]);

  scheduleNextRef.current = scheduleNext;

  // ─── Montaje / desmontaje ─────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Carga inicial al cambiar conversación ────────────────────────────────

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  // ─── Arrancar / parar polling (espera a que cargue la lista inicial) ──────

  useEffect(() => {
    if (!enabled || !conversationId || loadingInitial) {
      stopPolling();
      return;
    }
    scheduleNext();
    return stopPolling;
  }, [enabled, conversationId, loadingInitial, scheduleNext, stopPolling]);

  // ─── Acciones de envío ────────────────────────────────────────────────────

  const sendText = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      setSending(true);
      setError(null);
      try {
        const msg = await sendTextMessage(conversationId, text);
        setMessages((prev) => mergeChatMessages(prev, [msg]));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje.');
        throw e;
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const sendImage = useCallback(
    async (uri: string) => {
      if (!conversationId) return;
      setSending(true);
      setError(null);
      try {
        const msg = await sendImageMessage(conversationId, uri);
        setMessages((prev) => mergeChatMessages(prev, [msg]));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo enviar la imagen.');
        throw e;
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  return { messages, loadingInitial, sending, error, sendText, sendImage, refresh };
}
