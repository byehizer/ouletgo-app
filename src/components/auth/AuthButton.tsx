import { forwardRef, type ElementRef } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';

type AuthButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AuthButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  loading?: boolean;
  variant?: AuthButtonVariant;
}

const VARIANT_CONTAINER: Record<AuthButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: '#2B8FD4',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 40,
    paddingVertical: 8,
    marginBottom: 8,
  },
};

const VARIANT_LABEL: Record<AuthButtonVariant, { color: string; fontWeight: '500' | '600' }> = {
  primary: { color: '#FFFFFF', fontWeight: '600' },
  secondary: { color: '#0F172A', fontWeight: '600' },
  ghost: { color: '#1A3F7A', fontWeight: '500' },
};

export const AuthButton = forwardRef<ElementRef<typeof TouchableOpacity>, AuthButtonProps>(
  function AuthButton(
    { label, loading = false, variant = 'primary', disabled, style, ...props },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const labelStyle = VARIANT_LABEL[variant];

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[
          {
            width: '100%',
            minHeight: variant === 'ghost' ? 40 : 52,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 14,
            marginBottom: variant === 'ghost' ? 8 : 14,
            opacity: isDisabled ? 0.55 : 1,
          },
          VARIANT_CONTAINER[variant],
          style as ViewStyle,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#2B8FD4'} />
        ) : (
          <Text
            style={{
              color: labelStyle.color,
              fontSize: 15,
              fontWeight: labelStyle.fontWeight,
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);
