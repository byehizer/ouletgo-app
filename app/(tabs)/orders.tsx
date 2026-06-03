import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchOrders, type OrderListItem } from '../../src/api/orderApi';
import { SHIPPING_METHOD_LABELS } from '../../src/api/types';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { OrderStatusBadge } from '../../src/components/OrderStatusBadge';
import { usePaginatedList } from '../../src/hooks/usePaginatedList';
import { formatARS, formatDate } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

const PAGE_SIZE = 10;

function OrderListCard({ order, onPress }: { order: OrderListItem; onPress: () => void }) {
  const storeLabel = order.storeCount === 1 ? '1 tienda' : `${order.storeCount} tiendas`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>
            #{order.id.replace('ORD-MOCK-', '').replace('ORD-', '')}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <OrderStatusBadge status={order.status} compact />
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          {storeLabel} · {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
        </Text>
        <Text style={styles.metaText}>{SHIPPING_METHOD_LABELS[order.shippingMethod]}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatARS(order.totalPrice)}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const fetcher = useCallback(
    (page: number) => fetchOrders(page, PAGE_SIZE),
    [],
  );
  const {
    items: orders,
    loadingInitial,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
  } = usePaginatedList<OrderListItem>({ fetcher, pageSize: PAGE_SIZE });

  if (loadingInitial) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.brand.DEFAULT}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Todavía no tenés pedidos"
            body="Cuando compres en OutletGo, acá vas a ver el historial y el seguimiento de cada compra."
            actionLabel="Explorar productos"
            onAction={() => router.push('/(tabs)')}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.brand.DEFAULT} />
          ) : null
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OrderListCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />
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
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 2,
  },
  cardMeta: {
    gap: 4,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  errorBox: {
    backgroundColor: Colors.danger.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.danger.text,
    fontSize: 13,
  },
});
