import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '../theme/colors';

interface ReportIconButtonProps {
  onPress: () => void;
  /** Reporte pendiente o en revisión sobre este ítem. */
  pendingReview?: boolean;
}

export function ReportIconButton({ onPress, pendingReview }: ReportIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      accessibilityLabel={pendingReview ? 'Reporte en revisión' : 'Reportar'}
    >
      <Ionicons
        name={pendingReview ? 'flag' : 'flag-outline'}
        size={22}
        color={pendingReview ? Colors.warning.text : Colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  iconBtnPressed: {
    opacity: 0.88,
    backgroundColor: Colors.brand.bgLight,
  },
});
