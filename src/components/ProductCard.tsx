import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';

import type { CatalogProduct } from '../api/catalogApi';
import { useFavorite } from '../hooks/useFavorite';
import { formatARS } from '../lib/format';
import { formatDistanceKm } from '../lib/location';

interface ProductCardProps {
  product: CatalogProduct;
  onPress?: (product: CatalogProduct) => void;
  isAuthenticated?: boolean;
}

export function ProductCard({ product, onPress, isAuthenticated = false }: ProductCardProps) {
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
  const ratingCount = product.ratingCount ?? 0;

  return (
    <Pressable
      onPress={() => onPress?.(product)}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 12,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          height: 140,
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
          <Ionicons name="shirt-outline" size={40} color="#2B8FD4" />
        )}

        <Pressable
          onPress={handleFavoritePress}
          disabled={toggling}
          hitSlop={8}
          style={({ pressed }) => ({
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.95)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || toggling ? 0.75 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          })}
        >
          {toggling ? (
            <ActivityIndicator size="small" color="#E11D48" />
          ) : (
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color="#E11D48"
            />
          )}
        </Pressable>
      </View>

      <View style={{ padding: 12 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', minHeight: 40 }}
        >
          {product.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}
        >
          {product.storeName}
          {product.distanceKm != null ? ` · ${formatDistanceKm(product.distanceKm)}` : ''}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A3F7A' }}>
            {formatARS(product.price)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={12} color={hasRating ? '#F59E0B' : '#94A3B8'} />
            <Text style={{ fontSize: 11, color: '#64748B' }}>
              {ratingText} ({ratingCount})
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
