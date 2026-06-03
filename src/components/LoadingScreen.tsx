import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../theme/colors';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.base,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
