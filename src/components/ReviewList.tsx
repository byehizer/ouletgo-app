import { Dimensions, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import type { ProductReview } from '../api/productApi';
import { formatDate } from '../lib/format';
import { RatingStars } from './RatingStars';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ReviewListProps {
  reviews: ProductReview[];
}

/** Una página del lightbox: imagen con pinch-zoom + pan + doble tap. */
function ZoomPage({ uri, onZoomChange }: { uri: string; onZoomChange: (zoomed: boolean) => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const notifyZoom = (zoomed: boolean) => onZoomChange(zoomed);

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    savedTx.value = 0;
    savedTy.value = 0;
    runOnJS(notifyZoom)(false);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        reset();
      } else {
        runOnJS(notifyZoom)(true);
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    // Si no hay zoom activo, cedemos el gesto al ScrollView padre
    .onTouchesDown((_, stateManager) => {
      'worklet';
      if (savedScale.value <= 1) stateManager.fail();
    })
    .onUpdate((e) => {
      'worklet';
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (savedScale.value > 1) {
        reset();
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
        runOnJS(notifyZoom)(true);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[lightbox.page, animStyle]}>
        <Image source={{ uri }} style={lightbox.image} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

function ImageLightbox({
  urls,
  initialIdx,
  onClose,
}: {
  urls: string[];
  initialIdx: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <GestureHandlerRootView style={lightbox.container}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIdx * SCREEN_W, y: 0 }}
          onMomentumScrollEnd={(e) =>
            setCurrentIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
          }
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {urls.map((url) => (
            <View
              key={url}
              style={{ width: SCREEN_W, height: SCREEN_H, justifyContent: 'center' }}
            >
              <ZoomPage
                uri={url}
                onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
              />
            </View>
          ))}
        </ScrollView>

        {urls.length > 1 ? (
          <View style={[lightbox.pagination, { bottom: insets.bottom + 20 }]}>
            {urls.map((_, i) => (
              <View key={i} style={[lightbox.dot, i === currentIdx && lightbox.dotActive]} />
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          style={[lightbox.closeBtn, { top: insets.top + 12 }]}
          hitSlop={16}
        >
          <Text style={lightbox.closeTxt}>✕</Text>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ReviewImages({ urls }: { urls: string[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imgRow}
        contentContainerStyle={styles.imgRowContent}
      >
        {urls.map((url, idx) => (
          <Pressable key={url} onPress={() => setSelectedIdx(idx)}>
            <Image source={{ uri: url }} style={styles.imgThumb} />
          </Pressable>
        ))}
      </ScrollView>
      {selectedIdx !== null ? (
        <ImageLightbox
          urls={urls}
          initialIdx={selectedIdx}
          onClose={() => setSelectedIdx(null)}
        />
      ) : null}
    </>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <Text style={styles.empty}>
        Todavía no hay reseñas visibles para este producto.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {reviews.map((review) => (
        <View key={review.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.author}>{review.authorName}</Text>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
          <RatingStars rating={review.rating} size={14} />
          {review.comment ? (
            <Text style={styles.comment}>{review.comment}</Text>
          ) : null}
          <ReviewImages urls={review.imageUrls} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
  comment: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    lineHeight: 20,
  },
  imgRow: {
    marginTop: 10,
  },
  imgRowContent: {
    gap: 8,
  },
  imgThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});

const lightbox = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.78,
  },
  closeBtn: {
    position: 'absolute',
    right: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  pagination: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
});
