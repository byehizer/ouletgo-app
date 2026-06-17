import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchFavoriteProducts, fetchFavoriteStores } from '../../src/api/favoritesApi';
import { fetchUnreadReportCount } from '../../src/api/reportApi';
import { deactivateAccount } from '../../src/api/userApi';
import { AuthButton } from '../../src/components/auth/AuthButton';
import { ProfileMenuCard } from '../../src/components/profile/ProfileMenuCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { getAuthErrorMessage, useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [favCount, setFavCount] = useState(0);
  const [unreadReports, setUnreadReports] = useState(0);

  const fullName = [user?.name, user?.lastName].filter(Boolean).join(' ') || 'Comprador';

  const loadCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [p, s, unread] = await Promise.all([
        fetchFavoriteProducts(),
        fetchFavoriteStores(),
        fetchUnreadReportCount(),
      ]);
      setFavCount(p.length + s.length);
      setUnreadReports(unread);
    } catch {
      setFavCount(0);
      setUnreadReports(0);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !isAuthenticated) {
        const t = setTimeout(() => {
          router.replace(('/(auth)/login?redirect=' + encodeURIComponent('/profile')) as any);
        }, 150);
        return () => clearTimeout(t);
      }
      if (!isAuthenticated) return;
      void loadCounts();
    }, [loadCounts, authLoading, isAuthenticated]),
  );

  if (authLoading || !isAuthenticated) return <LoadingScreen />;

  const handleDeactivate = () => {
    Alert.alert(
      'Desactivar cuenta',
      'Tu cuenta quedará inactiva y no podrás iniciar sesión. ¿Querés continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deactivateAccount();
                await logout();
              } catch (err) {
                Alert.alert('Error', getAuthErrorMessage(err));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        Guardá productos y tiendas con el corazón en cada detalle. Los ves acá en Favoritos.
      </Text>

      <Pressable
        onPress={() => router.push('/profile/edit')}
        style={({ pressed }) => [styles.headerCard, pressed && styles.cardPressed]}
      >
        <View style={styles.headerInner}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color={Colors.brand.DEFAULT} />
            </View>
          )}
          <View style={styles.headerBody}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
            <Text style={styles.editLink}>Editar perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
        </View>
      </Pressable>

      <View style={styles.list}>
        <ProfileMenuCard
          icon="create-outline"
          title="Datos personales"
          subtitle="Nombre, apellido y foto"
          onPress={() => router.push('/profile/edit')}
        />
        <ProfileMenuCard
          icon="mail-outline"
          title="Email y contraseña"
          subtitle="Cambiar email o actualizar contraseña"
          onPress={() => router.push('/profile/edit')}
        />
        <ProfileMenuCard
          icon="heart"
          title="Favoritos"
          subtitle="Productos y tiendas que guardaste con el corazón"
          badge={favCount > 0 ? String(favCount) : undefined}
          onPress={() => router.push('/profile/favorites')}
        />
        <ProfileMenuCard
          icon="flag-outline"
          title="Mis reportes"
          subtitle="Estado de reportes y respuesta del equipo"
          badge={unreadReports > 0 ? String(unreadReports) : undefined}
          onPress={() => router.push('/profile/reports')}
        />
      </View>

      <View style={styles.sessionBlock}>
        <AuthButton label="Cerrar sesión" variant="secondary" onPress={() => void logout()} />
        <ProfileMenuCard
          icon="warning-outline"
          title="Desactivar cuenta"
          subtitle="Tu cuenta dejará de estar activa"
          onPress={handleDeactivate}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 12,
    marginTop: 4,
  },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.surface.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.bgLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  email: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.DEFAULT,
    marginTop: 6,
  },
  list: {
    gap: 12,
  },
  sessionBlock: {
    marginTop: 24,
    gap: 12,
  },
});
