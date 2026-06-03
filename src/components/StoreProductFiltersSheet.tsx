import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CatalogCategory } from '../api/catalogApi';
import {
  DEFAULT_STORE_PRODUCT_FILTERS,
  type StoreProductFilterState,
} from '../types/storeProductFilters';
import { SIZE_OPTIONS } from '../types/catalogFilters';

interface StoreProductFiltersSheetProps {
  visible: boolean;
  categories: CatalogCategory[];
  initialFilters: StoreProductFilterState;
  onClose: () => void;
  onApply: (filters: StoreProductFilterState) => void;
}

export function StoreProductFiltersSheet({
  visible,
  categories,
  initialFilters,
  onClose,
  onApply,
}: StoreProductFiltersSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<StoreProductFilterState>(initialFilters);

  useEffect(() => {
    if (visible) setDraft(initialFilters);
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft(DEFAULT_STORE_PRODUCT_FILTERS);
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
            maxHeight: '80%',
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
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Filtros de productos
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Precio (ARS)
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Mínimo</Text>
                <TextInput
                  value={draft.minPrice}
                  onChangeText={(v) => setDraft((f) => ({ ...f, minPrice: v }))}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Máximo</Text>
                <TextInput
                  value={draft.maxPrice}
                  onChangeText={(v) => setDraft((f) => ({ ...f, maxPrice: v }))}
                  placeholder="Sin límite"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={inputStyle}
                />
              </View>
            </View>

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

            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
              Talle
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <Chip
                label="Todos"
                selected={draft.sizeFilter === null}
                onPress={() => setDraft((f) => ({ ...f, sizeFilter: null }))}
              />
              {SIZE_OPTIONS.map((size) => (
                <Chip
                  key={size}
                  label={size}
                  selected={draft.sizeFilter === size}
                  onPress={() => setDraft((f) => ({ ...f, sizeFilter: size }))}
                />
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 }}>
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
              style={{
                flex: 2,
                height: 48,
                borderRadius: 10,
                backgroundColor: '#2B8FD4',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Aplicar</Text>
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
