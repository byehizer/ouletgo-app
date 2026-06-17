import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

export function CartButton() {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <Pressable
      style={styles.btn}
      onPress={() => {
        if (isAuthenticated) {
          router.push('/cart');
        } else {
          router.push('/(auth)/login?redirect=/cart');
        }
      }}
      accessibilityLabel="Carrito"
    >
      <Ionicons name="cart-outline" size={24} color={Colors.text.primary} />
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 16,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
