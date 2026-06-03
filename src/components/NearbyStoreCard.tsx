import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { NearbyStore } from '../api/storeApi';
import { formatDistanceKm } from '../lib/location';

import { OpenNowPill } from './OpenNowPill';
import { RatingStars } from './RatingStars';

interface NearbyStoreCardProps {
  store: NearbyStore;
  onPress: () => void;
  onClose: () => void;
}

const CARD_PADDING = 20;

export function NearbyStoreCard({ store, onPress, onClose }: NearbyStoreCardProps) {
  const distanceLabel = formatDistanceKm(store.distanceKm);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(43, 143, 212, 0.1)' }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
        })}
      >
        <View
          style={{
            paddingTop: CARD_PADDING,
            paddingBottom: CARD_PADDING,
            paddingLeft: CARD_PADDING,
            paddingRight: CARD_PADDING + 28,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A', lineHeight: 24 }}>
            {store.name}
          </Text>

          <Text
            style={{ fontSize: 14, color: '#64748B', marginTop: 10, lineHeight: 21 }}
            numberOfLines={2}
          >
            {store.address}
          </Text>

          {store.ratingAvg != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <RatingStars rating={store.ratingAvg} size={14} />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {store.ratingAvg.toFixed(1)} ({store.ratingCount})
              </Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 18,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                flexWrap: 'wrap',
              }}
            >
              {distanceLabel ? (
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>
                  {distanceLabel}
                </Text>
              ) : null}
              {store.isOpenNow != null ? (
                <OpenNowPill isOpen={store.isOpenNow} variant="short" />
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2B8FD4' }}>Ver tienda</Text>
              <Ionicons name="chevron-forward" size={16} color="#2B8FD4" />
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={{
          position: 'absolute',
          top: CARD_PADDING - 4,
          right: CARD_PADDING - 4,
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <Ionicons name="close" size={20} color="#64748B" />
      </Pressable>
    </View>
  );
}
