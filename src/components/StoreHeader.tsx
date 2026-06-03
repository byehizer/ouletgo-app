import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';

import type { StoreProfile } from '../api/storeApi';
import { formatDistanceKm } from '../lib/location';

import { OpenNowPill } from './OpenNowPill';
import { RatingStars } from './RatingStars';
import { StoreLocationMap } from './StoreLocationMap';

interface StoreHeaderProps {
  store: StoreProfile;
}

async function openUrl(url: string) {
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const distanceLabel = formatDistanceKm(store.distanceKm);
  const hasSocial = Boolean(store.instagramUrl || store.whatsapp);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: '#E8F4FD',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#5AAEE0',
          }}
        >
          <Ionicons name="storefront" size={32} color="#2B8FD4" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>{store.name}</Text>

          {store.ratingAvg != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <RatingStars rating={store.ratingAvg} size={15} />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {store.ratingAvg.toFixed(1)} ({store.ratingCount} reseñas)
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Sin reseñas aún</Text>
          )}

          {store.isOpenNow != null ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              <OpenNowPill isOpen={store.isOpenNow} variant="long" showBorder />
            </View>
          ) : null}
        </View>
      </View>

      <StoreLocationMap
        latitude={store.latitude}
        longitude={store.longitude}
        address={store.address}
        storeName={store.name}
      />

      {distanceLabel ? (
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 10,
            backgroundColor: '#F0FDF4',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#BBF7D0',
          }}
        >
          <Ionicons name="navigate-outline" size={14} color="#16A34A" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D' }}>
            A {distanceLabel} de vos
          </Text>
        </View>
      ) : null}

      {store.description ? (
        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 14 }}>
          {store.description}
        </Text>
      ) : null}

      {hasSocial ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {store.instagramUrl ? (
            <Pressable
              onPress={() => void openUrl(store.instagramUrl!)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="logo-instagram" size={18} color="#E1306C" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>Instagram</Text>
            </Pressable>
          ) : null}

          {store.whatsapp ? (
            <Pressable
              onPress={() => void openUrl(`https://wa.me/${store.whatsapp}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>WhatsApp</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
