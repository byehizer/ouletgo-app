/**
 * notifications.ts — Expo Notifications + deep links.
 *
 * Payload que envía el backend en `data` (ver docs/MOBILE_API_CONTRACT.md §9):
 *   type: 'ORDER_STATUS' | 'CHAT_MESSAGE' | 'REFUND' | 'ADMIN' | 'REPORT'
 *   orderId?: string
 *   conversationId?: string
 *   reportId?: string
 *   orderStatus?: OrderStatus
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  registerPushTokenOnBackend,
  unregisterPushTokenOnBackend,
} from '../api/notificationApi';
import type { OrderStatus } from '../api/types';

const PUSH_TOKEN_KEY = 'outletgo_push_token';

export type NotificationType = 'ORDER_STATUS' | 'CHAT_MESSAGE' | 'REFUND' | 'ADMIN' | 'REPORT';

export interface NotificationPayload {
  type: NotificationType;
  orderId?: string;
  conversationId?: string;
  reportId?: string;
  orderStatus?: OrderStatus;
}

/** Rutas Expo Router derivadas del payload. */
export interface NotificationDeepLink {
  pathname: string;
  params?: Record<string, string>;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('orders', {
    name: 'Pedidos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#2B8FD4',
  });
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Mensajes',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#2B8FD4',
  });
}

/**
 * Solicita permiso, obtiene Expo push token y lo registra en el backend.
 * Devuelve null si el usuario rechazó permisos o no hay token (simulador, web).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const projectId = getExpoProjectId();
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;
    const platform = Platform.OS as 'ios' | 'android';

    await registerPushTokenOnBackend({ token, platform });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch {
    // Expo Go / simulador sin credenciales de push
    if (__DEV__) return null;
    throw new Error('No se pudo activar las notificaciones push.');
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token) {
    await unregisterPushTokenOnBackend(token);
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

function parsePayload(data: unknown): NotificationPayload | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const type = raw['type'];
  if (
    type !== 'ORDER_STATUS' &&
    type !== 'CHAT_MESSAGE' &&
    type !== 'REFUND' &&
    type !== 'ADMIN' &&
    type !== 'REPORT'
  ) {
    return null;
  }
  return {
    type,
    orderId: typeof raw['orderId'] === 'string' ? raw['orderId'] : undefined,
    conversationId:
      typeof raw['conversationId'] === 'string' ? raw['conversationId'] : undefined,
    reportId: typeof raw['reportId'] === 'string' ? raw['reportId'] : undefined,
    orderStatus:
      typeof raw['orderStatus'] === 'string'
        ? (raw['orderStatus'] as OrderStatus)
        : undefined,
  };
}

/** Convierte el payload del backend en una ruta de la app. */
export function getDeepLinkFromPayload(payload: NotificationPayload): NotificationDeepLink {
  switch (payload.type) {
    case 'ORDER_STATUS':
    case 'REFUND':
      if (payload.orderId) {
        return { pathname: '/orders/[id]', params: { id: payload.orderId } };
      }
      return { pathname: '/(tabs)/orders' };
    case 'CHAT_MESSAGE':
      if (payload.conversationId) {
        return {
          pathname: '/messages/[conversationId]',
          params: { conversationId: payload.conversationId },
        };
      }
      return { pathname: '/(tabs)/messages' };
    case 'REPORT':
      if (payload.reportId) {
        return {
          pathname: '/profile/reports',
          params: { highlight: payload.reportId },
        };
      }
      return { pathname: '/profile/reports' };
    case 'ADMIN':
    default:
      return { pathname: '/(tabs)' };
  }
}

export function getDeepLinkFromNotificationData(
  data: unknown,
): NotificationDeepLink | null {
  const payload = parsePayload(data);
  if (!payload) return null;
  return getDeepLinkFromPayload(payload);
}

/** Listener al tocar una notificación (app en background o cerrada). */
export function addNotificationResponseListener(
  onNavigate: (link: NotificationDeepLink) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = getDeepLinkFromNotificationData(
      response.notification.request.content.data,
    );
    if (link) onNavigate(link);
  });
  return () => sub.remove();
}

/** Notificación recibida con la app en primer plano (opcional: analytics / badge). */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
): () => void {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}

/**
 * Si la app se abrió desde una notificación (cold start), devuelve el deep link.
 */
export async function getInitialNotificationDeepLink(): Promise<NotificationDeepLink | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return getDeepLinkFromNotificationData(response.notification.request.content.data);
}

/**
 * Textos de referencia para el backend al armar el push (documentación viva).
 * El backend envía title/body; estos son los mensajes acordados por estado.
 */
export const ORDER_STATUS_PUSH_COPY: Partial<Record<OrderStatus, { title: string; body: string }>> =
  {
    PAID: {
      title: 'Pago confirmado',
      body: 'Tu pedido fue confirmado. Las tiendas empiezan a prepararlo.',
    },
    PREPARING: {
      title: 'Preparando tu pedido',
      body: 'Las tiendas están armando tu compra.',
    },
    COLLECTING: {
      title: 'OutletGo en camino',
      body: 'Estamos buscando tus productos en cada tienda.',
    },
    CONSOLIDATED: {
      title: 'Pedido consolidado',
      body: 'Ya tenemos todo junto. Pronto te avisamos para retiro o envío.',
    },
    READY_FOR_PICKUP: {
      title: 'Listo para retirar',
      body: 'Tu pedido te espera en el punto OutletGo.',
    },
    IN_TRANSIT: {
      title: 'Envío en camino',
      body: 'Tu pedido va en camino a tu domicilio.',
    },
    DELIVERED: {
      title: '¡Pedido entregado!',
      body: 'Contanos cómo fue tu experiencia.',
    },
    STOCK_ISSUE: {
      title: 'Actualización de tu pedido',
      body: 'Hubo un problema de stock en una tienda. Revisá el detalle.',
    },
    CANCELED: {
      title: 'Pedido cancelado',
      body: 'Tu pedido fue cancelado.',
    },
  };

export const CHAT_MESSAGE_PUSH_COPY = {
  title: 'Nuevo mensaje',
  body: 'Tenés un mensaje nuevo de un vendedor.',
};
