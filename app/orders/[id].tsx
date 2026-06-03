import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchOrderById, type OrderDetail } from '../../src/api/orderApi';
import {
  countPendingReviews,
  fetchOrderReviewStatus,
  hasPendingReviews,
  type OrderReviewStatus,
} from '../../src/api/reviewApi';
import { getShippingTracking, type ShippingTracking } from '../../src/api/shippingApi';
import { SHIPPING_CARRIER_LABELS, SHIPPING_METHOD_LABELS } from '../../src/api/types';
import { OrderReviewsModal } from '../../src/components/OrderReviewsModal';
import { OrderStatusBadge } from '../../src/components/OrderStatusBadge';
import { OrderTimeline } from '../../src/components/OrderTimeline';
import { SliceCard } from '../../src/components/SliceCard';
import { formatARS, formatDate, formatDateTime } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

function PriceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>{label}</Text>
      <Text style={[styles.priceValue, bold && styles.priceValueBold]}>{value}</Text>
    </View>
  );
}

function PickupPointCard({
  pickupPoint,
}: {
  pickupPoint: NonNullable<OrderDetail['pickupPoint']>;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons name="storefront" size={22} color={Colors.brand.DEFAULT} />
        <Text style={styles.infoTitle}>Punto de retiro OutletGo</Text>
      </View>
      <Text style={styles.infoName}>{pickupPoint.name}</Text>
      <Text style={styles.infoBody}>
        {pickupPoint.address} · {pickupPoint.neighborhood}
      </Text>
      <Text style={styles.infoMuted}>{pickupPoint.businessHours}</Text>
    </View>
  );
}

function ShippingTrackingCard({
  tracking,
  carrierLabel,
}: {
  tracking: ShippingTracking;
  carrierLabel: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons name="cube-outline" size={22} color={Colors.brand.DEFAULT} />
        <Text style={styles.infoTitle}>Seguimiento del envío</Text>
      </View>
      <Text style={styles.infoBody}>
        {carrierLabel} · {tracking.trackingNumber}
      </Text>
      <Text style={styles.trackingStatus}>{tracking.currentStatus}</Text>
      {tracking.estimatedDelivery ? (
        <Text style={styles.infoMuted}>
          Entrega estimada: {formatDate(tracking.estimatedDelivery)}
        </Text>
      ) : null}
      {tracking.events.length > 0 ? (
        <View style={styles.events}>
          {tracking.events.map((ev, i) => (
            <View key={`${ev.timestamp}-${i}`} style={styles.eventRow}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventDesc}>{ev.description}</Text>
                <Text style={styles.eventTime}>{formatDateTime(ev.timestamp)}</Text>
                {ev.location ? (
                  <Text style={styles.eventLoc}>{ev.location}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = typeof id === 'string' ? id : '';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tracking, setTracking] = useState<ShippingTracking | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingVisible, setTrackingVisible] = useState(false);

  const [reviewStatus, setReviewStatus] = useState<OrderReviewStatus | null>(null);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const loadReviewStatus = useCallback(async (id: string) => {
    try {
      const reviews = await fetchOrderReviewStatus(id);
      setReviewStatus(reviews);
    } catch {
      setReviewStatus(null);
    }
  }, []);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
      setError(null);
      if (data.status === 'DELIVERED') {
        await loadReviewStatus(data.id);
      } else {
        setReviewStatus(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el pedido');
      setOrder(null);
      setReviewStatus(null);
    }
  }, [orderId, loadReviewStatus]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadOrder();
      setLoading(false);
    })();
  }, [loadOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrder();
    if (trackingVisible) {
      setTracking(null);
      setTrackingVisible(false);
    }
    setRefreshing(false);
  }, [loadOrder, trackingVisible]);

  const loadTracking = useCallback(async () => {
    if (!orderId) return;
    setLoadingTracking(true);
    try {
      const data = await getShippingTracking(orderId);
      setTracking(data);
      setTrackingVisible(true);
    } catch {
      setError('No se pudo cargar el seguimiento del envío.');
    } finally {
      setLoadingTracking(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
        </View>
      </>
    );
  }

  if (error && !order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </>
    );
  }

  if (!order) return null;

  const showPickup =
    order.shippingMethod === 'RETIRO_EN_PUNTO' &&
    order.pickupPoint != null &&
    (order.status === 'READY_FOR_PICKUP' || order.status === 'DELIVERED');

  const showTrackingBtn =
    order.shippingMethod === 'ENVIO_CORREO' &&
    (order.status === 'IN_TRANSIT' || order.status === 'DELIVERED') &&
    order.trackingNumber != null;

  const carrierLabel = order.carrier ? SHIPPING_CARRIER_LABELS[order.carrier] : '';

  const showReviewBanner =
    order.status === 'DELIVERED' && reviewStatus?.canReview === true;
  const pendingReviews = reviewStatus ? countPendingReviews(reviewStatus) : 0;
  const allReviewsDone =
    reviewStatus && reviewStatus.canReview && !hasPendingReviews(reviewStatus);

  return (
    <>
      <Stack.Screen options={{ title: `Pedido #${order.id.replace('ORD-MOCK-', '').replace('ORD-', '')}` }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.DEFAULT} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <Text style={styles.method}>{SHIPPING_METHOD_LABELS[order.shippingMethod]}</Text>

        <View style={{ marginBottom: 16 }}>
          <OrderTimeline status={order.status} shippingMethod={order.shippingMethod} />
        </View>

        {showReviewBanner ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setReviewsModalVisible(true)}
            style={[
              styles.reviewBanner,
              allReviewsDone && styles.reviewBannerDone,
            ]}
          >
            <View style={styles.reviewBannerIcon}>
              <Ionicons
                name={allReviewsDone ? 'checkmark-circle' : 'star'}
                size={24}
                color={allReviewsDone ? Colors.success.text : Colors.brand.DEFAULT}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewBannerTitle}>
                {allReviewsDone ? 'Reseñas enviadas' : '¿Cómo fue tu experiencia?'}
              </Text>
              <Text style={styles.reviewBannerBody}>
                {allReviewsDone
                  ? 'Gracias por contarnos. Podés ver lo que escribiste.'
                  : pendingReviews > 0
                    ? `Te faltan ${pendingReviews} reseña${pendingReviews === 1 ? '' : 's'} por producto o tienda.`
                    : 'Calificá productos y tiendas de este pedido.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.text.muted} />
          </TouchableOpacity>
        ) : null}

        {showPickup ? <PickupPointCard pickupPoint={order.pickupPoint!} /> : null}

        {showTrackingBtn && !trackingVisible ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void loadTracking()}
            disabled={loadingTracking}
            style={styles.trackBtn}
          >
            {loadingTracking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="navigate-outline" size={20} color="#fff" />
                <Text style={styles.trackBtnText}>Seguir mi envío</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {trackingVisible && tracking ? (
          <ShippingTrackingCard tracking={tracking} carrierLabel={carrierLabel} />
        ) : null}

        {order.deliveryAddress && order.shippingMethod === 'ENVIO_CORREO' ? (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="location-outline" size={22} color={Colors.brand.DEFAULT} />
              <Text style={styles.infoTitle}>Dirección de entrega</Text>
            </View>
            <Text style={styles.infoBody}>{order.deliveryAddress}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del pago</Text>
          <View style={styles.priceCard}>
            <PriceRow label="Productos" value={formatARS(order.productSubtotal)} />
            <PriceRow
              label={order.shippingCost > 0 ? `Envío${carrierLabel ? ` (${carrierLabel})` : ''}` : 'Envío'}
              value={order.shippingCost > 0 ? formatARS(order.shippingCost) : 'Gratis'}
            />
            <PriceRow
              label="Tarifa de servicio"
              value={order.serviceFee > 0 ? formatARS(order.serviceFee) : 'Gratis'}
            />
            <View style={styles.priceDivider} />
            <PriceRow label="Total pagado" value={formatARS(order.totalPrice)} bold />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Por tienda ({order.stores.length})
          </Text>
          {order.stores.map((slice) => (
            <SliceCard key={slice.storeId} slice={slice} />
          ))}
        </View>
      </ScrollView>

      <OrderReviewsModal
        visible={reviewsModalVisible}
        orderId={order.id}
        onClose={() => setReviewsModalVisible(false)}
        onUpdated={() => void loadReviewStatus(order.id)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.base,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  date: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  method: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  infoName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  infoMuted: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 6,
  },
  trackingStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.DEFAULT,
    marginTop: 8,
    marginBottom: 4,
  },
  events: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.DEFAULT,
    marginTop: 6,
  },
  eventDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  eventLoc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  trackBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.brand.bgLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    padding: 14,
    marginBottom: 16,
  },
  reviewBannerDone: {
    backgroundColor: Colors.success.bg,
    borderColor: '#BBF7D0',
  },
  reviewBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  reviewBannerBody: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  priceLabelBold: {
    fontWeight: '700',
    color: Colors.text.primary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  priceValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border.DEFAULT,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 15,
    color: Colors.danger.text,
    textAlign: 'center',
  },
});
