/**
 * chatApi.ts — Chat comprador ↔ vendedor (polling).
 *
 * Backend:
 *   GET  /api/buyer/conversations?page=&size=
 *   GET  /api/buyer/conversations/{id}
 *   GET  /api/buyer/conversations/{id}/messages?since=&limit=
 *   POST /api/buyer/conversations/{id}/messages        { body } | multipart image
 *   POST /api/buyer/conversations/{id}/read
 *   POST /api/buyer/conversations/start                { storeId, productId? }
 */
import { apiClient, normalizePage } from './client';
import { USE_MOCKS } from '../config/env';
import { uploadChatImage } from '../lib/imageUpload';
import {
  mockFetchConversation,
  mockFetchConversations,
  mockFetchMessages,
  mockMarkConversationRead,
  mockSendMessage,
  mockStartConversation,
} from './mock/chatMock';

import type { Page } from './types';

/** Intervalo de polling en la sala de chat (ms). */
export const CHAT_POLL_INTERVAL_MS = 4000;

export type MessageSenderRole = 'BUYER' | 'SELLER';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  body: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ConversationListItem {
  id: string;
  storeId: string;
  storeName: string;
  storeLogoUrl: string | null;
  productId: string | null;
  productName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export type ConversationDetail = ConversationListItem;

export interface StartConversationRequest {
  storeId: string;
  productId?: string | null;
}

export async function fetchConversations(
  page = 0,
  size = 20,
): Promise<Page<ConversationListItem>> {
  if (USE_MOCKS) {
    const raw = await mockFetchConversations(page, size);
    return normalizePage<ConversationListItem>(raw);
  }

  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('size', String(size));
  const raw = await apiClient.get<unknown>(`/api/buyer/conversations?${sp.toString()}`);
  return normalizePage<ConversationListItem>(raw);
}

export async function fetchConversation(
  conversationId: string,
): Promise<ConversationDetail> {
  if (USE_MOCKS) {
    const conv = await mockFetchConversation(conversationId);
    if (!conv) throw new Error('Conversación no encontrada.');
    return conv;
  }

  return apiClient.get<ConversationDetail>(`/api/buyer/conversations/${conversationId}`);
}

export async function fetchMessages(
  conversationId: string,
  options?: { since?: string; limit?: number },
): Promise<ChatMessage[]> {
  if (USE_MOCKS) {
    return mockFetchMessages(conversationId, options?.since);
  }

  const sp = new URLSearchParams();
  if (options?.since) sp.set('since', options.since);
  if (options?.limit) sp.set('limit', String(options.limit));
  const qs = sp.toString();
  const path = `/api/buyer/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`;
  const raw = await apiClient.get<unknown>(path);
  if (Array.isArray(raw)) return raw as ChatMessage[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { content: unknown }).content)) {
    return (raw as { content: ChatMessage[] }).content;
  }
  return [];
}

export async function sendTextMessage(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Escribí un mensaje.');
  }

  if (USE_MOCKS) {
    return mockSendMessage(conversationId, { body: trimmed });
  }

  return apiClient.post<ChatMessage>(`/api/buyer/conversations/${conversationId}/messages`, {
    body: trimmed,
  });
}

export async function sendImageMessage(
  conversationId: string,
  localUri: string,
): Promise<ChatMessage> {
  const { url } = await uploadChatImage(localUri);

  if (USE_MOCKS) {
    return mockSendMessage(conversationId, { imageUrl: url });
  }

  return apiClient.post<ChatMessage>(`/api/buyer/conversations/${conversationId}/messages`, {
    imageUrl: url,
  });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (USE_MOCKS) {
    await mockMarkConversationRead(conversationId);
    return;
  }

  await apiClient.post(`/api/buyer/conversations/${conversationId}/read`, {});
}

export async function startConversation(
  payload: StartConversationRequest,
): Promise<ConversationDetail> {
  if (USE_MOCKS) {
    return mockStartConversation(payload.storeId, payload.productId);
  }

  return apiClient.post<ConversationDetail>('/api/buyer/conversations/start', payload);
}

/** Fusiona mensajes por id (para polling incremental). */
export function mergeChatMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function getLatestMessageTimestamp(messages: ChatMessage[]): string | undefined {
  if (messages.length === 0) return undefined;
  return messages[messages.length - 1]?.createdAt;
}
