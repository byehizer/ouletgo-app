import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
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
import { SHIPPING_METHOD_LABELS, SHIPPING_METHOD_ICONS } from '../../src/api/types';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { OrderStatusBadge } from '../../src/components/OrderStatusBadge';
import { usePaginatedList } from '../../src/hooks/usePaginatedList';
import { formatARS, formatDate } from '../../src/lib/format';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';

const PAGE_SIZE = 10;

function getShortOrderId(id: string): string {
  if (id.startsWith('ORD-MOCK-')) {
    return id.replace('ORD-MOCK-', '');
  }
  if (id.startsWith('ORD-')) {
    return id.replace('ORD-', '');
  }
  if (id.includes('-') && id.length > 20) {
    return id.split('-')[0]?.toUpperCase() ?? id.slice(0, 8).toUpperCase();
  }
  return id.slice(0, 8).toUpperCase();
}

function OrderListCard({ order, onPress }: { order: OrderListItem; onPress: () => void }) {
  const storeLabel = order.storeCount === 1 ? '1 tienda' : `${order.storeCount} tiendas`;
  const shortId = getShortOrderId(order.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Cabecera del pedido (Gris claro) */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>Pedido #{shortId}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <OrderStatusBadge status={order.status} compact />
      </View>

      {/* Cuerpo del pedido (Blanco con datos de tiendas e items con iconos) */}
      <View style={styles.cardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="storefront-outline" size={15} color={Colors.text.secondary} />
          <Text style={styles.metaText}>{storeLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="shirt-outline" size={15} color={Colors.text.secondary} />
          <Text style={styles.metaText}>
            {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={SHIPPING_METHOD_ICONS[order.shippingMethod] as any} size={15} color={Colors.text.secondary} />
          <Text style={styles.metaText}>{SHIPPING_METHOD_LABELS[order.shippingMethod]}</Text>
        </View>
      </View>

      {/* Pie del pedido (Blanco con precio total) */}
      <View style={styles.cardFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 13, color: Colors.text.secondary, fontWeight: '500' }}>Total:</Text>
          <Text style={styles.total}>{formatARS(order.totalPrice)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!isLoading && !isAuthenticated) {
        const t = setTimeout(() => {
          router.replace(('/(auth)/login?redirect=' + encodeURIComponent('/orders')) as any);
        }, 150);
        return () => clearTimeout(t);
      }
    }, [isLoading, isAuthenticated])
  );

  const fetcher = useCallback(
    (page: number) => {
      if (!isAuthenticated) {
        return Promise.resolve({ content: [], totalElements: 0, totalPages: 0, size: PAGE_SIZE, number: 0 });
      }
      return fetchOrders(page, PAGE_SIZE);
    },
    [isAuthenticated],
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

  if (isLoading || !isAuthenticated || loadingInitial) return <LoadingScreen />;

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
    backgroundColor: '#F8FAFC',
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
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTop: {
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
    backgroundColor: '#FFFFFF',
  },
  total: {
    fontSize: 17,
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
