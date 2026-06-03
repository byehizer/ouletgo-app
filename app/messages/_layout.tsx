import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Volver',
        headerTintColor: '#2B8FD4',
        contentStyle: { backgroundColor: '#f5f7fa' },
      }}
    />
  );
}
