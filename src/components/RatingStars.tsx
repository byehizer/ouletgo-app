import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = clamped >= star;
        const half = !filled && clamped >= star - 0.5;
        return (
          <Ionicons
            key={star}
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color="#F59E0B"
          />
        );
      })}
    </View>
  );
}
