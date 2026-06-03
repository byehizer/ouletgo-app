import { Text, View, Pressable } from 'react-native';

import type { ProductVariation } from '../api/productApi';

interface VariationPickerProps {
  variations: ProductVariation[];
  selectedId: string | null;
  onSelect: (variation: ProductVariation) => void;
}

export function VariationPicker({ variations, selectedId, onSelect }: VariationPickerProps) {
  const sizes = [...new Set(variations.map((v) => v.size))];
  const selected = variations.find((v) => v.id === selectedId) ?? null;

  const colorsForSize = selected
    ? variations.filter((v) => v.size === selected.size)
    : variations.filter((v) => v.size === sizes[0]);

  const pickSize = (size: string) => {
    const first = variations.find((v) => v.size === size && v.stock > 0)
      ?? variations.find((v) => v.size === size);
    if (first) onSelect(first);
  };

  const pickColor = (variation: ProductVariation) => {
    onSelect(variation);
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
          Talle
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {sizes.map((size) => {
            const isSelected = selected?.size === size;
            const hasStock = variations.some((v) => v.size === size && v.stock > 0);
            return (
              <Pressable
                key={size}
                onPress={() => pickSize(size)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#2B8FD4' : '#E2E8F0',
                  backgroundColor: isSelected ? '#E8F4FD' : '#FFFFFF',
                  opacity: hasStock ? 1 : 0.45,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isSelected ? '#1A3F7A' : '#475569',
                  }}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {colorsForSize.some((v) => v.color) ? (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 }}>
            Color
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {colorsForSize.map((v) => {
              const isSelected = selectedId === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => pickColor(v)}
                  disabled={v.stock <= 0}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#2B8FD4' : '#E2E8F0',
                    backgroundColor: isSelected ? '#E8F4FD' : '#FFFFFF',
                    opacity: v.stock > 0 ? 1 : 0.4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isSelected ? '#1A3F7A' : '#475569',
                    }}
                  >
                    {v.color ?? 'Único'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {selected ? (
        <View
          style={{
            backgroundColor: selected.stock > 0 ? '#F0FDF4' : '#FEF2F2',
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: selected.stock > 0 ? '#BBF7D0' : '#FECACA',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: selected.stock > 0 ? '#16A34A' : '#DC2626',
            }}
          >
            {selected.stock > 0
              ? `${selected.stock} unidades disponibles`
              : 'Sin stock en esta variación'}
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: '#64748B' }}>Elegí talle y color</Text>
      )}
    </View>
  );
}
