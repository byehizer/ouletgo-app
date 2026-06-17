import { Stack } from 'expo-router';

import { Colors } from '../../src/theme/colors';

export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Checkout',
        headerStyle: { backgroundColor: Colors.surface.card },
        headerTitleStyle: { color: Colors.text.primary, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.surface.base },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="return" options={{ headerShown: false }} />
    </Stack>
  );
}
