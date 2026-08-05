import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { fetchActiveBanners, type PromotionalBanner } from '../api/bannerApi';

const FALLBACK_BANNERS: PromotionalBanner[] = [
  {
    id: 'shein-fallback-1',
    title: 'OUTLET DE AVELLANEDA',
    description: 'Hasta 50% OFF en indumentaria y colecciones de temporada',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
    type: 'CAMPAIGN',
    badgeText: 'OFERTAS TOP 🔥',
    startDate: '',
    endDate: '',
  },
  {
    id: 'shein-fallback-2',
    title: 'DIRECTO DE FABRICANTES',
    description: 'Comprá con los mejores precios mayoristas y minoristas',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    type: 'CAMPAIGN',
    badgeText: 'NUEVA TEMPORADA ✨',
    startDate: '',
    endDate: '',
  },
];

export function PromotionalBannersCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const bannerWidth = width - 32; // 16px de margen a cada lado
  const snapInterval = bannerWidth + 12;

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / snapInterval);
    if (index >= 0 && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner: PromotionalBanner) => {
    if (banner.id.startsWith('shein-fallback')) return;

    if (banner.type === 'CAMPAIGN') {
      router.push(`/campaign/${banner.id}` as any);
    } else if (banner.type === 'STORE') {
      const targetId = banner.targetStoreId || banner.id;
      router.push(`/store/${targetId}` as any);
    } else if (banner.type === 'PRODUCT') {
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

  const displayBanners = banners.length > 0 ? banners : FALLBACK_BANNERS;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        style={{ height: 160 }}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="center"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
      >
        {displayBanners.map((item) => {
          const badgeText = item.badgeText;

          return (
            <Pressable
              key={item.id}
              onPress={() => handleBannerPress(item)}
              style={({ pressed }) => [
                { width: bannerWidth, height: 160 },
                pressed && { opacity: 0.95 },
              ]}
            >
              <View
                style={{
                  width: bannerWidth,
                  height: 160,
                  borderRadius: 14,
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                  position: 'relative',
                }}
              >
                {/* 1. Gráfica promocional completa y nítida */}
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: bannerWidth,
                    height: 160,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  resizeMode="cover"
                />

                {/* 2. Badge superior opcional solo si se especificó badgeText en backend/admin */}
                {badgeText && badgeText.trim().length > 0 ? (
                  <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                    <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{badgeText}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Paginador de puntitos */}
      {displayBanners.length > 1 ? (
        <View style={styles.dotsContainer}>
          {displayBanners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    minHeight: 185,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    height: 5,
    backgroundColor: '#2B8FD4',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    backgroundColor: '#CBD5E1',
  },
});
