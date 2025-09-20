import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';
import { createFont, createTokens } from 'tamagui';
import {
  midnightDuskDarkTheme,
  midnightDuskLightTheme,
} from '@theme/md3/midnightDuskTheme';

const bodyFont = createFont({
  family: 'System',
  size: {
    $sm: 12,
    $md: 14,
    $lg: 16,
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
  },
  lineHeight: { 1: 16, 2: 20, 3: 22, 4: 24, 5: 28 },
  weight: { 1: '400', 2: '500', 3: '600', 4: '700' },
  letterSpacing: { 1: 0, 2: 0.25, 3: 0.5 },
});

const tokens = createTokens({
  size: {
    $sm: 38,
    $md: 46,
    $lg: 60,
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
    $sm: 15,
    $md: 20,
    $lg: 25,
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
  radius: {
    $sm: 4,
    $md: 8,
    $lg: 12,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 9999,
  },
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
    light: { ...defaultConfig.themes.light, ...midnightDuskLightTheme },
    dark: { ...defaultConfig.themes.dark, ...midnightDuskDarkTheme },
  },
});

export type OurConfig = typeof config;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig {}
}

export default config;
