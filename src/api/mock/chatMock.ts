import type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
} from '../chatApi';

const now = Date.now();

const conversations: ConversationDetail[] = [
  {
    id: 'conv-1',
    storeId: 'store-1',
    storeName: 'Outlet Textil Avellaneda',
    storeLogoUrl: null,
    productId: 'p1',
    productName: 'Remera básica algodón',
    lastMessagePreview: '¡Hola! Sí, tenemos talle M en negro.',
    lastMessageAt: new Date(now - 15 * 60_000).toISOString(),
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    storeId: 'store-2',
    storeName: 'Moda Sur',
    storeLogoUrl: null,
    productId: null,
    productName: null,
    lastMessagePreview: 'El envío lo coordina OutletGo cuando pagues.',
    lastMessageAt: new Date(now - 2 * 3600_000).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    storeId: 'store-3',
    storeName: 'Urban Sneakers',
    storeLogoUrl: null,
    productId: 'p5',
    productName: 'Zapatilla urbana',
    lastMessagePreview: 'Te paso foto del modelo en vitrina.',
    lastMessageAt: new Date(now - 26 * 3600_000).toISOString(),
    unreadCount: 1,
  },
];

const messagesByConversation: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm1-1',
      conversationId: 'conv-1',
      senderRole: 'BUYER',
      body: 'Hola, ¿tienen la remera en talle M negro?',
      imageUrl: null,
      createdAt: new Date(now - 45 * 60_000).toISOString(),
    },
    {
      id: 'm1-2',
      conversationId: 'conv-1',
      senderRole: 'SELLER',
      body: '¡Hola! Sí, tenemos talle M en negro.',
      imageUrl: null,
      createdAt: new Date(now - 15 * 60_000).toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'm2-1',
      conversationId: 'conv-2',
      senderRole: 'BUYER',
      body: '¿Puedo retirar yo en la tienda?',
      imageUrl: null,
      createdAt: new Date(now - 3 * 3600_000).toISOString(),
    },
    {
      id: 'm2-2',
      conversationId: 'conv-2',
      senderRole: 'SELLER',
      body: 'El envío lo coordina OutletGo cuando pagues.',
      imageUrl: null,
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
    },
  ],
  'conv-3': [
    {
      id: 'm3-1',
      conversationId: 'conv-3',
      senderRole: 'SELLER',
      body: 'Te paso foto del modelo en vitrina.',
      imageUrl: 'https://picsum.photos/seed/outletgo-sneaker/400/300',
      createdAt: new Date(now - 26 * 3600_000).toISOString(),
    },
  ],
};

let messageSeq = 100;

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockFetchConversations(
  page: number,
  size: number,
): Promise<{ content: ConversationListItem[]; totalElements: number }> {
  await delay();
  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
  );
  const start = page * size;
  const content = sorted.slice(start, start + size).map((c) => ({
    id: c.id,
    storeId: c.storeId,
    storeName: c.storeName,
    storeLogoUrl: c.storeLogoUrl,
    productId: c.productId,
    productName: c.productName,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unreadCount,
  }));
  return { content, totalElements: conversations.length };
}

export async function mockFetchConversation(
  conversationId: string,
): Promise<ConversationDetail | null> {
  await delay();
  return conversations.find((c) => c.id === conversationId) ?? null;
}

export async function mockFetchMessages(
  conversationId: string,
  since?: string,
): Promise<ChatMessage[]> {
  await delay(120);
  const all = messagesByConversation[conversationId] ?? [];
  if (!since) return [...all];
  const sinceMs = new Date(since).getTime();
  return all.filter((m) => new Date(m.createdAt).getTime() > sinceMs);
}

export async function mockSendMessage(
  conversationId: string,
  payload: { body?: string; imageUrl?: string },
): Promise<ChatMessage> {
  await delay(250);
  const msg: ChatMessage = {
    id: `m-mock-${++messageSeq}`,
    conversationId,
    senderRole: 'BUYER',
    body: payload.body ?? null,
    imageUrl: payload.imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  if (!messagesByConversation[conversationId]) {
    messagesByConversation[conversationId] = [];
  }
  messagesByConversation[conversationId].push(msg);

  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessagePreview = payload.body ?? '📷 Imagen';
    conv.lastMessageAt = msg.createdAt;
    conv.unreadCount = 0;
  }

  // Simular respuesta automática del vendedor en demo
  setTimeout(() => {
    const reply: ChatMessage = {
      id: `m-mock-${++messageSeq}`,
      conversationId,
      senderRole: 'SELLER',
      body: 'Gracias por tu mensaje. Te respondemos en breve.',
      imageUrl: null,
      createdAt: new Date().toISOString(),
    };
    messagesByConversation[conversationId]?.push(reply);
    if (conv) {
      conv.lastMessagePreview = reply.body;
      conv.lastMessageAt = reply.createdAt;
      conv.unreadCount = 1;
    }
  }, 2500);

  return msg;
}

export async function mockMarkConversationRead(conversationId: string): Promise<void> {
  await delay(80);
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) conv.unreadCount = 0;
}

export async function mockStartConversation(
  storeId: string,
  productId?: string | null,
): Promise<ConversationDetail> {
  await delay();
  const existing = conversations.find(
    (c) => c.storeId === storeId && c.productId === (productId ?? null),
  );
  if (existing) return existing;

  const id = `conv-new-${++messageSeq}`;
  const conv: ConversationDetail = {
    id,
    storeId,
    storeName:
      storeId === 'store-1'
        ? 'Outlet Textil Avellaneda'
        : storeId === 'store-2'
          ? 'Moda Sur'
          : 'Tienda',
    storeLogoUrl: null,
    productId: productId ?? null,
    productName: productId ? 'Producto consultado' : null,
    lastMessagePreview: null,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  };
  conversations.push(conv);
  messagesByConversation[id] = [];
  return conv;
}
