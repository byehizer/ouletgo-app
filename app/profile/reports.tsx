import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  fetchMyReports,
  getReportStatusLabel,
  markReportsSeen,
  type BuyerReport,
  type ReportStatus,
} from '../../src/api/reportApi';
import { Colors } from '../../src/theme/colors';

function statusColors(status: ReportStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'PENDING':
      return { bg: Colors.neutral.bg, text: Colors.text.secondary, border: Colors.border.DEFAULT };
    case 'REVIEWING':
      return { bg: Colors.warning.bg, text: Colors.warning.text, border: Colors.warning.DEFAULT };
    case 'RESOLVED':
      return { bg: Colors.success.bg, text: Colors.success.text, border: Colors.success.DEFAULT };
    case 'DISMISSED':
      return { bg: Colors.neutral.bg, text: Colors.text.muted, border: Colors.border.DEFAULT };
    default:
      return { bg: Colors.neutral.bg, text: Colors.text.secondary, border: Colors.border.DEFAULT };
  }
}

function ReportCard({
  report,
  highlighted,
  onOpenTarget,
}: {
  report: BuyerReport;
  highlighted?: boolean;
  onOpenTarget: () => void;
}) {
  const colors = statusColors(report.status);
  const hasFeedback =
    (report.status === 'RESOLVED' || report.status === 'DISMISSED') && report.adminMessage;

  return (
    <View style={[styles.card, highlighted && styles.cardHighlighted]}>
      <View style={styles.cardTop}>
        <View style={styles.typeIcon}>
          <Ionicons
            name={report.targetType === 'PRODUCT' ? 'shirt-outline' : 'storefront-outline'}
            size={20}
            color={Colors.brand.DEFAULT}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {report.targetName}
          </Text>
          <Text style={styles.cardMeta}>
            {report.targetType === 'PRODUCT' ? 'Producto' : 'Tienda'} ·{' '}
            {format(new Date(report.createdAt), "d MMM yyyy", { locale: es })}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {getReportStatusLabel(report.status)}
          </Text>
        </View>
      </View>

      <View style={styles.reasonBlock}>
        <Text style={styles.reasonLabel}>Motivo</Text>
        <Text style={styles.reasonValue}>{report.reasonLabel}</Text>
        {report.details ? (
          <Text style={styles.detailsValue}>{report.details}</Text>
        ) : null}
      </View>

      {hasFeedback ? (
        <View style={styles.feedbackBlock}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.brand.DEFAULT} />
            <Text style={styles.feedbackTitle}>Respuesta del equipo</Text>
          </View>
          <Text style={styles.feedbackText}>{report.adminMessage}</Text>
          {report.resolvedAt ? (
            <Text style={styles.feedbackDate}>
              {format(new Date(report.resolvedAt), "d 'de' MMMM yyyy", { locale: es })}
            </Text>
          ) : null}
        </View>
      ) : report.status === 'PENDING' || report.status === 'REVIEWING' ? (
        <Text style={styles.pendingHint}>
          Tu reporte está en cola de moderación. Te notificaremos cuando haya novedades.
        </Text>
      ) : null}

      <Pressable onPress={onOpenTarget} style={styles.linkRow}>
        <Text style={styles.linkText}>Ver {report.targetType === 'PRODUCT' ? 'producto' : 'tienda'}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.brand.DEFAULT} />
      </Pressable>
    </View>
  );
}

export default function MyReportsScreen() {
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [reports, setReports] = useState<BuyerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyReports();
      setReports(data);
      setError(null);
      await markReportsSeen();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openTarget = (report: BuyerReport) => {
    if (report.targetType === 'PRODUCT') {
      router.push(`/product/${report.targetId}`);
    } else {
      router.push(`/store/${report.targetId}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Mis reportes' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }
      >
        <Text style={styles.intro}>
          Acá ves el estado de lo que reportaste y la respuesta del equipo cuando termina la revisión.
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={Colors.brand.DEFAULT} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : reports.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>Sin reportes</Text>
            <Text style={styles.emptyBody}>
              Cuando reportes un producto o tienda desde su detalle, lo vas a ver acá.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                highlighted={highlight === report.id}
                onOpenTarget={() => openTarget(report)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHighlighted: {
    borderColor: Colors.brand.DEFAULT,
    borderWidth: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reasonBlock: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  reasonValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 6,
    lineHeight: 19,
  },
  feedbackBlock: {
    backgroundColor: Colors.brand.bgLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 21,
  },
  feedbackDate: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 8,
  },
  pendingHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 19,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.DEFAULT,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  errorText: {
    color: Colors.danger.text,
    textAlign: 'center',
    marginTop: 24,
  },
});
