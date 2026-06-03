import { Stack } from 'expo-router';

import { Colors } from '../../src/theme/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface.card },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: { fontWeight: '600', color: Colors.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.surface.base },
      }}
    />
  );
}
