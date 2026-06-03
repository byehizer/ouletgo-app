import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface CartEmptyStateProps {
  onBrowse: () => void;
}

export function CartEmptyState({ onBrowse }: CartEmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#E8F4FD',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="cart-outline" size={40} color="#2B8FD4" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
        Tu carrito está vacío
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#64748B',
          textAlign: 'center',
          marginTop: 10,
          lineHeight: 21,
        }}
      >
        Explorá el catálogo y agregá productos de distintas tiendas. Retirás en cada local por
        separado.
      </Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => ({
          marginTop: 28,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? '#1A6FA8' : '#2B8FD4',
        })}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Explorar productos</Text>
      </Pressable>
    </View>
  );
}
