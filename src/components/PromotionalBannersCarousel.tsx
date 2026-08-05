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

const FALLBACK_BANNERS: (PromotionalBanner & { badge?: string; ctaText?: string })[] = [
  {
    id: 'shein-fallback-1',
    title: 'OUTLET DE AVELLANEDA',
    description: 'Hasta 50% OFF en indumentaria y colecciones de temporada',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
    type: 'CAMPAIGN',
    badge: 'OFERTAS TOP 🔥',
    ctaText: 'Ver Colección →',
    startDate: '',
    endDate: '',
  },
  {
    id: 'shein-fallback-2',
    title: 'DIRECTO DE FABRICANTES',
    description: 'Comprá con los mejores precios mayoristas y minoristas',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    type: 'CAMPAIGN',
    badge: 'NUEVA TEMPORADA ✨',
    ctaText: 'Explorar Tiendas →',
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
    console.log('[BANNERS CAROUSEL] Obteniendo banners activos desde backend...');
    void (async () => {
      try {
        const active = await fetchActiveBanners();
        console.log('[BANNERS CAROUSEL] Banners recibidos del backend:', JSON.stringify(active, null, 2));
        setBanners(active);
      } catch (err) {
        console.error('[BANNERS CAROUSEL] Error al cargar banners:', err);
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
    console.log('[BANNERS CAROUSEL] Banner presionado:', banner.id, banner.type);
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
          const badgeText = (item as any).badge ?? (item.type === 'CAMPAIGN' ? 'PROMO DÍAS 🔥' : 'DESTACADO ⭐');
          const ctaText = (item as any).ctaText ?? 'Ver Ofertas →';

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
                {/* 1. Imagen principal de fondo con dimensiones explícitas numéricas */}
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
                  onLoad={() => console.log(`[BANNERS CAROUSEL] Imagen cargada OK para banner ${item.id}`)}
                  onError={(e) => console.warn(`[BANNERS CAROUSEL] Error cargando imagen para banner ${item.id}:`, e.nativeEvent.error)}
                />

                {/* 2. Capa oscura para contraste del texto */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: bannerWidth,
                    height: 160,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  }}
                />

                {/* 3. Badge superior en rojo */}
                <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                  <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{badgeText}</Text>
                  </View>
                </View>

                {/* 4. Título, Descripción y Botón CTA */}
                <View style={{ position: 'absolute', bottom: 12, left: 14, right: 14, zIndex: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2 }} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={{ marginTop: 6, flexDirection: 'row' }}>
                    <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: '#0F172A', fontSize: 11, fontWeight: '700' }}>{ctaText}</Text>
                    </View>
                  </View>
                </View>
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
