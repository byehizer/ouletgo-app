/**
 * Logos en pantalla (tamaño completo, sin padding de launcher).
 * Fuente: assets/brand/
 *
 * Launcher / splash nativos: assets/icon.png (con margen) y assets/splash.png
 * — ver scripts/pad-app-icon.ps1 y sync-brand-assets.ps1
 */
export const BrandAssets = {
  isotype: require('../../assets/brand/Isotipewhitemode.png'),
  logotype: require('../../assets/brand/Logotipewhitemode.png'),
} as const;

export type BrandAssetKey = keyof typeof BrandAssets;

/** Tamaño por defecto del isotipo en pantallas de carga / auth compacto */
export const BRAND_ISOTYPE_UI_SIZE = 112;

/** Proporción aproximada del logotipo horizontal (ancho / alto). */
export const BRAND_LOGOTYPE_ASPECT = 3.2;

export const BRAND_TAGLINE = 'Comprá en el polo textil de Avellaneda';
