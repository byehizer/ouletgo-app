import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ORDER_STATUS_LABELS, type OrderStatus, type ShippingMethod } from '../api/types';
import { Colors } from '../theme/colors';

const FLOW_PICKUP: OrderStatus[] = [
  'PAID',
  'PREPARING',
  'COLLECTING',
  'CONSOLIDATED',
  'READY_FOR_PICKUP',
  'DELIVERED',
];

const FLOW_SHIPPING: OrderStatus[] = [
  'PAID',
  'PREPARING',
  'COLLECTING',
  'CONSOLIDATED',
  'IN_TRANSIT',
  'DELIVERED',
];

const STEP_LABELS: Partial<Record<OrderStatus, string>> = {
  PAID: 'Pago confirmado',
  PREPARING: 'Tiendas preparando',
  COLLECTING: 'OutletGo recolectando',
  CONSOLIDATED: 'Pedido consolidado',
  READY_FOR_PICKUP: 'Listo en punto OutletGo',
  IN_TRANSIT: 'En camino a tu domicilio',
  DELIVERED: 'Entregado',
};

function getFlow(method: ShippingMethod): OrderStatus[] {
  return method === 'RETIRO_EN_PUNTO' ? FLOW_PICKUP : FLOW_SHIPPING;
}

function stepIndex(flow: OrderStatus[], status: OrderStatus): number {
  if (status === 'CANCELED' || status === 'STOCK_ISSUE') {
    const paidIdx = flow.indexOf('PAID');
    const lastActive = flow.findIndex((s) => s === status);
    return lastActive >= 0 ? lastActive : paidIdx;
  }
  if (status === 'PENDING') return -1;
  const idx = flow.indexOf(status);
  return idx >= 0 ? idx : flow.length - 1;
}

interface OrderTimelineProps {
  status: OrderStatus;
  shippingMethod: ShippingMethod;
}

export function OrderTimeline({ status, shippingMethod }: OrderTimelineProps) {
  const flow = getFlow(shippingMethod);
  const currentIdx = stepIndex(flow, status);
  const isCanceled = status === 'CANCELED';
  const isStockIssue = status === 'STOCK_ISSUE';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Seguimiento del pedido</Text>
      {flow.map((step, index) => {
        const done = currentIdx >= index;
        const current = currentIdx === index && !isCanceled;
        const label = STEP_LABELS[step] ?? ORDER_STATUS_LABELS[step];

        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                  isCanceled && index > currentIdx && styles.dotMuted,
                ]}
              >
                {done && !current ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : current ? (
                  <View style={styles.dotInner} />
                ) : null}
              </View>
              {index < flow.length - 1 ? (
                <View style={[styles.line, done && index < currentIdx && styles.lineDone]} />
              ) : null}
            </View>
            <Text
              style={[
                styles.stepLabel,
                done && styles.stepLabelDone,
                current && styles.stepLabelCurrent,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
      {isCanceled ? (
        <View style={styles.alert}>
          <Ionicons name="close-circle" size={18} color={Colors.danger.text} />
          <Text style={styles.alertText}>Este pedido fue cancelado.</Text>
        </View>
      ) : null}
      {isStockIssue ? (
        <View style={[styles.alert, { backgroundColor: Colors.warning.bg }]}>
          <Ionicons name="alert-circle" size={18} color={Colors.warning.text} />
          <Text style={[styles.alertText, { color: Colors.warning.text }]}>
            Hubo un problema de stock en una o más tiendas. Revisá el detalle por local.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    minHeight: 44,
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: Colors.brand.DEFAULT,
    borderColor: Colors.brand.DEFAULT,
  },
  dotCurrent: {
    borderColor: Colors.brand.DEFAULT,
    backgroundColor: Colors.brand.bgLight,
  },
  dotMuted: {
    opacity: 0.4,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.DEFAULT,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border.DEFAULT,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: Colors.brand.DEFAULT,
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.muted,
    paddingTop: 2,
    paddingBottom: 12,
    paddingLeft: 8,
  },
  stepLabelDone: {
    color: Colors.text.secondary,
  },
  stepLabelCurrent: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.danger.bg,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.danger.text,
    lineHeight: 18,
  },
});
