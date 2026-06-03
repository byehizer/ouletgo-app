import { router } from 'expo-router';

import { startConversation } from '../api/chatApi';

/** Abre o crea una conversación con una tienda y navega a la sala de chat. */
export async function openChatWithStore(
  storeId: string,
  productId?: string | null,
): Promise<void> {
  const conv = await startConversation({ storeId, productId });
  router.push({
    pathname: '/messages/[conversationId]',
    params: { conversationId: conv.id },
  });
}
