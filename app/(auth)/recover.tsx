import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrandHeader } from '../../src/components/auth/AuthBrandHeader';
import { AuthButton } from '../../src/components/auth/AuthButton';
import { AuthCard, AuthErrorBox, AuthSubtitle, AuthTitle } from '../../src/components/auth/AuthLayout';
import { AuthTextInput } from '../../src/components/auth/AuthTextInput';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';

export default function RecoverScreen() {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Ingresá tu email.');
      return;
    }
    setLoading(true);
    try {
      await recoverPassword(trimmedEmail);
      setSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <AuthBrandHeader variant="isotype" showTagline={false} />
          <AuthCard>
            <AuthTitle>Revisá tu correo</AuthTitle>
            <AuthSubtitle>
              Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
            </AuthSubtitle>
            <AuthButton label="Volver al login" onPress={() => router.replace('/(auth)/login')} />
          </AuthCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
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
            <AuthTitle>Recuperar contraseña</AuthTitle>
            <AuthSubtitle>Te enviaremos un enlace si el email está registrado</AuthSubtitle>

            {error ? <AuthErrorBox message={error} /> : null}

            <AuthTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="tu@email.com"
            />

            <AuthButton label="Enviar enlace" loading={loading} onPress={handleRecover} />
          </AuthCard>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{ alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ fontSize: 15, color: '#1A3F7A', fontWeight: '500' }}>Volver al login</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
