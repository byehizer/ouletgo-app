import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { OrderStoreSlice } from '../api/orderApi';
import { ORDER_STORE_STATUS_LABELS } from '../api/orderApi';
import { formatARS } from '../lib/format';
import { Colors } from '../theme/colors';

interface SliceCardProps {
  slice: OrderStoreSlice;
}

export function SliceCard({ slice }: SliceCardProps) {
  const hasRefund = slice.status === 'STOCK_ISSUE' && slice.refundAmount != null && slice.refundAmount > 0;
  const sliceSubtotal = slice.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={18} color={Colors.brand.DEFAULT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName} numberOfLines={1}>
            {slice.storeName}
          </Text>
          <Text style={styles.storeStatus}>{ORDER_STORE_STATUS_LABELS[slice.status]}</Text>
        </View>
        <Text style={styles.subtotal}>{formatARS(sliceSubtotal)}</Text>
      </View>

      {slice.items.map((item) => (
        <View key={`${item.productId}-${item.variationLabel}`} style={styles.itemRow}>
          <View style={styles.thumb}>
            {item.thumbnailUrl ? (
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbImg} />
            ) : (
              <Ionicons name="shirt-outline" size={22} color={Colors.brand.DEFAULT} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.quantity}× {item.productName}
            </Text>
            {item.variationLabel ? (
              <Text style={styles.itemVar}>{item.variationLabel}</Text>
            ) : null}
          </View>
          <Text style={styles.itemPrice}>{formatARS(item.unitPrice * item.quantity)}</Text>
        </View>
      ))}

      {hasRefund ? (
        <View style={styles.refundBox}>
          <Ionicons name="cash-outline" size={18} color={Colors.warning.text} />
          <Text style={styles.refundText}>
            Reembolso parcial: {formatARS(slice.refundAmount!)}
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
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  storeStatus: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.neutral.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemVar: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  refundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.warning.bg,
  },
  refundText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning.text,
  },
});
