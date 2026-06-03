import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

const RADIUS_OPTIONS = [5, 10, 25] as const;
export type MapRadiusFilter = (typeof RADIUS_OPTIONS)[number] | null;

interface MapStoreFiltersProps {
  radiusKm: MapRadiusFilter;
  onRadiusChange: (radius: MapRadiusFilter) => void;
  openNowOnly: boolean;
  onOpenNowChange: (value: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  searchActive?: boolean;
}

const RADIUS_LABELS: { value: MapRadiusFilter; label: string }[] = [
  { value: null, label: 'Todas' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
];

function radiusSummary(radiusKm: MapRadiusFilter): string {
  if (radiusKm == null) return 'Todas';
  return `${radiusKm} km`;
}

function hasActiveFilters(radiusKm: MapRadiusFilter, openNowOnly: boolean): boolean {
  return openNowOnly || radiusKm !== 10;
}

interface MapFiltersTriggerProps {
  radiusKm: MapRadiusFilter;
  openNowOnly: boolean;
  expanded: boolean;
  onPress: () => void;
  /** Integrado dentro de la barra de búsqueda. */
  embedded?: boolean;
}

export function MapFiltersTrigger({
  radiusKm,
  openNowOnly,
  expanded,
  onPress,
  embedded = false,
}: MapFiltersTriggerProps) {
  const active = hasActiveFilters(radiusKm, openNowOnly);

  if (embedded) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Cerrar filtros' : 'Abrir filtros del mapa'}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: expanded
            ? '#2B8FD4'
            : pressed
              ? 'rgba(43, 143, 212, 0.12)'
              : 'transparent',
        })}
      >
        <Ionicons
          name={expanded ? 'close' : 'options-outline'}
          size={22}
          color={expanded ? '#FFFFFF' : active ? '#2B8FD4' : '#64748B'}
        />
        {active && !expanded ? (
          <View
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#2B8FD4',
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            }}
          />
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Cerrar filtros' : 'Abrir filtros del mapa'}
      style={({ pressed }) => ({
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: expanded
          ? '#2B8FD4'
          : pressed
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.72)',
        borderWidth: 1.5,
        borderColor: expanded ? '#2B8FD4' : active ? '#2B8FD4' : 'rgba(226,232,240,0.65)',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: expanded ? 4 : 1 },
        shadowOpacity: expanded ? 0.15 : 0.06,
        shadowRadius: expanded ? 8 : 4,
        elevation: expanded ? 6 : 2,
      })}
    >
      <Ionicons
        name={expanded ? 'close' : 'options-outline'}
        size={22}
        color={expanded ? '#FFFFFF' : active ? '#2B8FD4' : '#64748B'}
      />
      {active && !expanded ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#2B8FD4',
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
          }}
        />
      ) : null}
    </Pressable>
  );
}

export function MapStoreFilters({
  radiusKm,
  onRadiusChange,
  openNowOnly,
  onOpenNowChange,
  expanded,
  onExpandedChange,
  searchActive = false,
}: MapStoreFiltersProps) {
  useEffect(() => {
    if (searchActive) onExpandedChange(false);
  }, [searchActive, onExpandedChange]);

  if (!expanded) return null;

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Filtros del mapa</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#2B8FD4' }}>
          {radiusSummary(radiusKm)}
          {openNowOnly ? ' · Abiertas' : ''}
        </Text>
      </View>

      <View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#94A3B8',
            letterSpacing: 0.6,
            marginBottom: 8,
            marginLeft: 2,
          }}
        >
          DISTANCIA
        </Text>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F1F5F9',
            borderRadius: 10,
            padding: 3,
          }}
        >
          {RADIUS_LABELS.map(({ value, label }) => {
            const selected = radiusKm === value;
            return (
              <Pressable
                key={label}
                onPress={() => onRadiusChange(value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: selected ? '#FFFFFF' : 'transparent',
                  ...(selected
                    ? {
                        shadowColor: '#0F172A',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 3,
                        elevation: 2,
                      }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: selected ? '#2B8FD4' : '#64748B',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => onOpenNowChange(!openNowOnly)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 11,
          paddingHorizontal: 14,
          borderRadius: 10,
          backgroundColor: openNowOnly
            ? pressed
              ? '#DCFCE7'
              : '#F0FDF4'
            : pressed
              ? '#E2E8F0'
              : '#F1F5F9',
          borderWidth: 1,
          borderColor: openNowOnly ? '#BBF7D0' : '#E2E8F0',
        })}
      >
        <Ionicons
          name={openNowOnly ? 'checkmark-circle' : 'time-outline'}
          size={16}
          color={openNowOnly ? '#15803D' : '#64748B'}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: openNowOnly ? '#15803D' : '#475569',
          }}
        >
          Solo abiertas ahora
        </Text>
      </Pressable>
    </View>
  );
}
