import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import type { CatalogProduct } from '../api/catalogApi';
import { formatARS } from '../lib/format';
import { formatDistanceKm } from '../lib/location';

interface ProductCardProps {
  product: CatalogProduct;
  onPress?: (product: CatalogProduct) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const rating =
    product.ratingAvg != null
      ? `${product.ratingAvg.toFixed(1)} (${product.ratingCount})`
      : 'Sin reseñas';

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
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={{ fontSize: 11, color: '#64748B' }}>{rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
