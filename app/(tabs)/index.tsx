import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  fetchCatalogProducts,
  fetchCategories,
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
  type CatalogFilterState,
} from '../../src/types/catalogFilters';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const columnGap = 12;
  const horizontalPad = 16;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
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

  useEffect(() => {
    void (async () => {
      setLoadingInitial(true);
      await loadCategories();
      await loadProducts(0, true);
      setLoadingInitial(false);
    })();
  }, []);

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

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setFilters((prev) => ({ ...prev, categoryId }));
  }, []);

  const handleApplyFilters = useCallback(
    (next: CatalogFilterState, nextCoords: Coordinates | null) => {
      setFilters(next);
      setCoords(nextCoords);
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(0, true);
    setRefreshing(false);
  }, [loadProducts]);

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
              <ActivityIndicator style={{ marginVertical: 24 }} color="#2B8FD4" />
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
    </View>
  );
}
