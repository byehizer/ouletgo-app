import { Pressable, ScrollView, Text, View } from 'react-native';

import type { CatalogCategory } from '../api/catalogApi';

interface CategoryChipsProps {
  categories: CatalogCategory[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
  loading?: boolean;
}

export function CategoryChips({
  categories,
  selectedId,
  onSelect,
  loading = false,
}: CategoryChipsProps) {
  const chips: { id: string | null; name: string }[] = [
    { id: null, name: 'Todos' },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <View style={{ marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {chips.map((chip) => {
          const selected = selectedId === chip.id;
          return (
            <Pressable
              key={chip.id ?? 'all'}
              disabled={loading}
              onPress={() => onSelect(chip.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: selected ? '#2B8FD4' : '#FFFFFF',
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
                {chip.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
