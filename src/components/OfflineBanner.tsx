import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { checkOnline, useConnectivity } from '../lib/connectivity';
import { Colors } from '../theme/colors';
import { useState } from 'react';

export function OfflineBanner() {
  const online = useConnectivity();
  const [retrying, setRetrying] = useState(false);

  if (online) return null;

  const handleRetry = async () => {
    setRetrying(true);
    await checkOnline();
    setRetrying(false);
  };

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.warning.text} />
      <Text style={styles.text}>Sin conexión a internet</Text>
      <Pressable
        onPress={() => void handleRetry()}
        disabled={retrying}
        hitSlop={8}
        style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.retryText}>{retrying ? 'Verificando…' : 'Reintentar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning.DEFAULT,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  text: {
    flex: 1,
    color: Colors.warning.text,
    fontSize: 13,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warning.DEFAULT,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning.text,
  },
});
