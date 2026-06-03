import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FavoriteProductMeta, FavoriteStoreMeta } from '../api/favoritesApi';
import { useFavorite } from '../hooks/useFavorite';
import { Colors } from '../theme/colors';

type FavoriteButtonProps =
  | {
      type: 'product';
      targetId: string;
      meta: FavoriteProductMeta;
      variant?: 'icon' | 'row';
    }
  | {
      type: 'store';
      targetId: string;
      meta: FavoriteStoreMeta;
      variant?: 'icon' | 'row';
    };

export function FavoriteButton(props: FavoriteButtonProps) {
  const { type, targetId, meta, variant = 'icon' } = props;
  const { isFavorite, loading, toggling, toggle } = useFavorite(type, targetId, meta);

  const handlePress = () => {
    void (async () => {
      try {
        await toggle();
      } catch (e) {
        Alert.alert(
          'Favoritos',
          e instanceof Error ? e.message : 'No se pudo actualizar el favorito.',
        );
      }
    })();
  };

  if (variant === 'row') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading || toggling}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        {loading || toggling ? (
          <ActivityIndicator size="small" color={Colors.brand.DEFAULT} />
        ) : (
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? Colors.danger.DEFAULT : Colors.brand.DEFAULT}
          />
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>
            {isFavorite ? 'En tus favoritos' : 'Agregar a favoritos'}
          </Text>
          <Text style={styles.rowHint}>Lo ves en Perfil → Favoritos</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || toggling}
      hitSlop={10}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      {loading || toggling ? (
        <ActivityIndicator size="small" color={Colors.brand.DEFAULT} />
      ) : (
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? Colors.danger.DEFAULT : Colors.text.secondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  iconBtnPressed: {
    opacity: 0.88,
    backgroundColor: Colors.brand.bgLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    marginTop: 12,
  },
  rowPressed: {
    opacity: 0.9,
    backgroundColor: Colors.brand.bgLight,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  rowHint: {
    fontSize: 12,
    color: Colors.text.muted,
  },
});
