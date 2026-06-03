import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchProductReportStatus,
  fetchStoreReportStatus,
  getReportReasons,
  submitProductReport,
  submitStoreReport,
  type ReportTargetType,
} from '../api/reportApi';
import { AuthButton } from './auth/AuthButton';
import { Colors } from '../theme/colors';

interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ReportSheet({
  visible,
  targetType,
  targetId,
  targetName,
  onClose,
  onSubmitted,
}: ReportSheetProps) {
  const insets = useSafeAreaInsets();
  const reasons = getReportReasons(targetType);

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasActiveReport, setHasActiveReport] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedReason(null);
    setDetails('');
    setHasActiveReport(false);

    void (async () => {
      setCheckingStatus(true);
      try {
        const status =
          targetType === 'PRODUCT'
            ? await fetchProductReportStatus(targetId)
            : await fetchStoreReportStatus(targetId);
        setHasActiveReport(status.hasActiveReport);
      } catch {
        setHasActiveReport(false);
      } finally {
        setCheckingStatus(false);
      }
    })();
  }, [visible, targetType, targetId]);

  const needsDetails = selectedReason === 'OTHER';
  const canSubmit =
    Boolean(selectedReason) &&
    (!needsDetails || details.trim().length >= 10) &&
    !hasActiveReport &&
    !loading;

  const handleSubmit = async () => {
    if (!selectedReason || !canSubmit) return;

    setLoading(true);
    try {
      const body = {
        reason: selectedReason,
        details: details.trim() || undefined,
      };
      const meta = { targetName };

      if (targetType === 'PRODUCT') {
        await submitProductReport(targetId, body, meta);
      } else {
        await submitStoreReport(targetId, body, meta);
      }

      onSubmitted?.();
      onClose();

      Alert.alert(
        'Reporte enviado',
        'Revisaremos tu reporte. Te avisaremos cuando el equipo lo procese.',
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Ver mis reportes',
            onPress: () => router.push('/profile/reports'),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        'No se pudo enviar',
        err instanceof Error ? err.message : 'Intentá de nuevo más tarde.',
      );
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = targetType === 'PRODUCT' ? 'Producto' : 'Tienda';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="flag-outline" size={22} color={Colors.danger.DEFAULT} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Reportar {targetLabel.toLowerCase()}</Text>
              <Text style={styles.targetName} numberOfLines={2}>
                {targetName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.text.muted} />
            </Pressable>
          </View>

          {checkingStatus ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color={Colors.brand.DEFAULT} />
          ) : hasActiveReport ? (
            <View style={styles.activeBanner}>
              <Ionicons name="time-outline" size={22} color={Colors.warning.text} />
              <Text style={styles.activeBannerText}>
                Ya tenés un reporte en revisión sobre este {targetLabel.toLowerCase()}. Podés
                seguir el estado en Perfil → Mis reportes.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Motivo del reporte *</Text>
              <View style={styles.reasonList}>
                {reasons.map((reason) => {
                  const selected = selectedReason === reason.id;
                  return (
                    <Pressable
                      key={reason.id}
                      onPress={() => setSelectedReason(reason.id)}
                      style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                    >
                      <View
                        style={[styles.reasonRadio, selected && styles.reasonRadioSelected]}
                      >
                        {selected ? (
                          <View style={styles.reasonRadioDot} />
                        ) : null}
                      </View>
                      <Text
                        style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}
                      >
                        {reason.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>
                {needsDetails ? 'Contanos qué pasó *' : 'Detalle adicional (opcional)'}
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder={
                  needsDetails
                    ? 'Mínimo 10 caracteres…'
                    : 'Más información para el equipo de moderación'
                }
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
              />
              {needsDetails && details.trim().length > 0 && details.trim().length < 10 ? (
                <Text style={styles.hintError}>Escribí al menos 10 caracteres.</Text>
              ) : null}

              <AuthButton
                label="Enviar reporte"
                loading={loading}
                disabled={!canSubmit}
                onPress={() => void handleSubmit()}
              />

              <Text style={styles.disclaimer}>
                Los reportes son revisados por el equipo de OutletGo. El abuso puede resultar en la
                suspensión de tu cuenta.
              </Text>
            </ScrollView>
          )}

          {hasActiveReport ? (
            <AuthButton
              label="Ver mis reportes"
              variant="secondary"
              onPress={() => {
                onClose();
                router.push('/profile/reports');
              }}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.DEFAULT,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  targetName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  scroll: {
    maxHeight: 480,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  reasonList: {
    gap: 8,
    marginBottom: 20,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.base,
  },
  reasonChipSelected: {
    borderColor: Colors.brand.DEFAULT,
    backgroundColor: Colors.brand.bgLight,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioSelected: {
    borderColor: Colors.brand.DEFAULT,
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.DEFAULT,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  reasonLabelSelected: {
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  textArea: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.input,
    marginBottom: 8,
  },
  hintError: {
    fontSize: 12,
    color: Colors.danger.text,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 8,
  },
  activeBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.warning.bg,
    borderWidth: 1,
    borderColor: Colors.warning.DEFAULT,
    marginBottom: 16,
  },
  activeBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning.text,
    lineHeight: 20,
  },
});
