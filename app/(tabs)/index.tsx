import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
  Modal,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';

import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useFavorite } from '../../src/hooks/useFavorite';
import { fetchTopRatedStores, type TopRatedStore } from '../../src/api/storeApi';
import {
  fetchFavoriteProducts,
  fetchFavoriteStores,
  type FavoriteProduct,
  type FavoriteStore,
} from '../../src/api/favoritesApi';
import { formatARS } from '../../src/lib/format';
import { LogisticsIconButton, LogisticsHeader } from '../../src/components/logistics/LogisticsHeader';
import { PromotionalBannersCarousel } from '../../src/components/PromotionalBannersCarousel';

import {
  fetchCatalogProducts,
  fetchCategories,
  fetchNewArrivals,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogQuery,
} from '../../src/api/catalogApi';
import { CategoryChips } from '../../src/components/CategoryChips';
import { FiltersSheet } from '../../src/components/FiltersSheet';
import { ProductCard } from '../../src/components/ProductCard';
import { SearchBar } from '../../src/components/SearchBar';
import { USE_MOCKS } from '../../src/config/env';
import { useDebounce } from '../../src/lib/useDebounce';
import type { Coordinates } from '../../src/lib/location';
import {
  DEFAULT_CATALOG_FILTERS,
  countActiveFilters,
  parsePriceInput,
  isFootwearCategoryName,
  type CatalogFilterState,
} from '../../src/types/catalogFilters';

const PAGE_SIZE = 10;

// Variable en memoria para rastrear si ya se mostró la bienvenida en la sesión actual de la app.
let welcomeShownThisSession = false;

// Tarjeta horizontal de tienda para la sección "Mejor Rankeadas" (Social Proof)
function TopRatedStoreCard({ store, onPress }: { store: TopRatedStore; onPress: () => void }) {
  const hasRating =
    store.ratingAvg != null &&
    store.ratingAvg > 0 &&
    store.ratingCount != null &&
    store.ratingCount > 0;

  const ratingText = hasRating ? store.ratingAvg!.toFixed(1) : '0.0';
  const ratingCountText = `(${store.ratingCount ?? 0})`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
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
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
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
        }}
      >
        {store.imageUrl ? (
          <Image
            source={{ uri: store.imageUrl }}
            style={{ width: 64, height: 64, borderRadius: 32 }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="storefront-outline" size={28} color="#2B8FD4" />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#0F172A',
          textAlign: 'center',
          alignSelf: 'stretch',
        }}
      >
        {store.name}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11,
          color: '#64748B',
          marginTop: 2,
          textAlign: 'center',
          alignSelf: 'stretch',
        }}
      >
        {store.address ? store.address.split(',')[0] : 'Avellaneda'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'center' }}>
        <Ionicons name="star" size={13} color={hasRating ? '#F59E0B' : '#94A3B8'} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
          {ratingText}
        </Text>
        <Text style={{ fontSize: 11, color: '#64748B' }}>
          {ratingCountText}
        </Text>
      </View>
    </Pressable>
  );
}

function CompactProductCard({
  product,
  onPress,
  isAuthenticated = false,
}: {
  product: CatalogProduct;
  onPress: () => void;
  isAuthenticated?: boolean;
}) {
  const { isFavorite, toggling, toggle } = useFavorite(
    'product',
    product.id,
    {
      productName: product.name,
      thumbnailUrl: product.thumbnailUrl,
      price: product.price,
      storeId: product.storeId,
      storeName: product.storeName,
    },
  );

  const handleFavoritePress = async (e: any) => {
    e?.stopPropagation?.();
    if (!isAuthenticated) {
      Alert.alert(
        'Iniciar sesión',
        'Debes iniciar sesión para guardar productos en tus favoritos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/(auth)/login') },
        ],
      );
      return;
    }
    try {
      await toggle();
    } catch (err) {
      Alert.alert(
        'Favoritos',
        err instanceof Error ? err.message : 'No se pudo actualizar el favorito.',
      );
    }
  };

  const hasRating =
    product.ratingAvg != null &&
    product.ratingAvg > 0 &&
    product.ratingCount != null &&
    product.ratingCount > 0;

  const ratingText = hasRating ? product.ratingAvg!.toFixed(1) : '0.0';
  const ratingCountText = `(${product.ratingCount ?? 0})`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 4,
        opacity: pressed ? 0.93 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* Imagen grande dominante */}
      <View style={{ width: 160, height: 160, backgroundColor: '#F1F5F9' }}>
        {product.thumbnailUrl ? (
          <Image
            source={{ uri: product.thumbnailUrl }}
            style={{ width: 160, height: 160 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shirt-outline" size={48} color="#CBD5E1" />
          </View>
        )}

        {/* Overlay oscuro gradiente simulado en la parte inferior */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 68,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
            paddingHorizontal: 10,
            paddingBottom: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: 0.2,
            }}
          >
            {product.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.75)',
              marginTop: 2,
            }}
          >
            {product.storeName}
          </Text>
        </View>

        {/* Botón circular blanco flotante para el corazón favorito */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 7,
            zIndex: 40,
          }}
        >
          <Pressable
            onPress={handleFavoritePress}
            disabled={toggling}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || toggling ? 0.75 : 1,
            })}
          >
            {toggling ? (
              <ActivityIndicator size="small" color="#E11D48" />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color="#E11D48"
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Zona inferior: precio + rating prolijo con 1 sola estrella */}
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          gap: 4,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontSize: 13, fontWeight: '900', color: '#1A3F7A', letterSpacing: -0.3, flex: 1 }}
        >
          {formatARS(product.price)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="star" size={12} color={hasRating ? '#F59E0B' : '#94A3B8'} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A' }}>
            {ratingText}
          </Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>
            {ratingCountText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Tarjeta horizontal de tienda favorita para "Guardado para vos"
function CompactFavoriteStoreCard({ store, onPress }: { store: FavoriteStore; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 120,
        alignItems: 'center',
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#FFF1F2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 2,
          borderColor: '#E11D48',
          overflow: 'hidden',
        }}
      >
        {store.imageUrl ? (
          <Image
            source={{ uri: store.imageUrl }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
            }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="storefront-outline" size={28} color="#E11D48" />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center', width: '100%' }}
      >
        {store.storeName}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'center', width: '100%' }}
      >
        {store.address ? store.address.split(',')[0] : 'Avellaneda'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'center' }}>
        <Ionicons
          name="star"
          size={12}
          color={store.ratingAvg != null && store.ratingAvg > 0 ? '#F59E0B' : '#94A3B8'}
        />
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
          {store.ratingAvg != null && store.ratingAvg > 0 ? store.ratingAvg.toFixed(1) : '0.0'}
        </Text>
        <Text style={{ fontSize: 11, color: '#64748B' }}>({store.ratingCount ?? 0})</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const columnGap = 12;
  const horizontalPad = 16;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_CATALOG_FILTERS);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de secciones adicionales
  const [topRatedStores, setTopRatedStores] = useState<TopRatedStore[]>([]);
  const [newArrivals, setNewArrivals] = useState<CatalogProduct[]>([]);
  const [favProducts, setFavProducts] = useState<FavoriteProduct[]>([]);
  const [favStores, setFavStores] = useState<FavoriteStore[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const loadingRef = useRef(false);
  const isFirstSearch = useRef(true);

  const activeFilterCount = countActiveFilters(filters);

  const buildQuery = useCallback(
    (pageNum: number): CatalogQuery => {
      const minPrice = parsePriceInput(filters.minPrice);
      const maxPrice = parsePriceInput(filters.maxPrice);

      return {
        page: pageNum,
        size: PAGE_SIZE,
        categoryId: filters.categoryId ?? undefined,
        name: debouncedSearch.trim() || undefined,
        minPrice,
        maxPrice,
        sizeFilter: filters.sizeFilter ?? undefined,
        latitude: filters.nearMe && coords ? coords.latitude : undefined,
        longitude: filters.nearMe && coords ? coords.longitude : undefined,
        radiusKm: filters.nearMe ? filters.radiusKm : undefined,
        openNow: filters.openNow || undefined,
      };
    },
    [filters, debouncedSearch, coords],
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (replace) setProducts([]);

      try {
        const result = await fetchCatalogProducts(buildQuery(pageNum));
        const batch = result.content ?? [];
        setProducts((prev) => (replace ? batch : [...prev, ...batch]));
        setPage(pageNum);
        setHasMore(
          batch.length === PAGE_SIZE && (pageNum + 1) * PAGE_SIZE < result.totalElements,
        );
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar el catálogo.';
        setError(message);
        if (replace) setProducts([]);
      } finally {
        loadingRef.current = false;
      }
    },
    [buildQuery],
  );

  // Carga de secciones secundarias del Home (Social Proof, Novedades y Favoritos)
  const loadHomeSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const [topRatedRes, arrivalsRes] = await Promise.allSettled([
        fetchTopRatedStores(6),
        fetchNewArrivals(6),
      ]);

      if (topRatedRes.status === 'fulfilled') {
        setTopRatedStores(topRatedRes.value);
      } else {
        console.warn('Fallo al cargar tiendas recomendadas:', topRatedRes.reason);
        setTopRatedStores([]);
      }

      if (arrivalsRes.status === 'fulfilled') {
        setNewArrivals(arrivalsRes.value);
      } else {
        console.warn('Fallo al cargar recién llegados:', arrivalsRes.reason);
        setNewArrivals([]);
      }

      if (isAuthenticated) {
        const [favProdsRes, favStsRes] = await Promise.allSettled([
          fetchFavoriteProducts(),
          fetchFavoriteStores(),
        ]);
        setFavProducts(favProdsRes.status === 'fulfilled' ? favProdsRes.value : []);
        setFavStores(favStsRes.status === 'fulfilled' ? favStsRes.value : []);
      } else {
        setFavProducts([]);
        setFavStores([]);
      }
    } catch (err) {
      console.warn('Error al cargar secciones secundarias de inicio:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [isAuthenticated]);

  // Carga inicial completa de la pantalla
  const loadAllInitialData = useCallback(async () => {
    setLoadingInitial(true);
    try {
      await Promise.allSettled([
        loadCategories(),
        loadProducts(0, true),
        loadHomeSections(),
      ]);
    } finally {
      setLoadingInitial(false);
    }
  }, [loadCategories, loadProducts, loadHomeSections]);

  // Efecto inicial de carga (corre una única vez al montar)
  useEffect(() => {
    void loadAllInitialData();
  }, []);

  useEffect(() => {
    if (!welcomeShownThisSession) {
      setWelcomeVisible(true);
      welcomeShownThisSession = true;
    }
  }, []);

  const handleCloseWelcome = useCallback(() => {
    setWelcomeVisible(false);
  }, []);

  // Recarga productos al modificar filtros de búsqueda
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    void (async () => {
      setLoadingInitial(true);
      await loadProducts(0, true);
      setLoadingInitial(false);
    })();
  }, [debouncedSearch, filters, coords]);

  // Monitorea cambios de sesión para recargar favoritos si corresponde
  useEffect(() => {
    if (loadingInitial) return;
    void loadHomeSections();
  }, [isAuthenticated]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setFilters((prev) => {
      let sizeFilter = prev.sizeFilter;
      if (sizeFilter) {
        const prevCategory = categories.find((c) => c.id === prev.categoryId);
        const nextCategory = categories.find((c) => c.id === categoryId);
        const wasFootwear = isFootwearCategoryName(prevCategory?.name);
        const isNextFootwear = isFootwearCategoryName(nextCategory?.name);
        if (wasFootwear !== isNextFootwear) {
          sizeFilter = null;
        }
      }
      return { ...prev, categoryId, sizeFilter };
    });
  }, [categories]);

  const handleApplyFilters = useCallback(
    (next: CatalogFilterState, nextCoords: Coordinates | null) => {
      setFilters(next);
      setCoords(nextCoords);
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadProducts(0, true),
      loadHomeSections(),
    ]);
    setRefreshing(false);
  }, [loadProducts, loadHomeSections]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loadingInitial || loadingRef.current) return;
    setLoadingMore(true);
    await loadProducts(page + 1, false);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loadingInitial, loadProducts, page]);

  const handleProductPress = useCallback((product: CatalogProduct) => {
    router.push(`/product/${product.id}`);
  }, []);

  const isSearchingOrFiltering = useMemo(() => {
    return (
      debouncedSearch.trim().length > 0 ||
      filters.categoryId !== null ||
      activeFilterCount > 0 ||
      filters.openNow ||
      filters.nearMe
    );
  }, [debouncedSearch, filters.categoryId, activeFilterCount, filters.openNow, filters.nearMe]);

  // Android back button: si hay búsqueda o filtros activos, los limpia y vuelve al Home normal
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearchingOrFiltering) {
        setSearchQuery('');
        setFilters(DEFAULT_CATALOG_FILTERS);
        return true; // consume el evento, no navega atrás
      }
      return false; // comportamiento normal
    });
    return () => subscription.remove();
  }, [isSearchingOrFiltering]);

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `No encontramos productos para "${debouncedSearch.trim()}".`;
    }
    if (activeFilterCount > 0 || filters.categoryId) {
      return 'No hay productos con estos filtros.';
    }
    if (filters.openNow) {
      return 'No hay productos de tiendas abiertas en este momento.';
    }
    return 'No hay productos en esta categoría.';
  }, [debouncedSearch, activeFilterCount, filters.categoryId]);

  const renderItem = useCallback(
    ({ item }: { item: CatalogProduct }) => (
      <View style={{ width: cardWidth }}>
        <ProductCard product={item} onPress={handleProductPress} />
      </View>
    ),
    [cardWidth, handleProductPress],
  );

  if (loadingInitial && products.length === 0 && !debouncedSearch) {
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
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Cargando catálogo…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <FlatList
        style={{ flex: 1 }}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPad }}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2B8FD4" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 16,
                marginTop: 12,
                marginBottom: 12,
                gap: 8,
              }}
            >
              <LogisticsIconButton />
              <View style={{ flex: 1 }}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFilterPress={() => setFiltersVisible(true)}
                  onLensPress={() => router.push('/search/visual')}
                  activeFilterCount={activeFilterCount}
                  containerStyle={{ marginHorizontal: 0, marginBottom: 0 }}
                />
              </View>
            </View>

            {/* Las categorías siempre visibles, incluso en modo búsqueda/filtro */}
            <CategoryChips
              categories={categories}
              selectedId={filters.categoryId}
              onSelect={handleCategorySelect}
              loading={loadingInitial}
            />

            {!isSearchingOrFiltering ? (
              <>
                <PromotionalBannersCarousel />

                {loadingInitial && products.length === 0 ? (
                  <ActivityIndicator style={{ marginVertical: 12 }} color="#2B8FD4" />
                ) : null}

                {error ? (
                  <Text
                    style={{
                      color: '#DC2626',
                      textAlign: 'center',
                      marginHorizontal: 16,
                      marginBottom: 12,
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* SECCIÓN A: Tiendas Mejor Rankeadas (Social Proof) */}
                {topRatedStores.length > 0 ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginHorizontal: 16, marginBottom: 8 }}>
                      Tiendas Recomendadas ⭐
                    </Text>
                    {loadingSections && topRatedStores.length === 0 ? (
                      <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#2B8FD4" />
                      </View>
                    ) : (
                      <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={topRatedStores}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                        renderItem={({ item }) => (
                          <TopRatedStoreCard
                            store={item}
                            onPress={() => router.push(`/store/${item.id}`)}
                          />
                        )}
                      />
                    )}
                  </View>
                ) : null}

                {/* SECCIÓN B: Recién Llegados */}
                {newArrivals.length > 0 ? (
                  <View
                    style={{
                      marginTop: 16,
                      backgroundColor: '#B71C1C',
                      paddingTop: 18,
                      paddingBottom: 20,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, gap: 8 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 }}>
                        Recién Llegados
                      </Text>
                      <Text style={{ fontSize: 22 }}>🔥</Text>
                    </View>
                    {loadingSections && newArrivals.length === 0 ? (
                      <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : (
                      <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={newArrivals}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                        renderItem={({ item }) => (
                          <CompactProductCard
                            product={item}
                            onPress={() => router.push(`/product/${item.id}`)}
                            isAuthenticated={isAuthenticated}
                          />
                        )}
                      />
                    )}
                  </View>
                ) : null}

                {/* SECCIÓN C: Guardado para vos (Favoritos) */}
                <View style={{ marginTop: 16, marginBottom: 8 }}>
                  {!isAuthenticated ? (
                    // Invitado: Mostrar Banner de Iniciar Sesión
                    <View style={{ marginHorizontal: 16 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
                        Guardado para vos ❤️
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          padding: 16,
                          alignItems: 'center',
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="heart-outline" size={32} color="#E11D48" style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                          Iniciá sesión para ver tus favoritos
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 8 }}>
                          Guardá tus prendas y locales favoritos de Avellaneda para acceder rápido.
                        </Text>
                        <Pressable
                          onPress={() => router.push('/(auth)/login?redirect=/(tabs)/')}
                          style={{
                            backgroundColor: '#2B8FD4',
                            paddingVertical: 8,
                            paddingHorizontal: 20,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                            Iniciar sesión
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    // Autenticado: Mostrar Favoritos (si tiene alguno)
                    (favStores.length > 0 || favProducts.length > 0) && (
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginHorizontal: 16, marginBottom: 8 }}>
                          Guardado para vos ❤️
                        </Text>
                        
                        {favStores.length > 0 && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginHorizontal: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Tus locales favoritos
                            </Text>
                            <FlatList
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              data={favStores}
                              keyExtractor={(item) => item.storeId}
                              contentContainerStyle={{ paddingHorizontal: 16 }}
                              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                              renderItem={({ item }) => (
                                <CompactFavoriteStoreCard
                                  store={item}
                                  onPress={() => router.push(`/store/${item.storeId}`)}
                                />
                              )}
                            />
                          </View>
                        )}

                        {favProducts.length > 0 && (
                          <View>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginHorizontal: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Tus prendas guardadas
                            </Text>
                            <FlatList
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              data={favProducts}
                              keyExtractor={(item) => item.productId}
                              contentContainerStyle={{ paddingHorizontal: 16 }}
                              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                              renderItem={({ item }) => {
                                const catalogProd: CatalogProduct = {
                                  id: item.productId,
                                  name: item.productName,
                                  thumbnailUrl: item.thumbnailUrl,
                                  price: item.price,
                                  storeName: item.storeName,
                                  storeId: item.storeId,
                                  ratingAvg: null,
                                  ratingCount: 0,
                                };
                                return (
                                  <CompactProductCard
                                    product={catalogProd}
                                    onPress={() => router.push(`/product/${item.productId}`)}
                                  />
                                );
                              }}
                            />
                          </View>
                        )}
                      </View>
                    )
                  )}
                </View>

                {/* SECCIÓN D: Catálogo Principal Feed */}
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
                  Descubrí Ofertas ✨
                </Text>
              </>
            ) : (
              <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
                  {debouncedSearch.trim()
                    ? `Resultados para "${debouncedSearch.trim()}"`
                    : 'Resultados filtrados'}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loadingInitial ? (
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

      <FiltersSheet
        visible={filtersVisible}
        categories={categories}
        initialFilters={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={handleApplyFilters}
      />

      <Modal
        visible={welcomeVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseWelcome}
      >
        <Pressable style={modalStyles.overlay} onPress={handleCloseWelcome}>
          <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
            {/* Botón X de Cierre */}
            <Pressable
              onPress={handleCloseWelcome}
              hitSlop={12}
              style={modalStyles.closeButton}
            >
              <Ionicons name="close" size={20} color={Colors.text.muted} />
            </Pressable>

            {/* Logo Circular */}
            <View style={modalStyles.logoContainer}>
              <Image
                source={require('../../assets/brand/Isotipewhitemode.png')}
                style={modalStyles.logo}
              />
            </View>

            {/* Título y Subtítulo */}
            <Text style={modalStyles.title}>¡Te damos la bienvenida!</Text>
            <Text style={modalStyles.subtitle}>
              OutletGo es el catálogo unificado de locales en Avellaneda que facilita tu forma de comprar.
            </Text>

            {/* Características */}
            <View style={modalStyles.features}>
              <View style={modalStyles.featureRow}>
                <View style={modalStyles.iconWrapper}>
                  <Ionicons name="cart-outline" size={20} color={Colors.brand.DEFAULT} />
                </View>
                <View style={modalStyles.featureText}>
                  <Text style={modalStyles.featureTitle}>Un solo carrito de compras</Text>
                  <Text style={modalStyles.featureDescription}>
                    Elegí prendas de múltiples tiendas y unificá todo en un único pedido coordinado.
                  </Text>
                </View>
              </View>

              <View style={modalStyles.featureRow}>
                <View style={modalStyles.iconWrapper}>
                  <Ionicons name="camera-outline" size={20} color={Colors.brand.DEFAULT} />
                </View>
                <View style={modalStyles.featureText}>
                  <Text style={modalStyles.featureTitle}>Búsqueda con foto (Lens)</Text>
                  <Text style={modalStyles.featureDescription}>
                    Subí una foto de cualquier prenda para comparar precios y encontrar stock al instante.
                  </Text>
                </View>
              </View>

              <View style={modalStyles.featureRow}>
                <View style={modalStyles.iconWrapper}>
                  <Ionicons name="map-outline" size={20} color={Colors.brand.DEFAULT} />
                </View>
                <View style={modalStyles.featureText}>
                  <Text style={modalStyles.featureTitle}>Locales físicos y chat</Text>
                  <Text style={modalStyles.featureDescription}>
                    Ubicá los comercios de la zona en el mapa interactivo y contactalos directamente.
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de Acción */}
            <Pressable
              onPress={handleCloseWelcome}
              style={({ pressed }) => [
                modalStyles.btn,
                pressed && modalStyles.btnPressed
              ]}
            >
              <Text style={modalStyles.btnText}>Comenzar a explorar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  logo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brand.dark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 6,
  },
  features: {
    marginTop: 24,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brand.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    marginTop: 2,
  },
  btn: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.brand.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.brand.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
