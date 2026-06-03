import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '../../src/components/auth/AuthButton';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';
import { extractTokenFromAuthUrl } from '../../src/lib/authRedirect';
import { Colors } from '../../src/theme/colors';

/**
 * Deep link de Google OAuth: outletgo://callback?token=...
 * También recibe el token vía query param cuando Expo Router resuelve la ruta.
 */
export default function OAuthCallbackScreen() {
  const { completeOAuthSession } = useAuth();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        let token: string | null = null;

        const rawParam = params.token;
        if (typeof rawParam === 'string') {
          token = rawParam;
        } else if (Array.isArray(rawParam) && rawParam.length > 0) {
          token = rawParam[0] ?? null;
        }

        if (!token) {
          setError('No se recibió el token de autenticación.');
          return;
        }

        await completeOAuthSession(token);
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
    })();
  }, [completeOAuthSession, params.token]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No pudimos completar el ingreso</Text>
          <Text style={styles.errorText}>{error}</Text>
          <AuthButton
            label="Volver al login"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
        <Text style={styles.loadingText}>Completando ingreso…</Text>
      </View>
    </SafeAreaView>
  );
}

/** Usado si el token llega como URL completa desde openAuthSessionAsync. */
export function parseOAuthCallbackUrl(url: string): string | null {
  return extractTokenFromAuthUrl(url);
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
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger.text,
    textAlign: 'center',
    marginBottom: 24,
  },
});
