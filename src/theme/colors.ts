/**
 * Design tokens del sistema de diseño mobile de OutletGo.
 * Usar estas constantes cuando no sea posible usar clases NativeWind.
 * Siempre preferir las clases NativeWind definidas en tailwind.config.js.
 */

export const Colors = {
  brand: {
    DEFAULT: '#2B8FD4',
    dark: '#1A3F7A',
    light: '#5AAEE0',
    bgLight: '#E8F4FD',
  },
  success: {
    DEFAULT: '#22c55e',
    bg: '#f0fdf4',
    text: '#16a34a',
  },
  warning: {
    DEFAULT: '#f59e0b',
    bg: '#fffbeb',
    text: '#d97706',
  },
  danger: {
    DEFAULT: '#ef4444',
    bg: '#fef2f2',
    text: '#dc2626',
  },
  info: {
    DEFAULT: '#2B8FD4',
    bg: '#E8F4FD',
    text: '#1A3F7A',
  },
  neutral: {
    bg: '#f1f5f9',
    text: '#64748b',
  },
  surface: {
    base: '#f5f7fa',
    card: '#ffffff',
    input: '#ffffff',
  },
  border: {
    DEFAULT: '#e2e8f0',
    focus: '#2B8FD4',
    error: '#ef4444',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    link: '#1A3F7A',
  },
} as const;

export type ColorKey = keyof typeof Colors;
