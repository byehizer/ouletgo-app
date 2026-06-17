import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';

interface ChatComposerProps {
  onSendText: (text: string) => Promise<void>;
  onSendImage: (uri: string) => Promise<void>;
  disabled?: boolean;
  sending?: boolean;
}

export function ChatComposer({
  onSendText,
  onSendImage,
  disabled = false,
  sending = false,
}: ChatComposerProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const busy = disabled || sending;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setText('');
    try {
      await onSendText(trimmed);
    } catch {
      setText(trimmed);
    }
  };

  const handlePickImage = async () => {
    if (busy) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Permití el acceso a fotos para enviar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    try {
      await onSendImage(result.assets[0].uri);
    } catch {
      // error mostrado en pantalla padre
    }
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TouchableOpacity
        onPress={() => void handlePickImage()}
        disabled={busy}
        style={styles.iconBtn}
        accessibilityLabel="Adjuntar imagen"
      >
        <Ionicons name="image-outline" size={24} color={busy ? Colors.text.muted : Colors.brand.DEFAULT} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Escribí un mensaje..."
        placeholderTextColor={Colors.text.muted}
        value={text}
        onChangeText={setText}
        editable={!busy}
        multiline
        maxLength={2000}
      />

      <TouchableOpacity
        onPress={() => void handleSend()}
        disabled={busy || !text.trim()}
        style={[styles.sendBtn, (!text.trim() || busy) && styles.sendBtnDisabled]}
        accessibilityLabel="Enviar mensaje"
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
  iconBtn: {
    padding: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface.base,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    fontSize: 15,
    color: Colors.text.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
