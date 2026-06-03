import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  compact = false,
}: QuantityStepperProps) {
  const size = compact ? 32 : 36;

  const handleDecrease = () => {
    if (value <= min) {
      onChange(0);
      return;
    }
    onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value >= max) return;
    onChange(value + 1);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 6 : 8 }}>
      <Pressable
        onPress={handleDecrease}
        accessibilityLabel="Disminuir cantidad"
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: pressed ? '#F1F5F9' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Ionicons name="remove" size={compact ? 16 : 18} color="#475569" />
      </Pressable>

      <Text
        style={{
          minWidth: compact ? 20 : 24,
          textAlign: 'center',
          fontSize: compact ? 14 : 15,
          fontWeight: '700',
          color: '#0F172A',
        }}
      >
        {value}
      </Text>

      <Pressable
        onPress={handleIncrease}
        disabled={value >= max}
        accessibilityLabel="Aumentar cantidad"
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: value >= max ? '#E2E8F0' : '#BFDBFE',
          backgroundColor: value >= max ? '#F8FAFC' : pressed ? '#E8F4FD' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value >= max ? 0.5 : 1,
        })}
      >
        <Ionicons
          name="add"
          size={compact ? 16 : 18}
          color={value >= max ? '#94A3B8' : '#2B8FD4'}
        />
      </Pressable>
    </View>
  );
}
