import { Text, View } from 'react-native';

import type { StoreSchedule } from '../api/storeApi';
import { formatScheduleSlot, getDayLabel, getStoreLocalParts } from '../lib/storeSchedule';

interface BusinessHoursProps {
  schedule: StoreSchedule[];
}

export function BusinessHours({ schedule }: BusinessHoursProps) {
  if (schedule.length === 0) return null;

  const { dayOfWeek: todayIso } = getStoreLocalParts();

  const sorted = [...schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginTop: 16,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
        Horarios de atención
      </Text>
      <View style={{ gap: 8 }}>
        {sorted.map((entry) => {
          const isToday = entry.dayOfWeek === todayIso;
          return (
            <View
              key={entry.dayOfWeek}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: isToday ? 8 : 0,
                backgroundColor: isToday ? '#E8F4FD' : 'transparent',
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isToday ? '600' : '400',
                  color: isToday ? '#1A3F7A' : '#475569',
                }}
              >
                {getDayLabel(entry.dayOfWeek)}
                {isToday ? ' (hoy)' : ''}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isToday ? '600' : '400',
                  color: !entry.isOpen ? '#94A3B8' : isToday ? '#1A3F7A' : '#0F172A',
                }}
              >
                {formatScheduleSlot(entry)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
