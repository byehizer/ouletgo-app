import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

const CARD_STYLE: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 420,
  alignSelf: 'center',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

export function AuthCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[CARD_STYLE, style]}>{children}</View>;
}

export function AuthErrorBox({ message }: { message: string }) {
  return (
    <View
      style={{
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
      }}
    >
      <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

export function AuthTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );
}

export function AuthSubtitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
      }}
    >
      {children}
    </Text>
  );
}
