import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateOrderPaymentStatus } from '../../src/api/checkoutApi';
import { useCart } from '../../src/context/CartContext';
import { Colors } from '../../src/theme/colors';

export default function CheckoutReturnScreen() {
  const insets = useSafeAreaInsets();
  const { clearCart, items } = useCart();
  
  const params = useLocalSearchParams<{
    status?: string | string[];
    order_id?: string | string[];
    orderId?: string | string[];
    collection_status?: string | string[];
  }>();

  // Función auxiliar para extraer el primer valor si el parámetro es un array,
  // evitando así referencias inestables en el arreglo de dependencias del useEffect.
  const getFirstParamValue = (val: string | string[] | undefined): string => {
    if (!val) return '';
    return Array.isArray(val) ? (val[0] ?? '') : val;
  };

  const statusRaw = getFirstParamValue(params.status);
  const orderId = getFirstParamValue(params.order_id ?? params.orderId);
  const collectionStatus = getFirstParamValue(params.collection_status);

  // Normalizar el estado
  let status: 'approved' | 'pending' | 'failed' = 'failed';
  if (statusRaw === 'approved' || collectionStatus === 'approved') {
    status = 'approved';
  } else if (statusRaw === 'pending' || statusRaw === 'in_process' || collectionStatus === 'pending') {
    status = 'pending';
  }

  // Actualizar en backend y limpiar carrito
  useEffect(() => {
    if (orderId && statusRaw) {
      void updateOrderPaymentStatus(orderId, statusRaw as any).catch((err) => {
        console.error('Error al actualizar el estado de pago en el backend:', err);
      });
    }

    if ((status === 'approved' || status === 'pending') && items.length > 0) {
      clearCart();
    }
  }, [orderId, statusRaw, status, items.length]);

  const config = {
    approved: {
      icon: 'checkmark-circle' as const,
      iconColor: Colors.success.DEFAULT,
      iconBg: Colors.success.bg,
      title: '¡Pago Aprobado!',
      body: orderId
        ? `Tu pedido #${orderId.slice(0, 8).toUpperCase()} fue confirmado. OutletGo empieza a coordinar la recolección en las tiendas.`
        : 'Tu pedido fue confirmado. OutletGo coordina la recolección y entrega.',
      primaryLabel: 'Ver mis pedidos',
      primaryAction: () => router.replace('/orders'),
      secondaryLabel: 'Volver al inicio',
      secondaryAction: () => router.replace('/(tabs)'),
    },
    pending: {
      icon: 'time' as const,
      iconColor: Colors.warning.DEFAULT,
      iconBg: Colors.warning.bg,
      title: 'Pago en proceso',
      body: 'Tu pago está siendo procesado por Mercado Pago. Te avisamos cuando se acredite.',
      primaryLabel: 'Ver mis pedidos',
      primaryAction: () => router.replace('/orders'),
      secondaryLabel: 'Volver al inicio',
      secondaryAction: () => router.replace('/(tabs)'),
    },
    failed: {
      icon: 'close-circle' as const,
      iconColor: Colors.danger.DEFAULT,
      iconBg: Colors.danger.bg,
      title: 'El pago no se procesó',
      body: 'Hubo un problema al procesar el pago. Podés ver el detalle en tu historial de pedidos o intentar nuevamente.',
      primaryLabel: 'Ver mis pedidos',
      primaryAction: () => router.replace('/orders'),
      secondaryLabel: 'Volver al inicio',
      secondaryAction: () => router.replace('/(tabs)'),
    },
  }[status];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
      <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.icon} size={44} color={config.iconColor} />
      </View>

      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.body}>{config.body}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={config.primaryAction}
        style={styles.primaryBtn}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>{config.primaryLabel}</Text>
      </TouchableOpacity>

      {config.secondaryLabel ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={config.secondaryAction}
          style={styles.secondaryBtn}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>{config.secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: Colors.brand.DEFAULT,
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.brand.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
