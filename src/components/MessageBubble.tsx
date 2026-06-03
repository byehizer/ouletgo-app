import { Image, StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '../api/chatApi';
import { formatDateTime } from '../lib/format';
import { Colors } from '../theme/colors';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isBuyer = message.senderRole === 'BUYER';

  return (
    <View style={[styles.row, isBuyer ? styles.rowBuyer : styles.rowSeller]}>
      <View style={[styles.bubble, isBuyer ? styles.bubbleBuyer : styles.bubbleSeller]}>
        {message.imageUrl ? (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="Imagen adjunta"
          />
        ) : null}
        {message.body ? (
          <Text style={[styles.body, isBuyer ? styles.bodyBuyer : styles.bodySeller]}>
            {message.body}
          </Text>
        ) : null}
        <Text style={[styles.time, isBuyer ? styles.timeBuyer : styles.timeSeller]}>
          {formatDateTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  rowBuyer: {
    alignItems: 'flex-end',
  },
  rowSeller: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleBuyer: {
    backgroundColor: Colors.brand.DEFAULT,
    borderBottomRightRadius: 4,
  },
  bubbleSeller: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderBottomLeftRadius: 4,
  },
  image: {
    width: 220,
    height: 165,
    borderRadius: 10,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  bodyBuyer: {
    color: '#fff',
  },
  bodySeller: {
    color: Colors.text.primary,
  },
  time: {
    fontSize: 11,
    marginTop: 6,
  },
  timeBuyer: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  timeSeller: {
    color: Colors.text.muted,
  },
});
