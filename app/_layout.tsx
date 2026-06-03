import 'react-native-gesture-handler';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationBootstrap } from '../src/components/NotificationBootstrap';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { MessagesProvider } from '../src/context/MessagesContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationBootstrap />
        <OfflineBanner />
        <MessagesProvider>
        <CartProvider>
          <StatusBar style="dark" backgroundColor="#ffffff" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#f5f7fa' },
            }}
          />
        </CartProvider>
        </MessagesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
