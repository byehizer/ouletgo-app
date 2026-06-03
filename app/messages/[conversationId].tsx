import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMessages } from '../../src/context/MessagesContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchConversation, type ConversationDetail } from '../../src/api/chatApi';
import { ChatComposer } from '../../src/components/ChatComposer';
import { MessageBubble } from '../../src/components/MessageBubble';
import { useChatPolling } from '../../src/hooks/useChatPolling';
import { Colors } from '../../src/theme/colors';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = typeof conversationId === 'string' ? conversationId : '';
  const listRef = useRef<FlatList>(null);
  const [focused, setFocused] = useState(true);
  const [meta, setMeta] = useState<ConversationDetail | null>(null);
  const { refresh: refreshUnreadBadge } = useMessages();

  const { messages, loadingInitial, sending, error, sendText, sendImage } = useChatPolling({
    conversationId: id,
    enabled: focused && Boolean(id),
  });

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const conv = await fetchConversation(id);
        setMeta(conv);
      } catch {
        setMeta(null);
      }
    })();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        void refreshUnreadBadge();
      };
    }, [refreshUnreadBadge]),
  );

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Conversación inválida.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: meta?.storeName ?? 'Chat' }} />
      <View style={styles.container}>
        {meta?.productName ? (
          <View style={styles.contextBanner}>
            <Ionicons name="pricetag-outline" size={16} color={Colors.brand.dark} />
            <Text style={styles.contextText} numberOfLines={1}>
              Consulta sobre: {meta.productName}
            </Text>
          </View>
        ) : null}

        {loadingInitial ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={[
              styles.messageList,
              { paddingTop: 12, paddingBottom: 8 },
            ]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  Escribí tu primer mensaje a la tienda.
                </Text>
              </View>
            }
          />
        )}

        {error ? (
          <View style={styles.errorStrip}>
            <Text style={styles.errorStripText}>{error}</Text>
          </View>
        ) : null}

        <ChatComposer
          onSendText={sendText}
          onSendImage={sendImage}
          sending={sending}
          disabled={loadingInitial}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.brand.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    color: Colors.brand.dark,
    fontWeight: '500',
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 4,
  },
  emptyChat: {
    padding: 32,
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  errorStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.danger.bg,
  },
  errorStripText: {
    fontSize: 13,
    color: Colors.danger.text,
  },
  errorText: {
    color: Colors.danger.text,
    fontSize: 14,
  },
});
