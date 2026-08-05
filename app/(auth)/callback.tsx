import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '../../src/components/auth/AuthButton';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';
import { extractTokenFromAuthUrl } from '../../src/lib/authRedirect';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme/colors';

/**
 * Deep link de Google OAuth: outletgo://callback?token=... (flujo backend)
 * o outletgo://callback#access_token=...&refresh_token=... (flujo Supabase)
 */
export default function OAuthCallbackScreen() {
  const { completeOAuthSession } = useAuth();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        // ── Flujo 1: token de backend en query param (?token=...) ──────────
        const rawParam = params.token;
        let token: string | null = null;
        if (typeof rawParam === 'string') {
          token = rawParam;
        } else if (Array.isArray(rawParam) && rawParam.length > 0) {
          token = rawParam[0] ?? null;
        }

        if (token) {
          await completeOAuthSession(token);
          return;
        }

        // ── Flujo 2: Supabase OAuth con hash en la URL (#access_token=...) ─
        let session = null;

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('#')) {
          const hash = initialUrl.split('#')[1];
          const urlParams = new URLSearchParams(hash);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const res = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            session = res.data?.session;
          }
        }

        if (!session) {
          session = (await supabase.auth.getSession()).data?.session;
        }

        if (session?.user?.email) {
          const email = session.user.email;
          const name =
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            null;
          const avatarUrl =
            session.user.user_metadata?.avatar_url ??
            session.user.user_metadata?.picture ??
            null;

          const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
          const backendRes = await fetch(`${backendUrl}/api/auth/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, avatarUrl }),
          });

          if (!backendRes.ok) {
            const errBody = await backendRes.text();
            throw new Error(`Error del servidor: ${errBody}`);
          }

          const { token: appToken } = await backendRes.json();
          await completeOAuthSession(appToken);
          return;
        }

        setError('No se recibió el token de autenticación.');
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
