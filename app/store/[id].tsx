import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fetchCategories, type CatalogCategory, type CatalogProduct } from '../../src/api/catalogApi';
import { getVisibleReviews } from '../../src/api/productApi';
import {
  fetchStoreProducts,
  fetchStoreProfile,
  type StoreProfile,
  type StoreProductsQuery,
} from '../../src/api/storeApi';
import { FavoriteButton } from '../../src/components/FavoriteButton';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { ReportIconButton } from '../../src/components/ReportIconButton';
import { ReportSheet } from '../../src/components/ReportSheet';
import { useReportStatus } from '../../src/hooks/useReportStatus';
import { BusinessHours } from '../../src/components/BusinessHours';
import { ProductCard } from '../../src/components/ProductCard';
import { ReviewList } from '../../src/components/ReviewList';
import { SearchBar } from '../../src/components/SearchBar';
import { StoreHeader } from '../../src/components/StoreHeader';
import { StoreProductFiltersSheet } from '../../src/components/StoreProductFiltersSheet';
import { useDebounce } from '../../src/lib/useDebounce';
import { getCurrentCoordinates, type Coordinates } from '../../src/lib/location';
import { openChatWithStore } from '../../src/lib/openChat';
import { useAuth } from '../../src/context/AuthContext';
import { parsePriceInput } from '../../src/types/catalogFilters';
import { Colors } from '../../src/theme/colors';
import {
  DEFAULT_STORE_PRODUCT_FILTERS,
  countActiveStoreProductFilters,
  type StoreProductFilterState,
} from '../../src/types/storeProductFilters';

const PAGE_SIZE = 10;

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();

  const storeId = typeof id === 'string' ? id : '';
  const columnGap = 12;
  const horizontalPad = 16;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [productFilters, setProductFilters] =
    useState<StoreProductFilterState>(DEFAULT_STORE_PRODUCT_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const loadingRef = useRef(false);
  const coordsRef = useRef<Coordinates | null>(null);
  const storeLoadedRef = useRef(false);
  const isFirstProductQuery = useRef(true);

  const activeFilterCount = countActiveStoreProductFilters(productFilters);
  const { hasActiveReport, refresh: refreshReportStatus } = useReportStatus('STORE', storeId);

  useLayoutEffect(() => {
    if (!store) {
      navigation.setOptions({ title: 'Tienda', headerRight: undefined });
      return;
    }
    navigation.setOptions({
      title: store.name,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <FavoriteButton
            type="store"
            targetId={store.id}
            meta={{
              storeName: store.name,
              address: store.address,
              ratingAvg: store.ratingAvg,
              ratingCount: store.ratingCount,
            }}
          />
          <ReportIconButton
            onPress={() => setReportVisible(true)}
            pendingReview={hasActiveReport}
          />
        </View>
      ),
    });
  }, [navigation, store, hasActiveReport]);

  useEffect(() => {
    void (async () => {
      const current = await getCurrentCoordinates();
      coordsRef.current = current;
      setCoords(current);
    })();
  }, []);

  useEffect(() => {
    void fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadStore = useCallback(
    async (location: Coordinates | null) => {
      if (!storeId) {
        setError('Tienda inválida.');
        setLoadingStore(false);
        return;
      }

      setLoadingStore(true);
      try {
        const profile = await fetchStoreProfile(storeId, location);
        setStore(profile);
        setError(null);
        storeLoadedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la tienda.');
        setStore(null);
      } finally {
        setLoadingStore(false);
      }
    },
    [storeId],
  );

  const buildProductsQuery = useCallback(
    (pageNum: number, location: Coordinates | null): StoreProductsQuery => ({
      page: pageNum,
      size: PAGE_SIZE,
      latitude: location?.latitude,
      longitude: location?.longitude,
      name: debouncedSearch.trim() || undefined,
      categoryId: productFilters.categoryId ?? undefined,
      minPrice: parsePriceInput(productFilters.minPrice),
      maxPrice: parsePriceInput(productFilters.maxPrice),
      sizeFilter: productFilters.sizeFilter ?? undefined,
    }),
    [debouncedSearch, productFilters],
  );

  const loadProducts = useCallback(
    async (pageNum: number, replace: boolean, location: Coordinates | null) => {
      if (!storeId || loadingRef.current) return;
      loadingRef.current = true;

      if (replace) setLoadingProducts(true);

      try {
        const result = await fetchStoreProducts(storeId, buildProductsQuery(pageNum, location));
        const batch = result.content ?? [];
        setProducts((prev) => (replace ? batch : [...prev, ...batch]));
        setPage(pageNum);
        setHasMore(
          batch.length === PAGE_SIZE && (pageNum + 1) * PAGE_SIZE < result.totalElements,
        );
        setProductsError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar los productos.';
        if (replace) {
          setProducts([]);
          setProductsError(message);
        }
      } finally {
        loadingRef.current = false;
        if (replace) setLoadingProducts(false);
      }
    },
    [storeId, buildProductsQuery],
  );

  useEffect(() => {
    void loadStore(coords);
  }, [loadStore, coords]);

  useEffect(() => {
    if (!storeId || !storeLoadedRef.current || !store) return;

    if (isFirstProductQuery.current) {
      isFirstProductQuery.current = false;
      void loadProducts(0, true, coordsRef.current);
      return;
    }

    void (async () => {
      setLoadingProducts(true);
      await loadProducts(0, true, coordsRef.current);
    })();
  }, [storeId, store, debouncedSearch, productFilters, loadProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const location = coordsRef.current;
    await loadStore(location);
    if (storeId) {
      await loadProducts(0, true, location);
    }
    setRefreshing(false);
  }, [loadStore, loadProducts, storeId]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loadingProducts || loadingRef.current) return;
    setLoadingMore(true);
    await loadProducts(page + 1, false, coordsRef.current);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loadingProducts, loadProducts, page]);

  const handleProductPress = useCallback((product: CatalogProduct) => {
    router.push(`/product/${product.id}`);
  }, []);

  const visibleReviews = useMemo(() => {
    const visible = store ? getVisibleReviews(store.reviews) : [];
    return [...visible].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [store]);

  const limitedReviews = useMemo(() => visibleReviews.slice(0, 4), [visibleReviews]);

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `No hay productos que coincidan con "${debouncedSearch.trim()}".`;
    }
    if (activeFilterCount > 0) {
      return 'No hay productos con estos filtros en esta tienda.';
    }
    return 'Esta tienda no tiene productos publicados.';
  }, [debouncedSearch, activeFilterCount]);

  const renderItem = useCallback(
    ({ item }: { item: CatalogProduct }) => (
      <View style={{ width: cardWidth }}>
        <ProductCard product={item} onPress={handleProductPress} />
      </View>
    ),
    [cardWidth, handleProductPress],
  );

  const handleChatPress = useCallback(() => {
    if (!store) return;
    if (!isAuthenticated) {
      router.push(`/(auth)/login?redirect=/store/${store.id}`);
      return;
    }
    void openChatWithStore(store.id);
  }, [store, isAuthenticated]);

  if (loadingStore && !store) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7FA',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#2B8FD4" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Cargando tienda…</Text>
      </View>
    );
  }

  if (error && !store) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7FA',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 15, color: '#DC2626', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!store) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPad }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2B8FD4" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <StoreHeader store={store} />
            <View style={{ paddingHorizontal: horizontalPad, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleChatPress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.brand.DEFAULT,
                  backgroundColor: Colors.brand.bgLight,
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.brand.DEFAULT} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.brand.dark }}>
                  Enviar mensaje a la tienda
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: horizontalPad }}>
              <BusinessHours schedule={store.schedule} />
            </View>

            {visibleReviews.length > 0 ? (
              <View style={{ paddingHorizontal: horizontalPad, marginTop: 20 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}
                >
                  Reseñas de la tienda ({visibleReviews.length})
                </Text>
                <ReviewList reviews={limitedReviews} />
                {visibleReviews.length > 4 ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/store/reviews',
                        params: { storeId: store.id, storeName: store.name },
                      })
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      marginTop: 8,
                      gap: 4,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#2B8FD4' }}>
                      Ver más reseñas ({visibleReviews.length - 4} más)
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#2B8FD4" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0F172A',
                marginTop: 24,
                marginBottom: 4,
                paddingHorizontal: horizontalPad,
              }}
            >
              Productos de {store.name}
            </Text>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFilterPress={() => setFiltersVisible(true)}
              activeFilterCount={activeFilterCount}
              placeholder="Buscar en esta tienda…"
            />

            {loadingProducts && products.length === 0 ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color="#2B8FD4" />
            ) : null}

            {productsError && products.length === 0 ? (
              <Text
                style={{
                  color: '#DC2626',
                  textAlign: 'center',
                  marginHorizontal: horizontalPad,
                  marginBottom: 12,
                  fontSize: 13,
                }}
              >
                {productsError}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loadingProducts ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center' }}>
                {emptyMessage}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color="#2B8FD4" />
          ) : null
        }
        renderItem={renderItem}
      />

      <StoreProductFiltersSheet
        visible={filtersVisible}
        categories={categories}
        initialFilters={productFilters}
        onClose={() => setFiltersVisible(false)}
        onApply={setProductFilters}
      />

      <ReportSheet
        visible={reportVisible}
        targetType="STORE"
        targetId={store.id}
        targetName={store.name}
        onClose={() => setReportVisible(false)}
        onSubmitted={refreshReportStatus}
      />
    </View>
  );
}
