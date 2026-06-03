import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

interface AuthTextInputProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function AuthTextInput({ label, error, style, ...props }: AuthTextInputProps) {
  const hasError = Boolean(error);

  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#475569',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={[
          {
            height: 52,
            borderWidth: 1.5,
            borderColor: hasError ? '#EF4444' : '#E2E8F0',
            borderRadius: 10,
            paddingHorizontal: 16,
            fontSize: 15,
            color: '#0F172A',
            backgroundColor: '#FFFFFF',
          },
          style,
        ]}
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {hasError ? (
        <Text style={{ marginTop: 6, fontSize: 12, color: '#DC2626' }}>{error}</Text>
      ) : null}
    </View>
  );
}
