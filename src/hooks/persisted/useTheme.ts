import { useMemo } from 'react';
import { Appearance } from 'react-native';
import {
  useMMKVBoolean,
  useMMKVObject,
  useMMKVString,
} from 'react-native-mmkv';
import { overlay } from 'react-native-paper';
import Color from 'color';

import { defaultTheme } from '@theme/md3/defaultTheme';
import { ThemeColors } from '@theme/types';

export const useTheme = (): ThemeColors => {
  const [appTheme] = useMMKVObject<ThemeColors>('APP_THEME');
  const [isAmoledBlack] = useMMKVBoolean('AMOLED_BLACK');
  const [customAccent] = useMMKVString('CUSTOM_ACCENT_COLOR');

  const theme: ThemeColors = useMemo(() => {
    const isDeviveColorSchemeDark = Appearance.getColorScheme() === 'dark';

    let colors: ThemeColors =
      appTheme ||
      (isDeviveColorSchemeDark ? defaultTheme.dark : defaultTheme.light);

    if (isAmoledBlack && colors.isDark) {
      colors = {
        ...colors,
        background: '#000000',
      };
    }

    if (customAccent) {
      colors = {
        ...colors,
        primary: customAccent,
        secondary: customAccent,
      };
    }

    colors = {
      ...colors,
      overlay3: overlay(3, colors.background),
      rippleColor: Color(colors.primary).alpha(0.12).toString(),
      surfaceReader: Color(colors.background).alpha(0.9).toString(),
    };

    return colors;
  }, [appTheme?.id, isAmoledBlack, customAccent]);

  return theme;
};
