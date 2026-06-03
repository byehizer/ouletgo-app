import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  fetchFavoriteProducts,
  fetchFavoriteStores,
  removeFavoriteProduct,
  removeFavoriteStore,
  type FavoriteProduct,
  type FavoriteStore,
} from '../../src/api/favoritesApi';
import { formatARS } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

type Tab = 'products' | 'stores';

export default function FavoritesScreen() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [stores, setStores] = useState<FavoriteStore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, strs] = await Promise.all([
        fetchFavoriteProducts(),
        fetchFavoriteStores(),
      ]);
      setProducts(prods);
      setStores(strs);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los favoritos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmRemoveProduct = (item: FavoriteProduct) => {
    Alert.alert('Quitar de favoritos', `¿Quitar "${item.productName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeFavoriteProduct(item.productId);
              setProducts((prev) => prev.filter((p) => p.productId !== item.productId));
            } catch {
              Alert.alert('Error', 'No se pudo quitar el favorito.');
            }
          })();
        },
      },
    ]);
  };

  const confirmRemoveStore = (item: FavoriteStore) => {
    Alert.alert('Quitar de favoritos', `¿Quitar "${item.storeName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeFavoriteStore(item.storeId);
              setStores((prev) => prev.filter((s) => s.storeId !== item.storeId));
            } catch {
              Alert.alert('Error', 'No se pudo quitar el favorito.');
            }
          })();
        },
      },
    ]);
  };

  const emptyHint =
    tab === 'products'
      ? 'En cualquier producto tocá el corazón para guardarlo acá.'
      : 'En el perfil de una tienda tocá el corazón para guardarla acá.';

  return (
    <>
      <Stack.Screen options={{ title: 'Favoritos' }} />
      <Text style={styles.topHint}>
        Los favoritos se agregan desde el corazón en cada producto o tienda.
      </Text>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('products')}
          style={[styles.tab, tab === 'products' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'products' && styles.tabTextActive]}>
            Productos ({products.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('stores')}
          style={[styles.tab, tab === 'stores' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'stores' && styles.tabTextActive]}>
            Tiendas ({stores.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
        </View>
      ) : tab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={36} color={Colors.brand.DEFAULT} />
              </View>
              <Text style={styles.emptyTitle}>Sin productos favoritos</Text>
              <Text style={styles.empty}>{emptyHint}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/product/${item.productId}`)}
            >
              <View style={styles.cardInner}>
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="shirt-outline" size={24} color={Colors.brand.DEFAULT} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.cardSub}>{item.storeName}</Text>
                  <Text style={styles.price}>{formatARS(item.price)}</Text>
                </View>
                <Pressable
                  onPress={() => confirmRemoveProduct(item)}
                  hitSlop={12}
                >
                  <Ionicons name="heart" size={22} color={Colors.danger.DEFAULT} />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.storeId}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="storefront-outline" size={36} color={Colors.brand.DEFAULT} />
              </View>
              <Text style={styles.emptyTitle}>Sin tiendas favoritas</Text>
              <Text style={styles.empty}>{emptyHint}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/store/${item.storeId}`)}
            >
              <View style={styles.cardInner}>
                <View style={[styles.thumb, styles.storeThumb]}>
                  <Ionicons name="storefront-outline" size={24} color={Colors.brand.DEFAULT} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.storeName}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {item.address}
                  </Text>
                  {item.ratingAvg != null ? (
                    <Text style={styles.rating}>
                      ★ {item.ratingAvg.toFixed(1)} ({item.ratingCount})
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={() => confirmRemoveStore(item)} hitSlop={12}>
                  <Ionicons name="heart" size={22} color={Colors.danger.DEFAULT} />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
              </View>
            </Pressable>
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    lineHeight: 19,
    backgroundColor: Colors.surface.base,
  },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.neutral.bg,
  },
  tabActive: {
    backgroundColor: Colors.brand.bgLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.brand.dark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 12,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  empty: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.surface.card,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.brand.bgLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginTop: 4,
  },
  rating: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
