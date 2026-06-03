import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';

import type { CartStoreGroup } from '../context/CartContext';
import { formatARS } from '../lib/format';

import { CartItemRow } from './CartItemRow';

interface CartStoreSectionProps {
  group: CartStoreGroup;
  onQuantityChange: (variationId: string, quantity: number) => void;
  onRemoveItem: (variationId: string) => void;
  onClearStore: (storeId: string) => void;
  onPressStore: (storeId: string) => void;
  onPressProduct: (productId: string) => void;
}

export function CartStoreSection({
  group,
  onQuantityChange,
  onRemoveItem,
  onClearStore,
  onPressStore,
  onPressProduct,
}: CartStoreSectionProps) {
  const itemUnits = group.items.reduce((sum, i) => sum + i.quantity, 0);

  const handleClearStore = () => {
    Alert.alert(
      'Vaciar tienda',
      `¿Querés quitar todos los productos de ${group.storeName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => onClearStore(group.storeId),
        },
      ],
    );
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: '#F8FAFC',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => onPressStore(group.storeId)}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#E8F4FD',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="storefront" size={18} color="#2B8FD4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
              {group.storeName}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {itemUnits} {itemUnits === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        <Pressable onPress={handleClearStore} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626' }}>Vaciar</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14 }}>
        {group.items.map((item) => (
          <CartItemRow
            key={item.variationId}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemoveItem}
            onPressProduct={onPressProduct}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        }}
      >
        <Text style={{ fontSize: 13, color: '#64748B' }}>Subtotal tienda</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A3F7A' }}>
          {formatARS(group.subtotal)}
        </Text>
      </View>
    </View>
  );
}
