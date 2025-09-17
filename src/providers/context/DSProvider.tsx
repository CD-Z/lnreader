import React, { useMemo } from 'react';
import { TamaguiProvider, Theme as TTheme } from 'tamagui';
import { useTheme } from './ThemeContext';
import tamaguiConfig from '@theme/tamagui.config';

/**
 * DSProvider bridges ThemeContext (MD3 colors) to Tamagui themes.
 * It picks light/dark theme based on `isDark` and exposes it via Tamagui.
 */
export function DSProvider({ children }: { children: React.JSX.Element }) {
  const colors = useTheme();

  const currentThemeName = colors.isDark ? 'dark' : 'light';

  // Provide Tamagui provider + Theme selection.
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={currentThemeName}>
      {children}
    </TamaguiProvider>
  );
}

export default DSProvider;
