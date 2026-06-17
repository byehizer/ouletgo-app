import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartEmptyState } from '../../src/components/CartEmptyState';
import { CartStoreSection } from '../../src/components/CartStoreSection';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { formatARS } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

export default function CartScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !isAuthenticated) {
        const t = setTimeout(() => {
          router.replace('/(auth)/login?redirect=/cart');
        }, 150);
        return () => clearTimeout(t);
      }
    }, [authLoading, isAuthenticated])
  );

  const insets = useSafeAreaInsets();
  const {
    groups,
    itemCount,
    storeCount,
    total,
    isHydrated,
    updateQuantity,
    removeItem,
    clearStore,
    clearCart,
  } = useCart();

  if (authLoading || !isAuthenticated) return <LoadingScreen />;
  const handleClearAll = useCallback(() => {
    Alert.alert('Vaciar carrito', '¿Querés quitar todos los productos del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar todo', style: 'destructive', onPress: clearCart },
    ]);
  }, [clearCart]);

  const handleCheckout = useCallback(() => {
    router.push('/checkout');
  }, []);

  const summaryLabel =
    storeCount === 1
      ? `1 tienda · ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`
      : `${storeCount} tiendas · ${itemCount} productos`;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            itemCount > 0 ? (
              <Pressable onPress={handleClearAll} hitSlop={8} style={{ marginRight: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626' }}>Vaciar</Text>
              </Pressable>
            ) : null,
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        {!isHydrated ? null : itemCount === 0 ? (
          <CartEmptyState onBrowse={() => router.replace('/(tabs)')} />
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 24,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  backgroundColor: '#E8F4FD',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <Ionicons name="information-circle" size={20} color="#2B8FD4" style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: '#1A3F7A', lineHeight: 19 }}>
                  Tu pedido se consolida de {storeCount}{' '}
                  {storeCount === 1 ? 'tienda' : 'tiendas'}. OutletGo busca cada parte y la
                  entrega junta — retiro en nuestro punto o envío a tu domicilio.
                </Text>
              </View>

              {groups.map((group) => (
                <CartStoreSection
                  key={group.storeId}
                  group={group}
                  onQuantityChange={updateQuantity}
                  onRemoveItem={removeItem}
                  onClearStore={clearStore}
                  onPressStore={(storeId) => router.push(`/store/${storeId}`)}
                  onPressProduct={(productId) => router.push(`/product/${productId}`)}
                />
              ))}
            </ScrollView>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#E2E8F0',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: Math.max(insets.bottom, 12) + 12,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>{summaryLabel}</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    El envío se elige en el siguiente paso
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Total</Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A3F7A' }}>
                    {formatARS(total)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCheckout}
                style={styles.checkoutBtn}
                accessibilityRole="button"
                accessibilityLabel="Continuar al pago"
              >
                <Text style={styles.checkoutBtnText}>Continuar al pago</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  checkoutBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: Colors.brand.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: Colors.brand.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
