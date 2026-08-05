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
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    async function registerForPushNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Permisos de notificaciones rechazados.');
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

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        if (isMounted && token) {
          await savePushToken(token);
        }
      } catch (error) {
        console.log('Error registrando notificaciones push:', error);
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
