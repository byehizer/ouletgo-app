import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchNearbyStores, type NearbyStore } from '../../src/api/storeApi';
import { NearbyStoreCard } from '../../src/components/NearbyStoreCard';
import { MapFiltersTrigger, MapStoreFilters, type MapRadiusFilter } from '../../src/components/MapStoreFilters';
import {
  StoreMapSearchBar,
  type StoreMapSearchBarHandle,
} from '../../src/components/StoreMapSearchBar';
import { USE_MOCKS } from '../../src/config/env';
import { getGoogleMapProvider, hasGoogleMapsKey } from '../../src/lib/googleMaps';
import {
  getCurrentCoordinates,
  type Coordinates,
} from '../../src/lib/location';

/** Centro demo Avellaneda si no hay GPS. */
const FALLBACK_CENTER: Coordinates = {
  latitude: -34.6627,
  longitude: -58.3647,
};

function regionFromCenter(center: Coordinates, delta = 0.06): Region {
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const searchBarRef = useRef<StoreMapSearchBarHandle>(null);

  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates>(FALLBACK_CENTER);
  const [radiusKm, setRadiusKm] = useState<MapRadiusFilter>(10);
  const [openNowOnly, setOpenNowOnly] = useState(false);

  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<NearbyStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [mapFocused, setMapFocused] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setMapFocused(true);
      return () => setMapFocused(false);
    }, []),
  );

  useEffect(() => {
    void (async () => {
      setLocating(true);
      const coords = await getCurrentCoordinates();
      setLocating(false);

      if (coords) {
        setUserCoords(coords);
        setMapCenter(coords);
        setLocationDenied(false);
      } else {
        setLocationDenied(true);
        setMapCenter(FALLBACK_CENTER);
      }
    })();
  }, []);

  useEffect(() => {
    if (userCoords) {
      mapRef.current?.animateToRegion(regionFromCenter(userCoords, 0.05), 500);
    }
  }, [userCoords]);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNearbyStores({
        latitude: mapCenter.latitude,
        longitude: mapCenter.longitude,
        radiusKm,
        openNow: openNowOnly || undefined,
      });
      setStores(data);
      setSelectedStore((prev) => {
        if (!prev) return null;
        return data.find((s) => s.id === prev.id) ?? prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las tiendas.');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [mapCenter, radiusKm, openNowOnly]);

  useEffect(() => {
    if (locating) return;
    void loadStores();
  }, [loadStores, locating]);

  const centerOnUser = useCallback(() => {
    if (!userCoords) return;
    setMapCenter(userCoords);
    mapRef.current?.animateToRegion(regionFromCenter(userCoords, 0.05), 400);
  }, [userCoords]);

  const focusStore = useCallback((store: NearbyStore) => {
    setSelectedStore(store);
    mapRef.current?.animateToRegion(
      regionFromCenter({ latitude: store.latitude, longitude: store.longitude }, 0.025),
      300,
    );
  }, []);

  const handleMarkerPress = useCallback(
    (store: NearbyStore) => {
      focusStore(store);
    },
    [focusStore],
  );

  const handleSearchSelect = useCallback(
    (store: NearbyStore) => {
      focusStore(store);
    },
    [focusStore],
  );

  const mapMarkers = useMemo(() => {
    if (!selectedStore) return stores;
    if (stores.some((s) => s.id === selectedStore.id)) return stores;
    return [...stores, selectedStore];
  }, [stores, selectedStore]);

  const handleMapPress = useCallback(() => {
    searchBarRef.current?.dismiss();
    setSelectedStore(null);
    setFiltersExpanded(false);
  }, []);

  const handleViewStore = useCallback(() => {
    if (!selectedStore) return;
    router.push(`/store/${selectedStore.id}`);
  }, [selectedStore]);

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7FA',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Ionicons name="map-outline" size={40} color="#94A3B8" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginTop: 12 }}>
          Mapa disponible en la app mobile
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
          Abrí OutletGo en Android o iOS para ver locales cercanos en el mapa.
        </Text>
      </View>
    );
  }

  if (!hasGoogleMapsKey()) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7FA',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Ionicons name="key-outline" size={40} color="#94A3B8" />
        <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 12 }}>
          Configurá EXPO_PUBLIC_GOOGLE_MAPS_API_KEY y rebuildá la app para usar el mapa.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      {mapFocused ? (
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={getGoogleMapProvider()}
        initialRegion={regionFromCenter(mapCenter)}
        showsUserLocation={Boolean(userCoords)}
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
        {mapMarkers.map((store) => (
          <Marker
            key={store.id}
            coordinate={{ latitude: store.latitude, longitude: store.longitude }}
            title={store.name}
            description={store.address}
            pinColor={Platform.OS === 'ios' ? (store.isOpenNow ? '#2B8FD4' : '#94A3B8') : undefined}
            onPress={() => handleMarkerPress(store)}
          />
        ))}
      </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2B8FD4" />
        </View>
      )}

      {/* Controles superiores */}
      <View
        style={{
          position: 'absolute',
          top: 12,
          left: 16,
          right: 16,
          gap: 8,
        }}
        pointerEvents="box-none"
      >
        {USE_MOCKS ? (
          <View
            style={{
              backgroundColor: '#E8F4FD',
              borderRadius: 8,
              padding: 8,
              borderWidth: 1,
              borderColor: '#5AAEE0',
            }}
          >
            <Text style={{ fontSize: 11, color: '#1A3F7A', textAlign: 'center' }}>
              Mapa demo — tiendas ficticias en Avellaneda
            </Text>
          </View>
        ) : null}

        {locationDenied ? (
          <View
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 8,
              padding: 10,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Text style={{ fontSize: 12, color: '#92400E' }}>
              Sin GPS — mostrando zona Avellaneda. Activá ubicación para centrar en vos.
            </Text>
          </View>
        ) : null}

        <View style={{ zIndex: 30 }} pointerEvents="box-none">
          <StoreMapSearchBar
            ref={searchBarRef}
            origin={mapCenter}
            onSelectStore={handleSearchSelect}
            onActiveChange={setSearchActive}
            rightAccessory={
              <MapFiltersTrigger
                embedded
                radiusKm={radiusKm}
                openNowOnly={openNowOnly}
                expanded={filtersExpanded}
                onPress={() => setFiltersExpanded((v) => !v)}
              />
            }
          />
        </View>

        <View style={{ zIndex: 10 }}>
          <MapStoreFilters
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            openNowOnly={openNowOnly}
            onOpenNowChange={setOpenNowOnly}
            expanded={filtersExpanded}
            onExpandedChange={setFiltersExpanded}
            searchActive={searchActive}
          />
        </View>
      </View>

      {/* Botón centrar */}
      {userCoords ? (
        <Pressable
          onPress={centerOnUser}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 16,
            bottom: selectedStore ? 160 + insets.bottom : 32 + insets.bottom,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            opacity: pressed ? 0.85 : 1,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          })}
        >
          <Ionicons name="locate" size={22} color="#2B8FD4" />
        </Pressable>
      ) : null}

      {/* Loading / error / count */}
      {(loading || error) && !selectedStore ? (
        <View
          style={{
            position: 'absolute',
            bottom: 24 + insets.bottom,
            alignSelf: 'center',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2B8FD4" />
          ) : (
            <Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text>
          )}
        </View>
      ) : null}

      {!loading && !error && stores.length === 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 24 + insets.bottom,
            left: 24,
            right: 24,
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>
            No hay tiendas
            {radiusKm != null ? ` en un radio de ${radiusKm} km` : ''}
            {openNowOnly ? ' abiertas ahora' : ''}.
          </Text>
        </View>
      ) : null}

      {!loading && stores.length > 0 && !selectedStore ? (
        <View
          style={{
            position: 'absolute',
            bottom: 24 + insets.bottom,
            alignSelf: 'center',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>
            {stores.length} {stores.length === 1 ? 'tienda' : 'tiendas'}
            {radiusKm != null ? ' cerca' : ''}
          </Text>
        </View>
      ) : null}

      {selectedStore ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          }}
        >
          <NearbyStoreCard
            store={selectedStore}
            onPress={handleViewStore}
            onClose={() => setSelectedStore(null)}
          />
        </View>
      ) : null}
    </View>
  );
}
