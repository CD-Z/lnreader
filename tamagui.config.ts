import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';
import { createFont, createTokens } from 'tamagui';

// Static MD3 color mapping (avoid dynamic imports for compiler)
const md3Light = {
  background: 'rgb(254, 251, 255)',
  surface: 'rgb(254, 251, 255)',
  surfaceVariant: 'rgb(225, 226, 236)',
  onBackground: 'rgb(27, 27, 31)',
  onSurface: 'rgb(27, 27, 31)',
  onSurfaceVariant: 'rgb(68, 70, 79)',
  outline: 'rgb(117, 119, 128)',
  primary: 'rgb(0, 87, 206)',
  error: 'rgb(186, 26, 26)',
};

const md3Dark = {
  background: 'rgb(27, 27, 31)',
  surface: 'rgb(27, 27, 31)',
  surfaceVariant: 'rgb(68, 70, 79)',
  onBackground: 'rgb(228, 226, 230)',
  onSurface: 'rgb(228, 226, 230)',
  onSurfaceVariant: 'rgb(197, 198, 208)',
  outline: 'rgb(143, 144, 153)',
  primary: 'rgb(177, 197, 255)',
  error: 'rgb(255, 180, 171)',
};

const bodyFont = createFont({
  family: 'System',
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20 },
  lineHeight: { 1: 16, 2: 20, 3: 22, 4: 24, 5: 28 },
  weight: { 1: '400', 2: '500', 3: '600', 4: '700' },
  letterSpacing: { 1: 0, 2: 0.25, 3: 0.5 },
});

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

export const config = createTamagui({
  ...defaultConfig,
  tokens,
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: md3Light.background,
      backgroundHover: md3Light.surface,
      backgroundPress: md3Light.surfaceVariant,
      color: md3Light.onBackground,
      colorHover: md3Light.onSurface,
      colorPress: md3Light.onSurfaceVariant,
      borderColor: md3Light.outline,
      primary: md3Light.primary,
      outline: md3Light.outline,
      surface: md3Light.surface,
      surface2: md3Light.surfaceVariant,
      error: md3Light.error,
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: md3Dark.background,
      backgroundHover: md3Dark.surface,
      backgroundPress: md3Dark.surfaceVariant,
      color: md3Dark.onBackground,
      colorHover: md3Dark.onSurface,
      colorPress: md3Dark.onSurfaceVariant,
      borderColor: md3Dark.outline,
      primary: md3Dark.primary,
      outline: md3Dark.outline,
      surface: md3Dark.surface,
      surface2: md3Dark.surfaceVariant,
      error: md3Dark.error,
    },
  },
});

export type OurConfig = typeof config;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig {}
}

export default config;
