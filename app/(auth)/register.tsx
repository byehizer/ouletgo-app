import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrandHeader } from '../../src/components/auth/AuthBrandHeader';
import { AuthButton } from '../../src/components/auth/AuthButton';
import { AuthCard, AuthErrorBox, AuthSubtitle, AuthTitle } from '../../src/components/auth/AuthLayout';
import { AuthTextInput } from '../../src/components/auth/AuthTextInput';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleRegister = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedLastName || !trimmedEmail || !password) {
      setError('Completá todos los campos.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: trimmedName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password,
      }, redirect);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
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
        >
          <AuthBrandHeader variant="isotype" showTagline={false} />
          <AuthCard>
            <AuthTitle>Crear cuenta</AuthTitle>
            <AuthSubtitle>Registrate como comprador en OutletGo</AuthSubtitle>

            {error ? <AuthErrorBox message={error} /> : null}

            <AuthTextInput label="Nombre" value={name} onChangeText={setName} placeholder="Juan" />
            <AuthTextInput label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Pérez" />
            <AuthTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="tu@email.com"
            />
            <AuthTextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            />

            <AuthButton label="Registrarme" loading={loading} onPress={handleRegister} />
          </AuthCard>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{ alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ fontSize: 14, color: '#64748B' }}>¿Ya tenés cuenta?</Text>
            <Text style={{ fontSize: 15, color: '#2B8FD4', fontWeight: '600', marginTop: 4 }}>
              Iniciá sesión
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
