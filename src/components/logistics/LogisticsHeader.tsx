import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { useLogistics } from '../../context/LogisticsContext';
import { LogisticsModalSheet } from './LogisticsModalSheet';

export function LogisticsHeader() {
  const { preference, loading } = useLogistics();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Icono según tipo de preferencia
  const getIconName = () => {
    if (!preference) return 'location-outline';
    return preference.type === 'PICKUP' ? 'pin-outline' : 'bicycle-outline';
  };

  // Texto según preferencia
  const getLabel = () => {
    if (loading) return 'Cargando método de entrega...';
    if (!preference) return 'Seleccionar método de entrega';
    return preference.label;
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setSheetVisible(true)}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View style={styles.content}>
          <Ionicons name={getIconName()} size={18} color="#2B8FD4" />
          <Text style={styles.text} numberOfLines={1}>
            {getLabel()}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#64748B" />
      </Pressable>

      <LogisticsModalSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F7FA',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
