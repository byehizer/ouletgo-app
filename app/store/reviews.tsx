import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchStoreProfile } from '../../src/api/storeApi';
import { getVisibleReviews, type ProductReview } from '../../src/api/productApi';
import { ReviewList } from '../../src/components/ReviewList';
import { LoadingScreen } from '../../src/components/LoadingScreen';

export default function StoreReviewsScreen() {
  const { storeId, storeName } = useLocalSearchParams<{ storeId: string; storeName: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: storeName ? `Reseñas — ${storeName}` : 'Reseñas',
    });
  }, [navigation, storeName]);

  useEffect(() => {
    if (!storeId) {
      setError('Tienda inválida.');
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchStoreProfile(storeId);
        const visible = getVisibleReviews(profile.reviews);
        // Ordenamos por fecha descendente (más recientes primero)
        const sorted = [...visible].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas.');
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 15, color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        <Text
          onPress={() => router.back()}
          style={{ color: '#2B8FD4', fontWeight: '600', marginTop: 16 }}
        >
          Volver
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F5F7FA' }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
        Opiniones de los compradores
      </Text>
      <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        Total de opiniones: {reviews.length}
      </Text>

      <ReviewList reviews={reviews} />
    </ScrollView>
  );
}
