import { StyleSheet, Text, View } from 'react-native';

import { BRAND_ISOTYPE_UI_SIZE, BRAND_TAGLINE } from '../../assets/brand';
import { BrandLogo } from '../BrandLogo';
import { Colors } from '../../theme/colors';

interface AuthBrandHeaderProps {
  showTagline?: boolean;
  /** `logotype` en login; `isotype` en pantallas secundarias más compactas */
  variant?: 'isotype' | 'logotype';
}

export function AuthBrandHeader({ showTagline = true, variant = 'logotype' }: AuthBrandHeaderProps) {
  return (
    <View style={styles.wrap}>
      <BrandLogo
        variant={variant}
        width={variant === 'logotype' ? 260 : BRAND_ISOTYPE_UI_SIZE}
        style={{ marginBottom: variant === 'logotype' ? 8 : 12 }}
      />
      {showTagline ? <Text style={styles.tagline}>{BRAND_TAGLINE}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  tagline: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
});
