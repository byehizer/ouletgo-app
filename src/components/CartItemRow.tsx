import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import type { CartItem } from '../context/CartContext';
import { formatARS } from '../lib/format';

import { QuantityStepper } from './QuantityStepper';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (variationId: string, quantity: number) => void;
  onRemove: (variationId: string) => void;
  onPressProduct?: (productId: string) => void;
}

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  onPressProduct,
}: CartItemRowProps) {
  const lineTotal = item.price * item.quantity;
  const atMaxStock = item.quantity >= item.maxStock;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      <Pressable
        onPress={() => onPressProduct?.(item.productId)}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            backgroundColor: '#E8F4FD',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shirt-outline" size={28} color="#2B8FD4" />
            </View>
          )}
        </View>
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Pressable onPress={() => onPressProduct?.(item.productId)}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }} numberOfLines={2}>
            {item.productName}
          </Text>
          {item.variationLabel ? (
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }} numberOfLines={1}>
              {item.variationLabel}
            </Text>
          ) : null}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A3F7A', marginTop: 6 }}>
            {formatARS(item.price)}
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <QuantityStepper
            compact
            value={item.quantity}
            max={item.maxStock}
            onChange={(qty) => onQuantityChange(item.variationId, qty)}
          />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
            {formatARS(lineTotal)}
          </Text>
        </View>

        {atMaxStock ? (
          <Text style={{ fontSize: 11, color: '#D97706', marginTop: 6 }}>
            Stock máximo disponible
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onRemove(item.variationId)}
        hitSlop={8}
        accessibilityLabel="Quitar del carrito"
        style={({ pressed }) => ({
          padding: 4,
          opacity: pressed ? 0.6 : 1,
          alignSelf: 'flex-start',
        })}
      >
        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
      </Pressable>
    </View>
  );
}
