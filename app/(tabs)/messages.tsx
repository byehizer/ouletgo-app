import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchConversations, type ConversationListItem } from '../../src/api/chatApi';
import { useAuth } from '../../src/context/AuthContext';
import { useMessages } from '../../src/context/MessagesContext';
import { useConversationsPolling } from '../../src/hooks/useConversationsPolling';
import { formatDateTime } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

function ConversationCard({
  item,
  onPress,
}: {
  item: ConversationListItem;
  onPress: () => void;
}) {
  const hasUnread = item.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Contenido principal */}
      <View style={[styles.cardInner, hasUnread && styles.cardInnerUnread]}>
        {/* Avatar */}
        <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
          <Ionicons name="storefront" size={22} color={Colors.brand.DEFAULT} />
        </View>

        {/* Cuerpo */}
        <View style={styles.cardBody}>
          {/* Fila 1: nombre + hora */}
          <View style={styles.cardTop}>
            <Text
              style={[styles.storeName, hasUnread && styles.storeNameUnread]}
              numberOfLines={1}
            >
              {item.storeName}
            </Text>
            {item.lastMessageAt ? (
              <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                {formatDateTime(item.lastMessageAt)}
              </Text>
            ) : null}
          </View>

          {/* Chip producto */}
          {item.productName ? (
            <View style={styles.productChip}>
              <Ionicons name="pricetag-outline" size={11} color={Colors.brand.dark} />
              <Text style={styles.productHint} numberOfLines={1}>
                {item.productName}
              </Text>
            </View>
          ) : null}

          {/* Fila 2: preview + badge */}
          <View style={styles.previewRow}>
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={2}
            >
              {item.lastMessagePreview ?? 'Sin mensajes todavía'}
            </Text>
            {hasUnread ? (
              <View style={styles.rowBadge}>
                <Text style={styles.rowBadgeText}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { syncConversations } = useMessages();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyList = useCallback(
    (list: ConversationListItem[]) => {
      setConversations(list);
      syncConversations(list);
    },
    [syncConversations],
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const page = await fetchConversations(0, 30);
      applyList(page.content);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las conversaciones.');
    }
  }, [applyList, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !isAuthenticated) {
        const t = setTimeout(() => {
          router.replace(('/(auth)/login?redirect=' + encodeURIComponent('/messages')) as any);
        }, 150);
        return () => clearTimeout(t);
      }
      if (!isAuthenticated) return;

      setFocused(true);
      void (async () => {
        setLoading(true);
        await load();
        setLoading(false);
      })();
      return () => setFocused(false);
    }, [load, authLoading, isAuthenticated]),
  );

  useConversationsPolling({
    enabled: focused && isAuthenticated,
    onUpdate: applyList,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (authLoading || !isAuthenticated || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={Colors.brand.DEFAULT}
          />
        }
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyList : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.brand.DEFAULT} />
            </View>
            <Text style={styles.emptyTitle}>Sin conversaciones</Text>
            <Text style={styles.emptyBody}>
              Cuando escribas a una tienda desde un producto o su perfil, el chat va a aparecer
              acá.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {conversations.length > 0 ? (
              <Text style={styles.listHint}>
                {conversations.length === 1
                  ? '1 conversación'
                  : `${conversations.length} conversaciones`}
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <ConversationCard
            item={item}
            onPress={() =>
              router.push({
                pathname: '/messages/[conversationId]',
                params: { conversationId: item.id },
              })
            }
          />
        )}
      />
    </View>
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
    backgroundColor: Colors.surface.base,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  listHint: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 12,
    marginTop: 4,
  },
  separator: {
    height: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.surface.card,
  },
  cardInnerUnread: {
    backgroundColor: Colors.brand.bgLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  avatarUnread: {
    borderColor: Colors.brand.light,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  storeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  storeNameUnread: {
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  time: {
    fontSize: 12,
    color: Colors.text.muted,
    flexShrink: 0,
  },
  timeUnread: {
    color: Colors.brand.DEFAULT,
    fontWeight: '600',
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.brand.bgLight,
  },
  productHint: {
    fontSize: 11,
    color: Colors.brand.dark,
    fontWeight: '500',
    maxWidth: 200,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  previewUnread: {
    color: Colors.text.primary,
    fontWeight: '500',
  },
  rowBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  rowBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  errorBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.danger.bg,
    borderWidth: 1,
    borderColor: Colors.danger.DEFAULT,
  },
  errorText: {
    color: Colors.danger.text,
    fontSize: 13,
  },
});
