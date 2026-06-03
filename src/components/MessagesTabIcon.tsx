import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { formatMessagesTabBadge, useMessages } from '../context/MessagesContext';
import { Colors } from '../theme/colors';

interface MessagesTabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

export function MessagesTabIcon({ color, size, focused }: MessagesTabIconProps) {
  const { totalUnreadCount, unreadStoreCount } = useMessages();
  const badgeLabel = formatMessagesTabBadge({ totalUnreadCount, unreadStoreCount });

  return (
    <View style={styles.wrap}>
      <Ionicons
        name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
        size={size}
        color={color}
      />
      {badgeLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand.DEFAULT,
    borderWidth: 2,
    borderColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
