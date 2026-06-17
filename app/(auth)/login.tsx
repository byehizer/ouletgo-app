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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA', position: 'relative' }}>
      {/* Botón Volver */}
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 12 : 16,
            left: 16,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="arrow-back" size={18} color="#475569" />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Volver</Text>
      </Pressable>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <AuthBrandHeader />

          {/* Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              Iniciá sesión
            </Text>

            {USE_MOCKS ? (
              <View
                style={{
                  backgroundColor: '#E8F4FD',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#5AAEE0',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A3F7A', marginBottom: 6 }}>
                  Modo demo
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                  {MOCK_DEMO_EMAIL}{'\n'}
                  {MOCK_DEMO_PASSWORD}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#FECACA',
                }}
              >
                <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{error}</Text>
              </View>
            ) : null}

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

            <AuthButton label="Ingresar" loading={loading} onPress={handleLogin} />

            <Pressable
              onPress={() => router.push('/(auth)/recover')}
              style={{ alignItems: 'center', paddingVertical: 4, marginBottom: 8 }}
            >
              <Text style={{ fontSize: 14, color: '#1A3F7A', fontWeight: '500' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 16,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>o</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            <AuthButton
              label="Continuar con Google"
              variant="secondary"
              loading={googleLoading}
              onPress={handleGoogle}
            />
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 14, color: '#64748B' }}>¿No tenés cuenta?</Text>
            <Pressable onPress={() => router.push('/(auth)/register')} style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 15, color: '#2B8FD4', fontWeight: '600' }}>
                Registrate gratis
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
