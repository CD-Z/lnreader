import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';
import { createFont, createTokens } from 'tamagui';

const bodyFont = createFont({
  family: 'System',
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20 },
  lineHeight: { 1: 16, 2: 20, 3: 22, 4: 24, 5: 28 },
  weight: { 1: '400', 2: '500', 3: '600', 4: '700' },
  letterSpacing: { 1: 0, 2: 0.25, 3: 0.5 },
});

// Define base tokens
const tokens = createTokens({
  color: {
    white: '#FFFFFF',
    black: '#000000',
  },
  size: {
    0: 0,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 40,
    true: 16,
  },
  space: {
    0: 0,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 40,
    true: 16,
  },
  radius: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 9999 },
  zIndex: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
});

// Sample MD3 themes - in a real implementation, you'd import all of them
const sampleLightTheme = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005E',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1E192B',
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  surfaceDisabled: '#1C1B1F1F',
  onSurfaceDisabled: '#1C1B1F61',
  backdrop: '#00000033',
  id: 0,
  name: 'Default',
  isDark: false,
  surface2: '#FFFBFE',
  overlay3: '#FFFBFE',
  rippleColor: '#6750A4',
  surfaceReader: '#FFFBFE',
  shadow: '#000000',
};

const sampleDarkTheme = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#141218',
  onBackground: '#E6E1E5',
  surface: '#141218',
  onSurface: '#E6E1E5',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  scrim: '#000000',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
  surfaceDisabled: '#E6E1E51F',
  onSurfaceDisabled: '#E6E1E561',
  backdrop: '#00000033',
  id: 0,
  name: 'Default',
  isDark: true,
  surface2: '#141218',
  overlay3: '#141218',
  rippleColor: '#D0BCFF',
  surfaceReader: '#141218',
  shadow: '#000000',
};

// Convert MD3 theme to Tamagui theme format
const convertMD3ToTamaguiTheme = (md3Theme: any) => ({
  // MD3 color values as direct theme properties
  primary: md3Theme.primary,
  onPrimary: md3Theme.onPrimary,
  primaryContainer: md3Theme.primaryContainer,
  onPrimaryContainer: md3Theme.onPrimaryContainer,
  secondary: md3Theme.secondary,
  onSecondary: md3Theme.onSecondary,
  secondaryContainer: md3Theme.secondaryContainer,
  onSecondaryContainer: md3Theme.onSecondaryContainer,
  tertiary: md3Theme.tertiary,
  onTertiary: md3Theme.onTertiary,
  tertiaryContainer: md3Theme.tertiaryContainer,
  onTertiaryContainer: md3Theme.onTertiaryContainer,
  error: md3Theme.error,
  onError: md3Theme.onError,
  errorContainer: md3Theme.errorContainer,
  onErrorContainer: md3Theme.onErrorContainer,
  background: md3Theme.background,
  onBackground: md3Theme.onBackground,
  surface: md3Theme.surface,
  onSurface: md3Theme.onSurface,
  surfaceVariant: md3Theme.surfaceVariant,
  onSurfaceVariant: md3Theme.onSurfaceVariant,
  outline: md3Theme.outline,
  outlineVariant: md3Theme.outlineVariant,
  scrim: md3Theme.scrim,
  inverseSurface: md3Theme.inverseSurface,
  inverseOnSurface: md3Theme.inverseOnSurface,
  inversePrimary: md3Theme.inversePrimary,
  surfaceDisabled: md3Theme.surfaceDisabled,
  onSurfaceDisabled: md3Theme.onSurfaceDisabled,
  backdrop: md3Theme.backdrop,

  // App-specific extras
  surface2: md3Theme.surface2 ?? md3Theme.surface,
  overlay3: md3Theme.overlay3 ?? md3Theme.surface,
  rippleColor: md3Theme.rippleColor ?? md3Theme.primary,
  surfaceReader: md3Theme.surfaceReader ?? md3Theme.surface,

  // Tamagui theme keys
  backgroundHover: md3Theme.surface,
  backgroundPress: md3Theme.surfaceVariant,
  colorHover: md3Theme.onSurface,
  colorPress: md3Theme.onSurfaceVariant,
  borderColor: md3Theme.outline,
  shadowColor: md3Theme.shadow,
});

export const config = createTamagui({
  ...defaultConfig,
  tokens,
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
  },
  themes: {
    ...defaultConfig.themes,
    // Add sample MD3 themes
    'light-0': convertMD3ToTamaguiTheme(sampleLightTheme),
    'dark-0': convertMD3ToTamaguiTheme(sampleDarkTheme),
  },
});

export type OurConfig = typeof config;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig {}
}

export default config;
