/**
 * Checkout — Paso 11
 *
 * Flujo:
 *   1. Selección de método de entrega (RETIRO_EN_PUNTO / ENVIO_CORREO)
 *   2. Si RETIRO_EN_PUNTO: elegir punto OutletGo
 *      Si ENVIO_CORREO:   dirección + CP → cotizar carriers → elegir uno
 *   3. Resumen de pago → botón "Pagar con Mercado Pago"
 *   4. WebBrowser abre Checkout Pro → deep link de retorno → resultado
 */
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type CheckoutItemPayload,
  type CheckoutSummary,
  type CheckoutStorePayload,
  createOrder,
  getCheckoutSummary,
  parseMpReturnUrl,
  type MpPaymentStatus,
} from '../../src/api/checkoutApi';
import {
  getPickupPoints,
  getShippingQuotes,
  type OutletGoPickupPoint,
  type ShippingQuote,
} from '../../src/api/shippingApi';
import type { ShippingCarrier, ShippingMethod } from '../../src/api/types';
import { SHIPPING_CARRIER_LABELS } from '../../src/api/types';
import { USE_MOCKS } from '../../src/config/env';
import { useCart } from '../../src/context/CartContext';
import { cartFingerprint, clearIdempotencyKey, getOrCreateIdempotencyKey } from '../../src/lib/idempotency';
import { formatARS } from '../../src/lib/format';
import { Colors } from '../../src/theme/colors';

// ---------------------------------------------------------------------------
// Internal state types
// ---------------------------------------------------------------------------

type CheckoutPhase = 'form' | 'submitting' | 'success' | 'payment_pending' | 'failed';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children, inCard = false }: { children: string; inCard?: boolean }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: inCard ? 0 : 4,
        paddingHorizontal: inCard ? 16 : 0,
        paddingTop: inCard ? 16 : 0,
      }}
    >
      {children}
    </Text>
  );
}

function RadioCard({
  selected,
  onPress,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}
    >
      <View style={[styles.optionIconBox, selected && styles.optionIconBoxSelected]}>
        <Ionicons name={icon} size={20} color={selected ? '#fff' : Colors.text.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function PickupPointCard({
  point,
  selected,
  onSelect,
}: {
  point: OutletGoPickupPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionCard,
        styles.optionCardTall,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}
    >
      <View style={[styles.optionIconBox, styles.optionIconBoxSm, selected && styles.optionIconBoxSelected]}>
        <Ionicons name="storefront" size={18} color={selected ? '#fff' : Colors.text.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{point.name}</Text>
        <Text style={styles.optionSubtitle}>
          {point.address} · {point.neighborhood}
        </Text>
        <Text style={[styles.optionSubtitle, { marginTop: 2 }]}>{point.businessHours}</Text>
        {point.distanceKm != null ? (
          <Text style={{ fontSize: 12, color: Colors.brand.DEFAULT, fontWeight: '600', marginTop: 4 }}>
            {point.distanceKm.toFixed(1)} km
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function CarrierCard({
  quote,
  selected,
  onSelect,
}: {
  quote: ShippingQuote;
  selected: boolean;
  onSelect: () => void;
}) {
  const carrierIcon: keyof typeof Ionicons.glyphMap =
    quote.carrier === 'ANDREANI' ? 'cube-outline' : 'mail-outline';

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}
    >
      <View style={[styles.optionIconBox, styles.optionIconBoxSm, selected && styles.optionIconBoxSelected]}>
        <Ionicons name={carrierIcon} size={18} color={selected ? '#fff' : Colors.text.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{SHIPPING_CARRIER_LABELS[quote.carrier]}</Text>
        <Text style={styles.optionSubtitle}>
          {quote.estimatedDays} {quote.estimatedDays === 1 ? 'día hábil' : 'días hábiles'}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.brand.dark }}>
        {formatARS(quote.cost)}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Result screens
// ---------------------------------------------------------------------------

function ResultScreen({
  phase,
  orderId,
  onGoToOrders,
  onRetry,
  onBackToCart,
}: {
  phase: 'success' | 'payment_pending' | 'failed';
  orderId: string | null;
  onGoToOrders: () => void;
  onRetry: () => void;
  onBackToCart: () => void;
}) {
  const insets = useSafeAreaInsets();

  const config = {
    success: {
      icon: 'checkmark-circle' as const,
      iconColor: Colors.success.DEFAULT,
      iconBg: Colors.success.bg,
      title: '¡Pago exitoso!',
      body: orderId
        ? `Tu pedido #${orderId} fue confirmado. OutletGo empieza a coordinar la recolección en las tiendas.`
        : 'Tu pedido fue confirmado. OutletGo coordina la recolección y entrega.',
      primaryLabel: 'Ver mis pedidos',
      primaryAction: onGoToOrders,
      secondaryLabel: null as string | null,
      secondaryAction: null as (() => void) | null,
    },
    payment_pending: {
      icon: 'time' as const,
      iconColor: Colors.warning.DEFAULT,
      iconBg: Colors.warning.bg,
      title: 'Pago en proceso',
      body: 'Tu pago está siendo procesado por Mercado Pago. Te avisamos cuando se acredite.',
      primaryLabel: 'Ver mis pedidos',
      primaryAction: onGoToOrders,
      secondaryLabel: 'Volver al inicio',
      secondaryAction: () => router.replace('/(tabs)'),
    },
    failed: {
      icon: 'close-circle' as const,
      iconColor: Colors.danger.DEFAULT,
      iconBg: Colors.danger.bg,
      title: 'El pago no se procesó',
      body: 'Hubo un problema con el pago. Podés intentarlo de nuevo o volver al carrito.',
      primaryLabel: 'Intentar de nuevo',
      primaryAction: onRetry,
      secondaryLabel: 'Volver al carrito',
      secondaryAction: onBackToCart,
    },
  }[phase];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface.base,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        paddingBottom: Math.max(insets.bottom, 24) + 16,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: config.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Ionicons name={config.icon} size={44} color={config.iconColor} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: Colors.text.primary,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {config.title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: Colors.text.secondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: USE_MOCKS && phase === 'success' ? 12 : 32,
        }}
      >
        {config.body}
      </Text>
      {USE_MOCKS && phase === 'success' ? (
        <View
          style={{
            backgroundColor: Colors.warning.bg,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#FDE68A',
          }}
        >
          <Text style={{ fontSize: 12, color: Colors.warning.text, textAlign: 'center' }}>
            Modo demo — sin backend ni Mercado Pago real. El pago se simula como exitoso.
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={config.primaryAction}
        style={styles.resultPrimaryBtn}
        accessibilityRole="button"
      >
        <Text style={styles.resultPrimaryBtnText}>{config.primaryLabel}</Text>
      </TouchableOpacity>
      {config.secondaryLabel ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={config.secondaryAction ?? undefined}
          style={styles.resultSecondaryBtn}
          accessibilityRole="button"
        >
          <Text style={styles.resultSecondaryBtnText}>{config.secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { items, groups, subtotal, clearCart, isHydrated } = useCart();

  // -- Phase --
  const [phase, setPhase] = useState<CheckoutPhase>('form');
  const [resultOrderId, setResultOrderId] = useState<string | null>(null);

  // -- Delivery form --
  const [deliveryMethod, setDeliveryMethod] = useState<ShippingMethod>('RETIRO_EN_PUNTO');
  const [pickupPoints, setPickupPoints] = useState<OutletGoPickupPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);

  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quotesFetched, setQuotesFetched] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrier | null>(null);
  const lastQuotedPostalCode = useRef<string | null>(null);

  // -- Summary collapsed --
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const isSubmitting = useRef(false);

  // Load pickup points when method is RETIRO_EN_PUNTO
  useEffect(() => {
    if (deliveryMethod !== 'RETIRO_EN_PUNTO') return;
    if (pickupPoints.length > 0) return;
    setLoadingPoints(true);
    getPickupPoints()
      .then((pts) => {
        setPickupPoints(pts);
        if (pts[0]) setSelectedPickupId(pts[0].id);
      })
      .catch(() => {
        Alert.alert('Error', 'No se pudieron cargar los puntos de retiro.');
      })
      .finally(() => setLoadingPoints(false));
  }, [deliveryMethod, pickupPoints.length]);

  const handleFetchQuotes = useCallback(async (cpOverride?: string) => {
    const cp = (cpOverride ?? postalCode).trim();
    if (!cp || cp.length < 4) return;
    if (lastQuotedPostalCode.current === cp) return;

    setLoadingQuotes(true);
    setSelectedCarrier(null);
    try {
      const result = await getShippingQuotes({ postalCode: cp });
      setQuotes(result);
      setQuotesFetched(true);
      lastQuotedPostalCode.current = cp;
    } catch {
      setQuotes([]);
      setQuotesFetched(false);
      lastQuotedPostalCode.current = null;
      Alert.alert('Error', 'No se pudo cotizar el envío. Verificá el código postal e intentá de nuevo.');
    } finally {
      setLoadingQuotes(false);
    }
  }, [postalCode]);

  // Auto-cotizar al completar el CP (4+ dígitos)
  useEffect(() => {
    if (deliveryMethod !== 'ENVIO_CORREO') return;
    const cp = postalCode.trim();
    if (cp.length < 4) return;

    const timer = setTimeout(() => {
      void handleFetchQuotes(cp);
    }, 500);

    return () => clearTimeout(timer);
  }, [deliveryMethod, postalCode, handleFetchQuotes]);

  // Limpiar cotización al cambiar de método
  useEffect(() => {
    if (deliveryMethod === 'ENVIO_CORREO') return;
    setQuotes([]);
    setQuotesFetched(false);
    setSelectedCarrier(null);
    lastQuotedPostalCode.current = null;
  }, [deliveryMethod]);

  // Derived: selected quote
  const selectedQuote = quotes.find((q) => q.carrier === selectedCarrier) ?? null;
  const shippingCost = deliveryMethod === 'RETIRO_EN_PUNTO' ? 0 : (selectedQuote?.cost ?? 0);

  // Checkout summary (productos + envío + tarifa de servicio)
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const formReadyForSummary =
    deliveryMethod === 'RETIRO_EN_PUNTO'
      ? selectedPickupId != null
      : selectedCarrier != null && selectedQuote != null;

  useEffect(() => {
    if (!formReadyForSummary) {
      setSummary(null);
      return;
    }
    setLoadingSummary(true);
    getCheckoutSummary({
      productSubtotal: subtotal,
      method: deliveryMethod,
      carrier: deliveryMethod === 'ENVIO_CORREO' ? selectedCarrier : null,
      quotedShippingCost: shippingCost,
    })
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));
  }, [formReadyForSummary, subtotal, deliveryMethod, selectedCarrier, shippingCost]);

  const total = summary?.total ?? subtotal + shippingCost;

  const isFormValid =
    deliveryMethod === 'RETIRO_EN_PUNTO'
      ? selectedPickupId != null
      : address.trim().length > 0 && selectedCarrier != null && selectedQuote != null;

  const payButtonLabel = (() => {
    if (isFormValid) return `Pagar ${formatARS(total)} con Mercado Pago`;
    if (deliveryMethod === 'RETIRO_EN_PUNTO') return 'Elegí un punto de retiro';
    if (!address.trim()) return 'Ingresá la dirección de entrega';
    if (postalCode.trim().length < 4) return 'Ingresá el código postal';
    if (loadingQuotes) return 'Cotizando envío…';
    if (!selectedCarrier) return 'Elegí Correo Argentino o Andreani';
    return 'Completá los datos de entrega';
  })();

  // -- Payment --
  const handlePay = useCallback(async () => {
    if (!isFormValid || isSubmitting.current) return;
    isSubmitting.current = true;
    setPhase('submitting');

    try {
      const fp = cartFingerprint(items);
      const idempotencyKey = await getOrCreateIdempotencyKey(fp);

      const storeGroups: CheckoutStorePayload[] = groups.map((g) => ({
        storeId: g.storeId,
        items: g.items.map(
          (item): CheckoutItemPayload => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
            unitPrice: item.price,
          }),
        ),
      }));

      const { orderId, mpInitPoint } = await createOrder({
        storeGroups,
        shipping: {
          method: deliveryMethod,
          carrier: deliveryMethod === 'ENVIO_CORREO' ? selectedCarrier : null,
          quotedCost: shippingCost,
          estimatedDays: selectedQuote?.estimatedDays ?? null,
          deliveryAddress: deliveryMethod === 'ENVIO_CORREO' ? address.trim() : null,
          postalCode: deliveryMethod === 'ENVIO_CORREO' ? postalCode.trim() : null,
          pickupPointId: deliveryMethod === 'RETIRO_EN_PUNTO' ? selectedPickupId : null,
        },
        idempotencyKey,
      });

      // En modo mock no hay MP real: procesamos el deep link simulado directamente
      let mpStatus: MpPaymentStatus = 'failure';
      let finalOrderId: string | null = orderId;

      if (USE_MOCKS) {
        const parsed = parseMpReturnUrl(mpInitPoint);
        mpStatus = parsed.status;
        if (parsed.orderId) finalOrderId = parsed.orderId;
      } else {
        const returnScheme = 'outletgo://';
        const result = await WebBrowser.openAuthSessionAsync(mpInitPoint, returnScheme);

        if (result.type === 'success' && result.url) {
          const parsed = parseMpReturnUrl(result.url);
          mpStatus = parsed.status;
          if (parsed.orderId) finalOrderId = parsed.orderId;
        } else if (result.type === 'cancel') {
          mpStatus = 'pending';
        }
      }

      setResultOrderId(finalOrderId);

      if (mpStatus === 'approved') {
        await clearIdempotencyKey(fp);
        clearCart();
        setPhase('success');
      } else if (mpStatus === 'pending') {
        setPhase('payment_pending');
      } else {
        setPhase('failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Algo salió mal. Intentá de nuevo.';
      Alert.alert('Error al procesar el pago', message);
      setPhase('form');
    } finally {
      isSubmitting.current = false;
    }
  }, [
    isFormValid,
    items,
    groups,
    deliveryMethod,
    selectedCarrier,
    shippingCost,
    selectedQuote,
    address,
    postalCode,
    selectedPickupId,
    clearCart,
  ]);

  // -- Result handlers --
  const handleGoToOrders = useCallback(() => {
    router.replace('/(tabs)/orders');
  }, []);

  const handleRetry = useCallback(() => {
    setPhase('form');
  }, []);

  const handleBackToCart = useCallback(() => {
    router.back();
  }, []);

  // -- Guard: empty cart --
  if (isHydrated && items.length === 0 && phase === 'form') {
    router.replace('/cart');
    return null;
  }

  // -- Result screens --
  if (phase === 'success' || phase === 'payment_pending' || phase === 'failed') {
    return (
      <>
        <Stack.Screen options={{ title: phase === 'success' ? '¡Pedido confirmado!' : 'Resultado del pago', headerLeft: () => null }} />
        <ResultScreen
          phase={phase}
          orderId={resultOrderId}
          onGoToOrders={handleGoToOrders}
          onRetry={handleRetry}
          onBackToCart={handleBackToCart}
        />
      </>
    );
  }

  // -- Submitting overlay --
  if (phase === 'submitting') {
    return (
      <>
        <Stack.Screen options={{ title: 'Procesando pago…', headerLeft: () => null }} />
        <View style={{ flex: 1, backgroundColor: Colors.surface.base, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={Colors.brand.DEFAULT} />
          <Text style={{ fontSize: 16, color: Colors.text.secondary }}>Procesando tu pedido…</Text>
        </View>
      </>
    );
  }

  // -- Form --
  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.surface.base }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Resumen del pedido ── */}
          <SectionTitle>Resumen del pedido</SectionTitle>
          <Pressable
            onPress={() => setSummaryExpanded((v) => !v)}
            style={{
              backgroundColor: Colors.surface.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border.DEFAULT,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="bag-outline" size={18} color={Colors.brand.DEFAULT} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary }}>
                  {items.reduce((s, i) => s + i.quantity, 0)} productos ·{' '}
                  {groups.length} {groups.length === 1 ? 'tienda' : 'tiendas'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.brand.dark }}>
                  {formatARS(subtotal)}
                </Text>
                <Ionicons
                  name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.text.muted}
                />
              </View>
            </View>

            {summaryExpanded
              ? groups.map((g) => (
                  <View
                    key={g.storeId}
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: Colors.border.DEFAULT,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text.secondary, marginBottom: 6 }}>
                      {g.storeName}
                    </Text>
                    {g.items.map((item) => (
                      <View
                        key={item.variationId}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                      >
                        <Text style={{ fontSize: 13, color: Colors.text.primary, flex: 1 }} numberOfLines={1}>
                          {item.quantity}× {item.productName}
                          {item.variationLabel ? ` (${item.variationLabel})` : ''}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text.primary, marginLeft: 8 }}>
                          {formatARS(item.price * item.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              : null}
          </Pressable>

          {/* ── Método de entrega ── */}
          <SectionTitle>Método de entrega</SectionTitle>
          <View style={styles.optionList}>
            <RadioCard
              selected={deliveryMethod === 'RETIRO_EN_PUNTO'}
              onPress={() => setDeliveryMethod('RETIRO_EN_PUNTO')}
              icon="storefront-outline"
              title="Retiro en punto OutletGo"
              subtitle="Gratis · Retirás cuando esté listo"
            />
            <RadioCard
              selected={deliveryMethod === 'ENVIO_CORREO'}
              onPress={() => setDeliveryMethod('ENVIO_CORREO')}
              icon="cube-outline"
              title="Envío a domicilio"
              subtitle="Correo Argentino o Andreani"
            />
          </View>

          {/* ── Puntos de retiro ── */}
          {deliveryMethod === 'RETIRO_EN_PUNTO' ? (
            <View style={{ marginTop: 20 }}>
              <SectionTitle>Elegí un punto de retiro</SectionTitle>
              {loadingPoints ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={Colors.brand.DEFAULT} />
                  <Text style={{ fontSize: 13, color: Colors.text.muted, marginTop: 8 }}>
                    Cargando puntos…
                  </Text>
                </View>
              ) : (
                <View style={styles.optionList}>
                  {pickupPoints.map((pt) => (
                    <PickupPointCard
                      key={pt.id}
                      point={pt}
                      selected={selectedPickupId === pt.id}
                      onSelect={() => setSelectedPickupId(pt.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* ── Envío a domicilio ── */}
          {deliveryMethod === 'ENVIO_CORREO' ? (
            <View style={{ marginTop: 16 }}>
              <SectionTitle>Datos de entrega</SectionTitle>

              {/* Dirección */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6 }}>
                Dirección
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                placeholderTextColor={Colors.text.muted}
                style={{
                  backgroundColor: Colors.surface.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.border.DEFAULT,
                  padding: 12,
                  fontSize: 14,
                  color: Colors.text.primary,
                  marginBottom: 12,
                }}
                returnKeyType="next"
                autoCorrect={false}
              />

              {/* CP + Cotizar */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6 }}>
                Código postal
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TextInput
                  value={postalCode}
                  onChangeText={(t) => {
                    setPostalCode(t);
                    setQuotesFetched(false);
                    setSelectedCarrier(null);
                    lastQuotedPostalCode.current = null;
                  }}
                  placeholder="Ej: 1043"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={8}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.surface.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: Colors.border.DEFAULT,
                    padding: 12,
                    fontSize: 14,
                    color: Colors.text.primary,
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleFetchQuotes()}
                  disabled={loadingQuotes || postalCode.trim().length < 4}
                  style={[
                    styles.quoteBtn,
                    (loadingQuotes || postalCode.trim().length < 4) && styles.quoteBtnDisabled,
                  ]}
                >
                  {loadingQuotes ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.quoteBtnText,
                        postalCode.trim().length < 4 && styles.quoteBtnTextDisabled,
                      ]}
                    >
                      Cotizar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {postalCode.trim().length > 0 && postalCode.trim().length < 4 ? (
                <Text style={styles.shippingHint}>El código postal debe tener al menos 4 dígitos.</Text>
              ) : null}

              {loadingQuotes ? (
                <View style={styles.shippingLoading}>
                  <ActivityIndicator color={Colors.brand.DEFAULT} />
                  <Text style={styles.shippingHint}>Cotizando envío…</Text>
                </View>
              ) : null}

              {/* Carriers */}
              {quotesFetched && quotes.length > 0 ? (
                <View>
                  <SectionTitle>Elegí el servicio de envío</SectionTitle>
                  <View style={styles.optionList}>
                    {quotes.map((q) => (
                      <CarrierCard
                        key={q.carrier}
                        quote={q}
                        selected={selectedCarrier === q.carrier}
                        onSelect={() => setSelectedCarrier(q.carrier)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {quotesFetched && quotes.length === 0 ? (
                <Text style={styles.shippingHint}>
                  No hay opciones de envío para ese código postal.
                </Text>
              ) : null}

              {postalCode.trim().length >= 4 && !loadingQuotes && quotesFetched && !selectedCarrier ? (
                <Text style={styles.shippingHintSelect}>
                  Elegí Correo Argentino o Andreani para continuar.
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ── Desglose de pago ── */}
          <View style={styles.paymentDetailCard}>
            <SectionTitle inCard>Detalle del pago</SectionTitle>
            <View style={styles.paymentDetailBody}>
              {/* Productos */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Productos</Text>
                <Text style={styles.summaryValue}>{formatARS(subtotal)}</Text>
              </View>

              {/* Envío */}
              <View style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>
                    {deliveryMethod === 'RETIRO_EN_PUNTO'
                      ? 'Envío'
                      : `Envío${selectedCarrier ? ` (${selectedCarrier === 'ANDREANI' ? 'Andreani' : 'Correo Arg.'})` : ''}`}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>
                  {deliveryMethod === 'RETIRO_EN_PUNTO'
                    ? 'Gratis'
                    : selectedQuote
                      ? formatARS(selectedQuote.cost)
                      : '—'}
                </Text>
              </View>

              {/* Tarifa de servicio OutletGo */}
              {loadingSummary ? (
                <View style={[styles.summaryRow, { marginBottom: 6 }]}>
                  <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
                  <ActivityIndicator size="small" color={Colors.brand.DEFAULT} />
                </View>
              ) : summary ? (
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
                    {summary.serviceFeeLabel ? (
                      <Text style={{ fontSize: 11, color: Colors.text.muted, marginTop: 2 }}>
                        {summary.serviceFeeLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.summaryValue}>
                    {summary.serviceFee > 0 ? formatARS(summary.serviceFee) : 'Gratis'}
                  </Text>
                </View>
              ) : null}

              {/* Total */}
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{formatARS(total)}</Text>
              </View>

              {/* Nota MP */}
              <Text style={styles.summaryMpNote}>
                Se cobra mediante Mercado Pago al confirmar.
              </Text>
            </View>
          </View>

          {/* Spacer for footer */}
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Footer ── */}
        <View
          style={{
            backgroundColor: Colors.surface.card,
            borderTopWidth: 1,
            borderTopColor: Colors.border.DEFAULT,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePay}
            disabled={!isFormValid}
            style={[styles.payBtn, !isFormValid && styles.payBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={payButtonLabel}
          >
            <Ionicons
              name="card"
              size={22}
              color={isFormValid ? '#FFFFFF' : Colors.text.muted}
            />
            <Text style={[styles.payBtnText, !isFormValid && styles.payBtnTextDisabled]}>
              {payButtonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.card,
  },
  optionCardTall: {
    alignItems: 'flex-start',
  },
  optionCardSelected: {
    borderColor: Colors.brand.DEFAULT,
    backgroundColor: Colors.brand.bgLight,
  },
  optionCardPressed: {
    opacity: 0.85,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.neutral.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconBoxSm: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  optionIconBoxSelected: {
    backgroundColor: Colors.brand.DEFAULT,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 3,
    lineHeight: 17,
  },
  paymentDetailCard: {
    marginTop: 20,
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
  },
  paymentDetailBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
    marginBottom: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  summaryMpNote: {
    fontSize: 11,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  quoteBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
    minHeight: 48,
  },
  quoteBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  quoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quoteBtnTextDisabled: {
    color: Colors.text.muted,
  },
  shippingHint: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  shippingHintSelect: {
    fontSize: 13,
    color: Colors.brand.dark,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  shippingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  payBtn: {
    width: '100%',
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: Colors.brand.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: Colors.brand.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payBtnDisabled: {
    backgroundColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payBtnTextDisabled: {
    color: Colors.text.secondary,
  },
  resultPrimaryBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: Colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.brand.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultSecondaryBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultSecondaryBtnText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
