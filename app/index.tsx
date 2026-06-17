import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/colors';

/** Gate de sesión: redirige a la app de forma segura tras cargar la sesión. */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
        <Text style={styles.text}>Cargando…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
