import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CatalogCategory } from '../api/catalogApi';
import { getCurrentCoordinates, type Coordinates } from '../lib/location';
import {
  DEFAULT_CATALOG_FILTERS,
  RADIUS_OPTIONS,
  SIZE_OPTIONS,
  type CatalogFilterState,
} from '../types/catalogFilters';

interface FiltersSheetProps {
  visible: boolean;
  categories: CatalogCategory[];
  initialFilters: CatalogFilterState;
  onClose: () => void;
  onApply: (filters: CatalogFilterState, coords: Coordinates | null) => void;
}

export function FiltersSheet({
  visible,
  categories,
  initialFilters,
  onClose,
  onApply,
}: FiltersSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<CatalogFilterState>(initialFilters);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(initialFilters);
      setLocationError(null);
    }
  }, [visible, initialFilters]);

  const handleApply = async () => {
    let coords: Coordinates | null = null;

    if (draft.nearMe) {
      setLocating(true);
      setLocationError(null);
      coords = await getCurrentCoordinates();
      setLocating(false);

      if (!coords) {
        setLocationError('No pudimos obtener tu ubicación. Revisá los permisos.');
        return;
      }
    }

    onApply(draft, coords);
    onClose();
  };

  const handleClear = () => {
    setDraft({ ...DEFAULT_CATALOG_FILTERS, categoryId: initialFilters.categoryId });
    setLocationError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '88%',
            paddingBottom: insets.bottom + 16,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Filtros</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Precio */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Precio (ARS)
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Mínimo</Text>
                <TextInput
                  value={draft.minPrice}
                  onChangeText={(v) => setDraft((f) => ({ ...f, minPrice: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Máximo</Text>
                <TextInput
                  value={draft.maxPrice}
                  onChangeText={(v) => setDraft((f) => ({ ...f, maxPrice: v }))}
                  keyboardType="numeric"
                  placeholder="999999"
                  placeholderTextColor="#94A3B8"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Talle */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Talle
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SIZE_OPTIONS.map((size) => {
                const selected = draft.sizeFilter === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() =>
                      setDraft((f) => ({
                        ...f,
                        sizeFilter: selected ? null : size,
                      }))
                    }
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: selected ? '#2B8FD4' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: selected ? '#2B8FD4' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: selected ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Categoría en sheet (sincronizada con chips) */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Categoría
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <Chip
                label="Todas"
                selected={draft.categoryId === null}
                onPress={() => setDraft((f) => ({ ...f, categoryId: null }))}
              />
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={draft.categoryId === cat.id}
                  onPress={() => setDraft((f) => ({ ...f, categoryId: cat.id }))}
                />
              ))}
            </View>

            {/* Horario */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Horario
            </Text>
            <Pressable
              onPress={() => setDraft((f) => ({ ...f, openNow: !f.openNow }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: draft.openNow ? '#2B8FD4' : '#CBD5E1',
                  backgroundColor: draft.openNow ? '#2B8FD4' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.openNow ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <Text style={{ fontSize: 14, color: '#0F172A', flex: 1 }}>
                Solo tiendas abiertas ahora
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: -12, marginBottom: 20 }}>
              Según hora de Argentina (Buenos Aires)
            </Text>

            {/* Ubicación */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Ubicación
            </Text>
            <Pressable
              onPress={() => setDraft((f) => ({ ...f, nearMe: !f.nearMe }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: draft.nearMe ? '#2B8FD4' : '#CBD5E1',
                  backgroundColor: draft.nearMe ? '#2B8FD4' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.nearMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <Text style={{ fontSize: 14, color: '#0F172A' }}>Cerca de mí</Text>
            </Pressable>

            {draft.nearMe ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {RADIUS_OPTIONS.map((km) => {
                  const selected = draft.radiusKm === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => setDraft((f) => ({ ...f, radiusKm: km }))}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: selected ? '#E8F4FD' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: selected ? '#2B8FD4' : '#E2E8F0',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: selected ? '#1A3F7A' : '#475569',
                        }}
                      >
                        {km} km
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {locationError ? (
              <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{locationError}</Text>
            ) : null}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <Pressable
              onPress={handleClear}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#475569' }}>Limpiar</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              disabled={locating}
              style={{
                flex: 2,
                height: 48,
                borderRadius: 10,
                backgroundColor: '#2B8FD4',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: locating ? 0.7 : 1,
              }}
            >
              {locating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Aplicar filtros
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: selected ? '#2B8FD4' : '#F1F5F9',
        borderWidth: 1,
        borderColor: selected ? '#2B8FD4' : '#E2E8F0',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: selected ? '#FFFFFF' : '#475569',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const inputStyle = {
  height: 44,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  paddingHorizontal: 12,
  fontSize: 14,
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
};
