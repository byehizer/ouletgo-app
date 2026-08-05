import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD } from '../../src/api/mock/constants';
import { AuthBrandHeader } from '../../src/components/auth/AuthBrandHeader';
import { AuthButton } from '../../src/components/auth/AuthButton';
import { AuthTextInput } from '../../src/components/auth/AuthTextInput';
import { USE_MOCKS } from '../../src/config/env';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [email, setEmail] = useState(USE_MOCKS ? MOCK_DEMO_EMAIL : '');
  const [password, setPassword] = useState(USE_MOCKS ? MOCK_DEMO_PASSWORD : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (redirect === '/profile' || redirect === '/orders' || redirect === '/messages') {
        router.replace('/(tabs)');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [redirect]);

  const handleBack = () => {
    if (redirect === '/profile' || redirect === '/orders' || redirect === '/messages') {
      router.replace('/(tabs)');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Completá email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: trimmedEmail, password }, redirect);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header Fijo */}
      <View
        style={{
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              justifyContent: 'center',
              alignItems: 'center',
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color="#475569" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
          }}
        >
          <View style={{ width: '100%', alignItems: 'center' }}>
            {/* Logo */}
            <AuthBrandHeader />

            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#0F172A',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Iniciá sesión
            </Text>

            {USE_MOCKS ? (
              <View
                style={{
                  width: '100%',
                  backgroundColor: '#E8F4FD',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#5AAEE0',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A3F7A', marginBottom: 2 }}>
                  Modo demo
                </Text>
                <Text style={{ fontSize: 12, color: '#475569' }}>
                  {MOCK_DEMO_EMAIL} | {MOCK_DEMO_PASSWORD}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={{
                  width: '100%',
                  backgroundColor: '#FEF2F2',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#FECACA',
                }}
              >
                <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ width: '100%' }}>
              <AuthTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                placeholder="tu@email.com"
              />

              <AuthTextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                placeholder="Tu contraseña"
              />
            </View>

            <View style={{ width: '100%', marginTop: 4 }}>
              <AuthButton label="Ingresar" loading={loading} onPress={handleLogin} />
            </View>

            <Pressable
              onPress={() => router.push('/(auth)/recover')}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 13, color: '#1A3F7A', fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 10,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>o</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            <View style={{ width: '100%' }}>
              <AuthButton
                label="Continuar con Google"
                variant="secondary"
                loading={googleLoading}
                onPress={handleGoogle}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>
              ¿No tenés cuenta?{' '}
              <Text
                onPress={() => router.push('/(auth)/register')}
                style={{ color: '#2B8FD4', fontWeight: '700' }}
              >
                Registrate gratis
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
