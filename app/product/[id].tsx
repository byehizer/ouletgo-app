import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchProductDetail,
  getVisibleReviews,
  type ProductDetail,
  type ProductVariation,
} from '../../src/api/productApi';
import { FavoriteButton } from '../../src/components/FavoriteButton';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { ReportIconButton } from '../../src/components/ReportIconButton';
import { ReportSheet } from '../../src/components/ReportSheet';
import { useReportStatus } from '../../src/hooks/useReportStatus';
import { ImageGallery } from '../../src/components/ImageGallery';
import { RatingStars } from '../../src/components/RatingStars';
import { ReviewList } from '../../src/components/ReviewList';
import { VariationPicker } from '../../src/components/VariationPicker';
import { useCart } from '../../src/context/CartContext';
import { formatARS } from '../../src/lib/format';
import { openChatWithStore } from '../../src/lib/openChat';
import { Colors } from '../../src/theme/colors';
import { fetchStoreProducts } from '../../src/api/storeApi';
import { ProductCard } from '../../src/components/ProductCard';
import type { CatalogProduct } from '../../src/api/catalogApi';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<CatalogProduct[]>([]);

  const productId = typeof id === 'string' ? id : '';

  useEffect(() => {
    if (!productId) {
      setError('Producto inválido.');
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProductDetail(productId);
        setProduct(data);
        const firstInStock = data.variations.find((v) => v.stock > 0);
        setSelectedVariationId(firstInStock?.id ?? data.variations[0]?.id ?? null);
        
        try {
          const storeProductsData = await fetchStoreProducts(data.storeId, { size: 8 });
          const otherProducts = storeProductsData.content.filter((p) => p.id !== productId);
          setRecommendedProducts(otherProducts);
        } catch (recErr) {
          console.error('Error fetching recommended products:', recErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const { hasActiveReport, refresh: refreshReportStatus } = useReportStatus('PRODUCT', productId);

  const selectedVariation = useMemo(
    () => product?.variations.find((v) => v.id === selectedVariationId) ?? null,
    [product, selectedVariationId],
  );

  const visibleReviews = useMemo(
    () => (product ? getVisibleReviews(product.reviews) : []),
    [product],
  );

  const displayPrice = selectedVariation?.price ?? product?.price ?? 0;

  const favoriteMeta = useMemo(() => {
    if (!product) return null;
    return {
      productName: product.name,
      thumbnailUrl: product.thumbnailUrl,
      price: displayPrice,
      storeId: product.storeId,
      storeName: product.storeName,
    };
  }, [product, displayPrice]);

  useLayoutEffect(() => {
    if (!product || !favoriteMeta) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <FavoriteButton type="product" targetId={product.id} meta={favoriteMeta} />
          <ReportIconButton onPress={() => setReportVisible(true)} pendingReview={hasActiveReport} />
        </View>
      ),
    });
  }, [navigation, product, favoriteMeta, hasActiveReport]);

  const canAddToCart = Boolean(
    selectedVariation && selectedVariation.stock > 0 && product,
  );

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariation || selectedVariation.stock <= 0) return;

    const label = [selectedVariation.size, selectedVariation.color]
      .filter(Boolean)
      .join(' / ');

    addItem(
      {
        productId: product.id,
        variationId: selectedVariation.id,
        productName: product.name,
        storeId: product.storeId,
        storeName: product.storeName,
        price: selectedVariation.price,
        maxStock: selectedVariation.stock,
        thumbnailUrl: product.thumbnailUrl,
        variationLabel: label,
      },
      1,
    );

    setCartMessage('Agregado al carrito');
    setTimeout(() => setCartMessage(null), 2500);
  }, [addItem, product, selectedVariation]);

  if (loading) return <LoadingScreen />;

  if (error || !product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#2B8FD4', fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ImageGallery imageUrls={product.imageUrls} />

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>{product.name}</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
            }}
          >
            {product.ratingAvg != null ? (
              <>
                <RatingStars rating={product.ratingAvg} />
                <Text style={{ fontSize: 13, color: '#64748B' }}>
                  {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 13, color: '#64748B' }}>Sin reseñas aún</Text>
            )}
          </View>

          <Text style={{ fontSize: 26, fontWeight: '700', color: '#1A3F7A', marginTop: 16 }}>
            {formatARS(displayPrice)}
          </Text>

          <Pressable
            onPress={() => router.push(`/store/${product.storeId}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
              padding: 14,
              backgroundColor: '#FFFFFF',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 10,
            }}
          >
            <Ionicons name="storefront-outline" size={22} color="#2B8FD4" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#64748B' }}>Vendido por</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                {product.storeName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          {product.description ? (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
                Descripción
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                {product.description}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
              Elegí tu variación
            </Text>
            <VariationPicker
              variations={product.variations}
              selectedId={selectedVariationId}
              onSelect={(v: ProductVariation) => setSelectedVariationId(v.id)}
            />
          </View>

          <View style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
              Reseñas ({visibleReviews.length})
            </Text>
            <ReviewList reviews={visibleReviews} />
          </View>

          {recommendedProducts.length > 0 ? (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
                Otros productos de esta tienda
              </Text>
              <FlatList
                horizontal
                data={recommendedProducts}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <View style={{ width: 160 }}>
                    <ProductCard
                      product={item}
                      onPress={(p) => {
                        router.push(`/product/${p.id}`);
                      }}
                    />
                  </View>
                )}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Barra fija inferior */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        {cartMessage ? (
          <Text
            style={{
              textAlign: 'center',
              color: '#16A34A',
              fontWeight: '600',
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            {cartMessage}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void openChatWithStore(product.storeId, product.id)}
          style={{
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors.brand.DEFAULT,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            backgroundColor: Colors.brand.bgLight,
          }}
        >
          <Text style={{ color: Colors.brand.dark, fontSize: 15, fontWeight: '600' }}>
            Consultar a {product?.storeName ?? 'la tienda'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleAddToCart}
          disabled={!canAddToCart}
          style={{
            height: 52,
            borderRadius: 10,
            backgroundColor: canAddToCart ? '#2B8FD4' : '#CBD5E1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            {canAddToCart ? 'Agregar al carrito' : 'Seleccioná una variación con stock'}
          </Text>
        </Pressable>
      </View>

      <ReportSheet
        visible={reportVisible}
        targetType="PRODUCT"
        targetId={product.id}
        targetName={product.name}
        onClose={() => setReportVisible(false)}
        onSubmitted={refreshReportStatus}
      />
    </View>
  );
}
