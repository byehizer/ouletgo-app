import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchByImage, type LensSearchResult } from '../../src/api/lensApi';
import { ProductCard } from '../../src/components/ProductCard';
import type { CatalogProduct } from '../../src/api/catalogApi';
import { Colors } from '../../src/theme/colors';

type SearchState =
  | { phase: 'idle' }
  | { phase: 'searching'; imageUri: string }
  | { phase: 'results'; imageUri: string; result: LensSearchResult }
  | { phase: 'error'; imageUri: string; message: string };

/** Sin `aspect`: el recorte nativo permite elegir cualquier zona (no solo cuadrado 1:1). */
const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  allowsEditing: true,
};

function VisualActionCard({
  icon,
  title,
  subtitle,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
    >
      <View style={styles.actionCardInner}>
        <View style={[styles.actionIconWrap, primary && styles.actionIconWrapPrimary]}>
          <Ionicons
            name={icon}
            size={24}
            color={primary ? '#fff' : Colors.brand.DEFAULT}
          />
        </View>
        <View style={styles.actionCardBody}>
          <Text style={styles.actionCardTitle}>{title}</Text>
          <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </View>
    </Pressable>
  );
}

export default function VisualSearchScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columnGap = 12;
  const horizontalPad = 16;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const [state, setState] = useState<SearchState>({ phase: 'idle' });

  const pickAndSearch = async (fromCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso necesario', 'Permití el acceso a la cámara para buscar por foto.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso necesario', 'Permití el acceso a la galería para buscar por foto.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
      }

      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      setState({ phase: 'searching', imageUri: uri });

      const searchResult = await searchByImage(uri);
      setState({ phase: 'results', imageUri: uri, result: searchResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo procesar la imagen.';
      setState((prev) =>
        prev.phase === 'idle'
          ? { phase: 'error', imageUri: '', message: msg }
          : { phase: 'error', imageUri: (prev as { imageUri: string }).imageUri, message: msg },
      );
    }
  };

  const reset = () => setState({ phase: 'idle' });

  const renderProduct = ({ item }: { item: CatalogProduct }) => (
    <View style={{ width: cardWidth }}>
      <ProductCard product={item} onPress={(p) => router.push(`/product/${p.id}`)} />
    </View>
  );

  /* ── Fase: resultados ──────────────────────────────────────────── */
  if (state.phase === 'results') {
    const { imageUri, result } = state;
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Resultados visuales',
            headerRight: () => (
              <Pressable onPress={reset} hitSlop={12}>
                <Ionicons name="camera-outline" size={24} color={Colors.brand.DEFAULT} />
              </Pressable>
            ),
          }}
        />
        <FlatList
          data={result.products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPad }}
          contentContainerStyle={styles.resultList}
          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <View style={styles.resultMeta}>
                {result.detectedTags.length > 0 ? (
                  <>
                    <Text style={styles.detectedLabel}>Detectado en tu foto</Text>
                    <View style={styles.tagRow}>
                      {result.detectedTags.map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
                {!result.hasMeaningfulResults ? (
                  <Text style={styles.lowConfidence}>
                    No encontramos coincidencias exactas. Mostramos sugerencias similares.
                  </Text>
                ) : null}
                <Text style={styles.resultCount}>
                  {result.products.length}{' '}
                  {result.products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyBody}>
                No encontramos prendas similares. Probá con otra foto.
              </Text>
              <Pressable onPress={reset} style={styles.retryBtn}>
                <Text style={styles.retryText}>Buscar otra foto</Text>
              </Pressable>
            </View>
          }
          renderItem={renderProduct}
        />
      </>
    );
  }

  /* ── Fase: buscando ────────────────────────────────────────────── */
  if (state.phase === 'searching') {
    return (
      <>
        <Stack.Screen options={{ title: 'Buscando…' }} />
        <View style={styles.centerFull}>
          <Image source={{ uri: state.imageUri }} style={styles.previewLarge} />
          <ActivityIndicator size="large" color={Colors.brand.DEFAULT} style={{ marginTop: 24 }} />
          <Text style={styles.searchingText}>Analizando imagen…</Text>
          <Text style={styles.searchingHint}>Buscamos prendas similares en OutletGo</Text>
        </View>
      </>
    );
  }

  /* ── Fase: error ───────────────────────────────────────────────── */
  if (state.phase === 'error') {
    return (
      <>
        <Stack.Screen options={{ title: 'Búsqueda visual' }} />
        <View style={styles.centerFull}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={40} color={Colors.danger.DEFAULT} />
          </View>
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorBody}>{state.message}</Text>
          <Pressable onPress={reset} style={styles.retryBtn}>
            <Text style={styles.retryText}>Volver a intentar</Text>
          </Pressable>
        </View>
      </>
    );
  }

  /* ── Fase: idle (pantalla inicial) ─────────────────────────────── */
  return (
    <>
      <Stack.Screen options={{ title: 'Buscar por foto' }} />
      <ScrollView
        style={styles.idleScroll}
        contentContainerStyle={[
          styles.idleScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="scan-outline" size={40} color={Colors.brand.DEFAULT} />
          </View>
          <Text style={styles.heroTitle}>Búsqueda visual</Text>
          <Text style={styles.heroBody}>
            Sacá o subí una foto de una prenda y encontramos artículos similares en OutletGo.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>¿Cómo querés buscar?</Text>
        <View style={styles.actionCards}>
          <VisualActionCard
            icon="camera-outline"
            title="Usar cámara"
            subtitle="Sacá una foto y recortá la prenda"
            primary
            onPress={() => void pickAndSearch(true)}
          />
          <VisualActionCard
            icon="images-outline"
            title="Elegir de galería"
            subtitle="Elegí la foto y marcá el área a buscar"
            onPress={() => void pickAndSearch(false)}
          />
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Mejores resultados</Text>
          {[
            'Al recortar, marcá solo la prenda (podés usar cualquier forma, no solo un cuadrado)',
            'Enfocá la prenda con buena iluminación',
            'Evitá fondos con muchos elementos',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success.text} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  /* idle */
  idleScroll: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  idleScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 0,
  },
  heroCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionCards: {
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.card,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  actionCardPressed: {
    opacity: 0.9,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  actionIconWrapPrimary: {
    backgroundColor: Colors.brand.DEFAULT,
    borderColor: Colors.brand.dark,
  },
  actionCardBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  tips: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    gap: 8,
    marginTop: 4,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  /* searching */
  centerFull: {
    flex: 1,
    backgroundColor: Colors.surface.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  previewLarge: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: Colors.brand.bgLight,
  },
  searchingText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
  },
  searchingHint: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  /* error */
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  errorBody: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: Colors.brand.DEFAULT,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  /* results */
  resultList: {
    paddingBottom: 32,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    marginBottom: 12,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.brand.bgLight,
  },
  resultMeta: {
    flex: 1,
    gap: 6,
  },
  detectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.brand.bgLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  lowConfidence: {
    fontSize: 12,
    color: Colors.warning.text,
    lineHeight: 18,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  /* empty */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
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
});
