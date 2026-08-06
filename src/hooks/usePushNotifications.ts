import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { savePushToken } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

// Configurar cómo se comportan las notificaciones cuando la app está abierta en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    async function registerForPushNotifications() {
      try {
        console.log('[MOBILE-PUSH] 1. Solicitando permisos de notificación al SO...');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        console.log('[MOBILE-PUSH] Permisos de notificación:', finalStatus);

        if (finalStatus !== 'granted') {
          console.warn('[MOBILE-PUSH] ⚠️ Permisos de notificaciones RECHAZADOS por el usuario.');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        console.log('[MOBILE-PUSH] 2. Solicitando Expo Push Token (DNI de este celular)...');
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        console.log('[MOBILE-PUSH] 🔑 DNI (Expo Push Token) obtenido:', token);

        if (isMounted && token) {
          console.log('[MOBILE-PUSH] 3. Guardando DNI en el Servidor Backend (/api/buyer/me/push-token)...');
          await savePushToken(token);
          console.log('[MOBILE-PUSH] ✅ DNI guardado con éxito en el backend para el usuario actual.');
        }
      } catch (error) {
        console.error('[MOBILE-PUSH] ❌ Error durante el registro de notificaciones push:', error);
      }
    }

    void registerForPushNotifications();

    // Listener para cuando el usuario toca la notificación push recibida
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data.conversationId === 'string') {
        router.push({
          pathname: '/messages/[conversationId]',
          params: { conversationId: data.conversationId },
        });
      }
    });

    return () => {
      isMounted = false;
      responseSubscription.remove();
    };
  }, [isAuthenticated]);
}
