import { createTamagui } from 'tamagui';
import { shorthands } from '@tamagui/shorthands';
import { createTokens } from '@tamagui/core';

const sizeScale = {
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
  11: 48,
  12: 56,
  13: 64,
  14: 80,
  15: 96,
};

export const tokens = createTokens({
  color: {
    white: '#FFFFFF',
    black: '#000000',
  },
  space: sizeScale,
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 9999,
  },
  size: sizeScale,
  zIndex: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
});

export const tamaguiConfig = createTamagui({
  tokens,
  shorthands,
  fonts: {
    body: {
      family: 'System',
      size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
      },
      lineHeight: {
        1: 16,
        2: 20,
        3: 22,
        4: 24,
        5: 28,
      },
      weight: {
        1: '400',
        2: '500',
        3: '600',
        4: '700',
      },
      letterSpacing: {
        1: 0,
        2: 0.25,
        3: 0.5,
      },
    },
  },
  themes: {
    light: {
      color: '#1b1b1f',
      background: '#fefbff',
      surface: '#fefbff',
      primary: '#0057ce',
      secondary: '#585e71',
      outline: '#757780',
      error: '#ba1a1a',
    },
    dark: {
      color: '#e4e2e6',
      background: '#1b1b1f',
      surface: '#1b1b1f',
      primary: '#b1c5ff',
      secondary: '#c0c6dc',
      outline: '#8f9099',
      error: '#ffb4ab',
    },
  },
});

export type Conf = typeof tamaguiConfig;
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig;
