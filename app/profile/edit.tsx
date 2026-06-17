import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthButton } from '../../src/components/auth/AuthButton';
import { AuthTextInput } from '../../src/components/auth/AuthTextInput';
import {
  changePassword,
  updateEmail,
  updateProfile,
} from '../../src/api/userApi';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';
import { uploadAvatar } from '../../src/lib/imageUpload';
import { Colors } from '../../src/theme/colors';

const MIN_PASSWORD = 8;

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function EditProfileScreen() {
  const { user, updateSessionUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayAvatar = localAvatarUri ?? avatarUri;

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Permití el acceso a fotos para cambiar tu avatar.');
      return;
    }
    try {
      StatusBar.setHidden(true, 'fade');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setLocalAvatarUri(result.assets[0].uri);
      }
    } finally {
      StatusBar.setHidden(false, 'fade');
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedName || !trimmedLastName) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    setLoadingProfile(true);
    setError(null);
    try {
      let nextAvatar = avatarUri;
      if (localAvatarUri) {
        const uploaded = await uploadAvatar(localAvatarUri);
        nextAvatar = uploaded.url;
        setAvatarUri(nextAvatar);
        setLocalAvatarUri(null);
      }
      const updated = await updateProfile({
        name: trimmedName,
        lastName: trimmedLastName,
        avatarUrl: nextAvatar,
      });
      await updateSessionUser(updated);
      Alert.alert('Listo', 'Tus datos se actualizaron.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setError('Ingresá un email válido.');
      return;
    }
    if (!emailPassword) {
      setError('Ingresá tu contraseña actual para cambiar el email.');
      return;
    }
    setLoadingEmail(true);
    setError(null);
    try {
      const updated = await updateEmail({ email, currentPassword: emailPassword });
      await updateSessionUser(updated);
      setEmailPassword('');
      Alert.alert('Listo', 'Tu email se actualizó.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setError('Ingresá tu contraseña actual.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD) {
      setError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setLoadingPassword(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Listo', 'Tu contraseña se actualizó.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Editar perfil' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <SectionCard title="Datos personales">
            <Pressable onPress={() => void pickAvatar()} style={styles.avatarWrap}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={44} color={Colors.brand.DEFAULT} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tocá la foto para cambiarla</Text>

            <AuthTextInput label="Nombre" value={name} onChangeText={setName} />
            <AuthTextInput label="Apellido" value={lastName} onChangeText={setLastName} />
            <AuthButton
              label="Guardar datos"
              onPress={() => void handleSaveProfile()}
              loading={loadingProfile}
              disabled={loadingProfile}
            />
          </SectionCard>

          <SectionCard title="Email">
            <Text style={styles.sectionHint}>
              Para cambiar el email necesitás confirmar con tu contraseña actual.
            </Text>
            <AuthTextInput
              label="Nuevo email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AuthTextInput
              label="Contraseña actual"
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
            />
            <AuthButton
              label="Actualizar email"
              variant="secondary"
              onPress={() => void handleSaveEmail()}
              loading={loadingEmail}
              disabled={loadingEmail}
            />
          </SectionCard>

          <SectionCard title="Contraseña">
            <AuthTextInput
              label="Contraseña actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <AuthTextInput
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <AuthTextInput
              label="Repetir nueva contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <AuthButton
              label="Cambiar contraseña"
              variant="secondary"
              onPress={() => void handleChangePassword()}
              loading={loadingPassword}
              disabled={loadingPassword}
            />
          </SectionCard>

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Volver al perfil</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface.base },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  sectionCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.bgLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.light,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface.card,
  },
  avatarHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  error: {
    color: Colors.danger.text,
    fontSize: 14,
    textAlign: 'center',
    padding: 12,
    backgroundColor: Colors.danger.bg,
    borderRadius: 10,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    color: Colors.brand.DEFAULT,
    fontWeight: '600',
    fontSize: 15,
  },
});
