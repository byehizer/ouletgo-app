import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { searchStoresByName, type NearbyStore } from '../api/storeApi';
import { useDebounce } from '../hooks/useDebounce';
import { formatDistanceKm, type Coordinates } from '../lib/location';
import { OpenNowPill } from './OpenNowPill';

export interface StoreMapSearchBarHandle {
  dismiss: () => void;
}

interface StoreMapSearchBarProps {
  origin: Coordinates;
  onSelectStore: (store: NearbyStore) => void;
  onActiveChange?: (active: boolean) => void;
  rightAccessory?: ReactNode;
}

function SuggestionCard({
  store,
  onPress,
}: {
  store: NearbyStore;
  onPress: () => void;
}) {
  const isOpen = store.isOpenNow === true;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: pressed ? '#E8F4FD' : '#F8FAFC',
        borderWidth: 1,
        borderColor: pressed ? '#BFDBFE' : '#E2E8F0',
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <Ionicons name="storefront" size={20} color="#2B8FD4" />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
          {store.address}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {store.distanceKm != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="navigate-outline" size={12} color="#15803D" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D' }}>
                {formatDistanceKm(store.distanceKm)}
              </Text>
            </View>
          ) : null}
          {store.isOpenNow != null ? (
            <OpenNowPill isOpen={isOpen} variant="short" />
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

export const StoreMapSearchBar = forwardRef<StoreMapSearchBarHandle, StoreMapSearchBarProps>(
  function StoreMapSearchBar({ origin, onSelectStore, onActiveChange, rightAccessory }, ref) {
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const debouncedQuery = useDebounce(query, 350);
    const [suggestions, setSuggestions] = useState<NearbyStore[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const isActive = focused;

    useImperativeHandle(ref, () => ({
      dismiss: () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
        setFocused(false);
      },
    }));

    useEffect(() => {
      onActiveChange?.(isActive);
    }, [isActive, onActiveChange]);

    useEffect(() => {
      const trimmed = debouncedQuery.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      void (async () => {
        setLoading(true);
        try {
          const results = await searchStoresByName({
            name: trimmed,
            latitude: origin.latitude,
            longitude: origin.longitude,
            limit: 8,
          });
          setSuggestions(results);
          setSearched(true);
        } catch {
          setSuggestions([]);
          setSearched(true);
        } finally {
          setLoading(false);
        }
      })();
    }, [debouncedQuery, origin.latitude, origin.longitude]);

    const showDropdown = focused && query.trim().length >= 2 && (loading || searched);

    const handleSelect = (store: NearbyStore) => {
      setQuery(store.name);
      setSuggestions([]);
      setSearched(false);
      inputRef.current?.blur();
      Keyboard.dismiss();
      onSelectStore(store);
    };

    const clearQuery = () => {
      setQuery('');
      setSuggestions([]);
      setSearched(false);
      inputRef.current?.focus();
    };

    const barBorderColor = showDropdown ? '#BFDBFE' : '#E2E8F0';

    const inputElement = (
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={setQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar tienda por nombre…"
        placeholderTextColor="#94A3B8"
        underlineColorAndroid="transparent"
        importantForAutofill="no"
        style={{
          flex: 1,
          fontSize: 15,
          color: '#0F172A',
          paddingVertical: Platform.OS === 'ios' ? 12 : 0,
          paddingHorizontal: 0,
          margin: 0,
          backgroundColor: 'transparent',
          ...(Platform.OS === 'android'
            ? { textAlignVertical: 'center' as const, includeFontPadding: false, height: 48 }
            : {}),
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    );

    return (
      <View style={{ position: 'relative', zIndex: 40 }}>
        <View style={{ opacity: isActive ? 1 : 0.82 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: barBorderColor,
              paddingLeft: 14,
              paddingRight: rightAccessory ? 6 : 14,
              height: 50,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: isActive || showDropdown ? 4 : 1 },
              shadowOpacity: isActive || showDropdown ? 0.1 : 0.04,
              shadowRadius: isActive || showDropdown ? 10 : 4,
              elevation: isActive || showDropdown ? 6 : 2,
            }}
          >
            <Ionicons name="search-outline" size={20} color={isActive ? '#2B8FD4' : '#94A3B8'} />
            <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center', backgroundColor: 'transparent' }}>
              {inputElement}
            </View>
            {loading ? <ActivityIndicator size="small" color="#2B8FD4" /> : null}
            {query.length > 0 && !loading ? (
              <Pressable onPress={clearQuery} hitSlop={8} style={{ marginRight: 4 }}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </Pressable>
            ) : null}
            {rightAccessory ? (
              <>
                <View
                  style={{
                    width: 1,
                    height: 28,
                    backgroundColor: '#E2E8F0',
                    marginHorizontal: 4,
                  }}
                />
                {rightAccessory}
              </>
            ) : null}
          </View>
        </View>

        {showDropdown ? (
          <View
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              maxHeight: 280,
              overflow: 'hidden',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.14,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {loading ? (
              <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#2B8FD4" />
                <Text style={{ fontSize: 13, color: '#64748B' }}>Buscando tiendas…</Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="search-outline" size={22} color="#94A3B8" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', textAlign: 'center' }}>
                  Sin resultados
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                  Probá con otro nombre de tienda
                </Text>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ padding: 8, gap: 6 }}
                showsVerticalScrollIndicator={false}
              >
                {suggestions.map((store) => (
                  <SuggestionCard key={store.id} store={store} onPress={() => handleSelect(store)} />
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>
    );
  },
);
