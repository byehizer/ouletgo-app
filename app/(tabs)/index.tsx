import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { fetchTopRatedStores, type TopRatedStore } from '../../src/api/storeApi';
import {
  fetchFavoriteProducts,
  fetchFavoriteStores,
  type FavoriteProduct,
  type FavoriteStore,
} from '../../src/api/favoritesApi';
import { formatARS } from '../../src/lib/format';

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginRight: 10,
        alignItems: 'center',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: '#E8F4FD',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 1,
          borderColor: '#5AAEE0',
          overflow: 'hidden',
        }}
      >
        {store.imageUrl ? (
          <Image
            source={{ uri: store.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="storefront-outline" size={24} color="#2B8FD4" />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center', width: '100%' }}
      >
        {store.name}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'center', width: '100%' }}
      >
        {store.address ? store.address.split(',')[0] : 'Avellaneda'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#0F172A' }}>
          {store.ratingAvg != null ? store.ratingAvg.toFixed(1) : '—'}
        </Text>
        <Text style={{ fontSize: 10, color: '#64748B' }}>
          ({store.ratingCount})
        </Text>
      </View>
    </Pressable>
  );
}

// Tarjeta horizontal compacta de producto para "Recién Llegados" y "Favoritos"
function CompactProductCard({ product, onPress }: { product: CatalogProduct; onPress: () => void }) {
  const rating =
    product.ratingAvg != null
      ? `${product.ratingAvg.toFixed(1)} (${product.ratingCount})`
      : 'Sin res.';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginRight: 10,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          height: 90,
          backgroundColor: '#E8F4FD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {product.thumbnailUrl ? (
          <Image
            source={{ uri: product.thumbnailUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="shirt-outline" size={28} color="#2B8FD4" />
        )}
      </View>
      <View style={{ padding: 8 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}
        >
          {product.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}
        >
          {product.storeName}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A3F7A' }}>
            {formatARS(product.price)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={{ fontSize: 9, color: '#64748B' }}>{rating}</Text>
          </View>
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
        width: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginRight: 10,
        alignItems: 'center',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#FFF1F2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 1,
          borderColor: '#FDA4AF',
        }}
      >
        <Ionicons name="heart" size={24} color="#E11D48" />
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center', width: '100%' }}
      >
        {store.storeName}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center', width: '100%' }}
      >
        {store.address ? store.address.split(',')[0] : 'Avellaneda'}
      </Text>
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
      const [topRated, arrivals] = await Promise.all([
        fetchTopRatedStores(6),
        fetchNewArrivals(6),
      ]);
      setTopRatedStores(topRated);
      setNewArrivals(arrivals);

      if (isAuthenticated) {
        const [favProds, favSts] = await Promise.all([
          fetchFavoriteProducts(),
          fetchFavoriteStores(),
        ]);
        setFavProducts(favProds);
        setFavStores(favSts);
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

  // Efecto inicial de carga
  useEffect(() => {
    void (async () => {
      setLoadingInitial(true);
      await Promise.all([
        loadCategories(),
        loadProducts(0, true),
        loadHomeSections(),
      ]);
      setLoadingInitial(false);
    })();
  }, [loadHomeSections]);

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
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFilterPress={() => setFiltersVisible(true)}
              onLensPress={() => router.push('/search/visual')}
              activeFilterCount={activeFilterCount}
            />

            {USE_MOCKS ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  backgroundColor: '#E8F4FD',
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: '#5AAEE0',
                }}
              >
                <Text style={{ fontSize: 12, color: '#1A3F7A', textAlign: 'center' }}>
                  Catálogo demo — probá buscar "remera" o filtrar por talle M
                </Text>
              </View>
            ) : null}

            <CategoryChips
              categories={categories}
              selectedId={filters.categoryId}
              onSelect={handleCategorySelect}
              loading={loadingInitial}
            />

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
                  renderItem={({ item }) => (
                    <TopRatedStoreCard
                      store={item}
                      onPress={() => router.push(`/store/${item.id}`)}
                    />
                  )}
                />
              )}
            </View>

            {/* SECCIÓN B: Recién Llegados */}
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginHorizontal: 16, marginBottom: 8 }}>
                Recién Llegados 🔥
              </Text>
              {loadingSections && newArrivals.length === 0 ? (
                <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#2B8FD4" />
                </View>
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={newArrivals}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                  renderItem={({ item }) => (
                    <CompactProductCard
                      product={item}
                      onPress={() => router.push(`/product/${item.id}`)}
                    />
                  )}
                />
              )}
            </View>

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
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
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
          </View>
        </View>
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
