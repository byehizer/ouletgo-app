import { Stack } from 'expo-router';

import { Colors } from '../../src/theme/colors';

export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Carrito',
        headerStyle: { backgroundColor: Colors.surface.card },
        headerTitleStyle: { color: Colors.text.primary, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.surface.base },
      }}
    />
  );
}
