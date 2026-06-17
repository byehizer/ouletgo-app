import { Image, type ImageStyle, StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import {
  BRAND_ISOTYPE_UI_SIZE,
  BRAND_LOGOTYPE_ASPECT,
  BrandAssets,
  type BrandAssetKey,
} from '../assets/brand';

export type BrandLogoVariant = BrandAssetKey;

export interface BrandLogoProps {
  /** `isotype` = solo ícono; `logotype` = ícono + nombre */
  variant?: BrandLogoVariant;
  /** Ancho en px. Si no pasás `height`, se calcula según la variante. */
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

function resolveSize(
  variant: BrandLogoVariant,
  width?: number,
  height?: number,
): { width: number; height: number } {
  if (width != null && height != null) {
    return { width, height };
  }
  if (variant === 'isotype') {
    const side = width ?? height ?? BRAND_ISOTYPE_UI_SIZE;
    return { width: side, height: side };
  }
  const w = width ?? 220;
  const h = height ?? Math.round(w / BRAND_LOGOTYPE_ASPECT);
  return { width: w, height: h };
}

export function BrandLogo({
  variant = 'logotype',
  width,
  height,
  style,
  imageStyle,
  accessibilityLabel,
}: BrandLogoProps) {
  const size = resolveSize(variant, width, height);
  const label =
    accessibilityLabel ?? (variant === 'isotype' ? 'OutletGo' : 'OutletGo — logo');

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={BrandAssets[variant]}
        accessibilityLabel={label}
        accessibilityRole="image"
        resizeMode="contain"
        style={[size, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
