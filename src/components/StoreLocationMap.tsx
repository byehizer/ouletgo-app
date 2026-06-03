import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import {
  buildGoogleMapsEmbedUrl,
  getGoogleMapProvider,
  hasGoogleMapsKey,
  openInGoogleMaps,
} from '../lib/googleMaps';

interface StoreLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  storeName: string;
}

const MAP_HEIGHT = 180;

export function StoreLocationMap({
  latitude,
  longitude,
  address,
  storeName,
}: StoreLocationMapProps) {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const embedUrl = buildGoogleMapsEmbedUrl(latitude, longitude);

  return (
    <View style={{ marginTop: 14 }}>
      <View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
        }}
      >
        {Platform.OS === 'web' ? (
          embedUrl ? (
            <iframe
              title={`Mapa ${storeName}`}
              src={embedUrl}
              style={{ width: '100%', height: MAP_HEIGHT, border: 'none', display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <MapPlaceholder message="Configurá EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa." />
          )
        ) : hasGoogleMapsKey() ? (
          <MapView
            style={{ width: '100%', height: MAP_HEIGHT }}
            initialRegion={region}
            provider={getGoogleMapProvider()}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            onPress={() => openInGoogleMaps(latitude, longitude, storeName)}
          >
            <Marker coordinate={{ latitude, longitude }} title={storeName} description={address} />
          </MapView>
        ) : (
          <MapPlaceholder message="Agregá EXPO_PUBLIC_GOOGLE_MAPS_API_KEY y rebuildá la app (EAS/dev build)." />
        )}

        <Pressable
          onPress={() => openInGoogleMaps(latitude, longitude, storeName)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            padding: 12,
            backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
          })}
        >
          <Ionicons name="location-outline" size={18} color="#2B8FD4" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>{address}</Text>
            <Text style={{ fontSize: 12, color: '#2B8FD4', marginTop: 4, fontWeight: '600' }}>
              Abrir en Google Maps
            </Text>
          </View>
          <Ionicons name="open-outline" size={18} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
}

function MapPlaceholder({ message }: { message: string }) {
  return (
    <View
      style={{
        height: MAP_HEIGHT,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Ionicons name="map-outline" size={28} color="#94A3B8" />
      <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
        {message}
      </Text>
    </View>
  );
}
