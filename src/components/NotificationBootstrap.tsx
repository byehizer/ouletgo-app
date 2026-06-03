/**
 * Configura listeners de push y navegación por deep link.
 * Montar una vez dentro de AuthProvider cuando el usuario está autenticado.
 */
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import {
  addNotificationResponseListener,
  getInitialNotificationDeepLink,
  registerForPushNotifications,
  unregisterPushNotifications,
  type NotificationDeepLink,
} from '../lib/notifications';

function navigateToDeepLink(link: NotificationDeepLink): void {
  if (link.params) {
    router.push({
      pathname: link.pathname as never,
      params: link.params as never,
    });
  } else {
    router.push(link.pathname as never);
  }
}

export function NotificationBootstrap() {
  const { isAuthenticated, isLoading } = useAuth();
  const registeredRef = useRef(false);
  const initialHandledRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      if (!isAuthenticated && registeredRef.current) {
        void unregisterPushNotifications();
        registeredRef.current = false;
      }
      return;
    }

    void (async () => {
      const token = await registerForPushNotifications();
      if (token) registeredRef.current = true;
    })();

    const removeResponse = addNotificationResponseListener(navigateToDeepLink);

    return () => {
      removeResponse();
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || initialHandledRef.current) return;

    void (async () => {
      const link = await getInitialNotificationDeepLink();
      initialHandledRef.current = true;
      if (link) {
        // Pequeño delay para que el router esté listo tras cold start
        setTimeout(() => navigateToDeepLink(link), 300);
      }
    })();
  }, [isAuthenticated, isLoading]);

  return null;
}
