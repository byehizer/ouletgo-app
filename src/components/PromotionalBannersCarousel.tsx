import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { fetchActiveBanners, type PromotionalBanner } from '../api/bannerApi';

export function PromotionalBannersCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const bannerWidth = width - 32; // Margen de 16 a cada lado

  useEffect(() => {
    void (async () => {
      try {
        const active = await fetchActiveBanners();
        setBanners(active);
      } catch (err) {
        console.warn('Error al cargar banners:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBannerPress = (banner: PromotionalBanner) => {
    if (banner.type === 'CAMPAIGN') {
      // Abre la pantalla de campaña con tiendas y productos asociados
      router.push(`/campaign/${banner.id}` as any);
    } else if (banner.type === 'STORE') {
      // Redirige directamente al perfil de la tienda promocionada
      const targetId = banner.targetStoreId || banner.id;
      router.push(`/store/${targetId}` as any);
    } else if (banner.type === 'PRODUCT') {
      // Redirige directamente a la ficha del producto promocionado
      const targetId = banner.targetProductId || banner.id;
      router.push(`/product/${targetId}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2B8FD4" />
      </View>
    );
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={bannerWidth + 12} // width + gap
        snapToAlignment="center"
        contentContainerStyle={styles.listContent}
      >
        {banners.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleBannerPress(item)}
            style={({ pressed }) => [
              styles.card,
              { width: bannerWidth },
              pressed && { opacity: 0.95 },
            ]}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            {item.description ? (
              <View style={styles.textOverlay}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.description} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
  },
});
