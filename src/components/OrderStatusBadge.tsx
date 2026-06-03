import { StyleSheet, Text, View } from 'react-native';

import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '../api/types';
import { Colors } from '../theme/colors';

const VARIANT_STYLES = {
  info: { bg: Colors.info.bg, text: Colors.info.text },
  warning: { bg: Colors.warning.bg, text: Colors.warning.text },
  success: { bg: Colors.success.bg, text: Colors.success.text },
  danger: { bg: Colors.danger.bg, text: Colors.danger.text },
  neutral: { bg: Colors.neutral.bg, text: Colors.neutral.text },
} as const;

interface OrderStatusBadgeProps {
  status: OrderStatus;
  compact?: boolean;
}

export function OrderStatusBadge({ status, compact = false }: OrderStatusBadgeProps) {
  const variant = ORDER_STATUS_BADGE[status];
  const colors = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, compact && styles.badgeCompact]}>
      <Text style={[styles.text, { color: colors.text }, compact && styles.textCompact]} numberOfLines={1}>
        {ORDER_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: '100%',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
  },
});
