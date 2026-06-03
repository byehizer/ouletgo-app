import { StyleSheet, Text, View } from 'react-native';

interface OpenNowPillProps {
  isOpen: boolean;
  /** 'short' = "Abierta" / "Cerrada" (default); 'long' = "Abierta ahora" / "Cerrada ahora" */
  variant?: 'short' | 'long';
  showBorder?: boolean;
}

export function OpenNowPill({ isOpen, variant = 'short', showBorder = false }: OpenNowPillProps) {
  const label =
    variant === 'long'
      ? isOpen ? 'Abierta ahora' : 'Cerrada ahora'
      : isOpen ? 'Abierta' : 'Cerrada';

  return (
    <View
      style={[
        styles.pill,
        isOpen ? styles.open : styles.closed,
        showBorder && (isOpen ? styles.openBorder : styles.closedBorder),
      ]}
    >
      <View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed]} />
      <Text style={[styles.label, isOpen ? styles.labelOpen : styles.labelClosed]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  open: {
    backgroundColor: '#F0FDF4',
  },
  closed: {
    backgroundColor: '#FEF2F2',
  },
  openBorder: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  closedBorder: {
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOpen: {
    backgroundColor: '#16A34A',
  },
  dotClosed: {
    backgroundColor: '#DC2626',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelOpen: {
    color: '#15803D',
  },
  labelClosed: {
    color: '#B91C1C',
  },
});
