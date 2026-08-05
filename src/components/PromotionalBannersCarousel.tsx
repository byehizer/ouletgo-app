import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { BrandLogo } from './BrandLogo';

const SHEIN_FALLBACK_BANNERS: (PromotionalBanner & { badge?: string; ctaText?: string })[] = [
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
  {
    id: 'shein-fallback-3',
    title: 'BÚSQUEDA LENS CON IA',
    description: 'Subí una foto de cualquier prenda y encontrá similares',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    type: 'CAMPAIGN',
    badge: 'ESPECIAL LENS 📷',
    ctaText: 'Probar Lens →',
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

  const handleBannerPress = (banner: PromotionalBanner & { ctaText?: string }) => {
    if (banner.id === 'shein-fallback-3') {
      router.push('/search/visual');
      return;
    }
    if (banner.id.startsWith('shein-fallback')) {
      return;
    }

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

  const displayBanners = banners.length > 0 ? banners : SHEIN_FALLBACK_BANNERS;

  return (
    <View style={styles.container}>
      {/* Carrusel Horizontal estilo SHEIN */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="center"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
      >
        {displayBanners.map((item, idx) => {
          const hasImageError = imageErrors[item.id];
          const badgeText = (item as any).badge ?? (item.type === 'CAMPAIGN' ? 'PROMO DÍAS 🔥' : 'DESTACADO ⭐');
          const ctaText = (item as any).ctaText ?? 'Ver Ofertas →';

          return (
            <Pressable
              key={item.id}
              onPress={() => handleBannerPress(item)}
              style={({ pressed }) => [
                styles.card,
                { width: bannerWidth },
                pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
              ]}
            >
              {/* Imagen o Fondo Gradient Dark si falla */}
              {!hasImageError && item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                />
              ) : (
                <View style={styles.fallbackBackground}>
                  <BrandLogo variant="isotype" width={48} height={48} />
                </View>
              )}

              {/* Degradado / Máscara de legibilidad */}
              <View style={styles.darkOverlay} />

              {/* Badge superior estilo SHEIN */}
              <View style={styles.topBadgeContainer}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
              </View>

              {/* Contenido inferior: Título + Descripción + CTA */}
              <View style={styles.textContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.ctaRow}>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaButtonText}>{ctaText}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Paginador de Puntitos estilo SHEIN */}
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
    marginVertical: 14,
    backgroundColor: 'transparent',
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
  card: {
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A', // Fondo oscuro azul noche en lugar de gris feo
    position: 'relative',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Oscurece sutilmente la imagen para que el texto resalte
  },
  topBadgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: '#FF3B30', // Rojo SHEIN / Ofertas vibrante
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 12,
    color: '#F1F5F9',
    marginTop: 2,
    fontWeight: '500',
  },
  ctaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ctaButtonText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    height: 6,
    backgroundColor: '#2B8FD4',
  },
  inactiveDot: {
    width: 6,
    height: 6,
    backgroundColor: '#CBD5E1',
  },
});
