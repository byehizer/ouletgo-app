import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  countPendingReviews,
  fetchOrderReviewStatus,
  hasPendingReviews,
  submitProductReview,
  submitStoreReview,
  type OrderReviewStatus,
} from '../api/reviewApi';
import { ReviewForm } from './ReviewForm';
import { Colors } from '../theme/colors';

interface OrderReviewsModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export function OrderReviewsModal({
  visible,
  orderId,
  onClose,
  onUpdated,
}: OrderReviewsModalProps) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<OrderReviewStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderReviewStatus(orderId);
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  const handleProductSubmit = async (
    productId: string,
    rating: number,
    comment: string,
    imageUris: string[],
  ) => {
    await submitProductReview(orderId, {
      productId,
      rating,
      comment: comment || undefined,
      imageUris,
    });
    await load();
    onUpdated?.();
  };

  const handleStoreSubmit = async (storeId: string, rating: number, comment: string) => {
    await submitStoreReview(orderId, {
      storeId,
      rating,
      comment: comment || undefined,
    });
    await load();
    onUpdated?.();
  };

  const pending = status ? countPendingReviews(status) : 0;
  const allDone = status && !hasPendingReviews(status);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tus reseñas</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={28} color={Colors.text.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : status ? (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            {allDone ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.success.text} />
                <Text style={styles.successText}>
                  ¡Gracias! Ya dejaste todas las reseñas de este pedido.
                </Text>
              </View>
            ) : pending > 0 ? (
              <Text style={styles.hint}>
                Te faltan {pending} {pending === 1 ? 'reseña' : 'reseñas'}. Podés calificar una vez por
                producto y por tienda.
              </Text>
            ) : null}

            {status.products.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Productos</Text>
                {status.products.map((p) => (
                  <ReviewForm
                    key={p.productId}
                    title={p.productName}
                    subtitle={[p.variationLabel, p.storeName].filter(Boolean).join(' · ')}
                    thumbnailUrl={p.thumbnailUrl}
                    allowImages
                    existingReview={p.review}
                    onSubmit={(rating, comment, imageUris) =>
                      handleProductSubmit(p.productId, rating, comment, imageUris)
                    }
                  />
                ))}
              </>
            ) : null}

            {status.stores.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Tiendas</Text>
                {status.stores.map((s) => (
                  <ReviewForm
                    key={s.storeId}
                    title={s.storeName}
                    subtitle="Experiencia con la tienda"
                    existingReview={s.review}
                    onSubmit={(rating, comment) =>
                      handleStoreSubmit(s.storeId, rating, comment)
                    }
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scroll: {
    padding: 16,
  },
  hint: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.success.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger.text,
    textAlign: 'center',
  },
});
