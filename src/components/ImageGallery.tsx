import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';

interface ImageGalleryProps {
  imageUrls: string[];
  height?: number;
}

export function ImageGallery({ imageUrls, height = 280 }: ImageGalleryProps) {
  const width = Dimensions.get('window').width;
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const slides = imageUrls.length > 0 ? imageUrls : ['placeholder'];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <View style={{ backgroundColor: '#E8F4FD' }}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, i) => `${item}-${i}`}
        renderItem={({ item }) =>
          item === 'placeholder' ? (
            <View
              style={{
                width,
                height,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E8F4FD',
              }}
            >
              <Ionicons name="shirt-outline" size={64} color="#2B8FD4" />
            </View>
          ) : (
            <Image
              source={{ uri: item }}
              style={{ width, height, backgroundColor: '#F1F5F9' }}
              resizeMode="cover"
            />
          )
        }
      />

      {slides.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
          }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 18 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? '#2B8FD4' : '#CBD5E1',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
