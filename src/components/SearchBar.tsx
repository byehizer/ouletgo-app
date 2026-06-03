import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  onLensPress?: () => void;
  activeFilterCount?: number;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  onLensPress,
  activeFilterCount = 0,
  placeholder = 'Buscar productos…',
}: SearchBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        gap: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          height: 48,
        }}
      >
        <Ionicons name="search-outline" size={20} color="#94A3B8" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 15,
            color: '#0F172A',
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
        {onLensPress ? (
          <Pressable onPress={onLensPress} hitSlop={8} style={{ marginLeft: 4 }}>
            <Ionicons name="camera-outline" size={22} color="#2B8FD4" />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onFilterPress}
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          backgroundColor: activeFilterCount > 0 ? '#2B8FD4' : '#FFFFFF',
          borderWidth: 1,
          borderColor: activeFilterCount > 0 ? '#2B8FD4' : '#E2E8F0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="options-outline"
          size={22}
          color={activeFilterCount > 0 ? '#FFFFFF' : '#475569'}
        />
        {activeFilterCount > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
            }}
          />
        ) : null}
      </Pressable>
    </View>
  );
}
