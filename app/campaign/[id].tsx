import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchCampaignDetails, type CampaignDetails } from '../../src/api/bannerApi';
import { ProductCard } from '../../src/components/ProductCard';
import type { CatalogProduct } from '../../src/api/catalogApi';

export default function CampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columnGap = 12;
  const horizontalPad = 16;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      try {
        const details = await fetchCampaignDetails(id);
        setCampaign(details);
      } catch (err) {
        console.warn(err);
        setError('No se pudo cargar la información de la campaña.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleProductPress = useCallback((product: CatalogProduct) => {
    router.push(`/product/${product.id}`);
  }, [router]);

  const handleStorePress = useCallback((storeId: string) => {
    router.push(`/store/${storeId}`);
  }, [router]);

  const renderProduct = useCallback(
    ({ item }: { item: CatalogProduct }) => (
      <View style={{ width: cardWidth }}>
        <ProductCard product={item} onPress={handleProductPress} />
      </View>
    ),
    [cardWidth, handleProductPress],
  );

  const headerComponent = useMemo(() => {
    if (!campaign) return null;
    return (
      <View style={{ paddingBottom: 16 }}>
        {/* Banner principal */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: campaign.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.gradientOverlay} />
        </View>

        {/* Info de campaña */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{campaign.title}</Text>
          {campaign.description ? (
            <Text style={styles.description}>{campaign.description}</Text>
          ) : null}
        </View>

        {/* Tiendas asociadas */}
        {campaign.stores.length > 0 ? (
          <View style={styles.storesSection}>
            <Text style={styles.sectionTitle}>Tiendas participantes</Text>
            <FlatList
              horizontal
              data={campaign.stores}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleStorePress(item.id)}
                  style={({ pressed }) => [styles.storeCard, pressed && { opacity: 0.92 }]}
                >
                  <View style={styles.storeLogoContainer}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.storeLogo} resizeMode="cover" />
                    ) : (
                      <Ionicons name="storefront-outline" size={28} color="#2B8FD4" />
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.storeName}>
                    {item.name || (item as any).businessName}
                  </Text>
                  <Text numberOfLines={1} style={styles.storeAddress}>
                    {item.address ? item.address.split(',')[0] : 'Avellaneda'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons
                      name="star"
                      size={13}
                      color={
                        item.ratingAvg != null && item.ratingAvg > 0 && item.ratingCount != null && item.ratingCount > 0
                          ? '#F59E0B'
                          : '#94A3B8'
                      }
                    />
                    <Text style={styles.ratingText}>
                      {item.ratingAvg != null && item.ratingAvg > 0 ? item.ratingAvg.toFixed(1) : '0.0'}
                    </Text>
                    <Text style={styles.ratingCountText}>({item.ratingCount ?? 0})</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : null}

        {/* Título de productos */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Productos participantes</Text>
        </View>
      </View>
    );
  }, [campaign, handleStorePress]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2B8FD4" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Cargando campaña...</Text>
      </View>
    );
  }

  if (error || !campaign) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#0F172A', fontWeight: '600' }}>{error || 'Campaña no encontrada'}</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón flotante para volver */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backBtn,
          { top: Platform.OS === 'ios' ? 12 : 24 },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="arrow-back" size={22} color="#0F172A" />
      </Pressable>

      <FlatList
        data={campaign.products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPad }}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={headerComponent}
        renderItem={renderProduct}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>No hay productos en esta campaña aún.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2B8FD4',
    borderRadius: 8,
  },
  errorBackText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    lineHeight: 20,
  },
  storesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  storeCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  storeLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2B8FD4',
    overflow: 'hidden',
  },
  storeLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  storeAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});
