import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { useTheme } from './ThemeContext';
import config from '../../../tamagui.config';

/**
 * DSProvider bridges ThemeContext (MD3 colors) to Tamagui themes.
 * It picks light/dark theme based on `isDark` and exposes it via Tamagui.
 */
export function DSProvider({ children }: { children: React.JSX.Element }) {
  const colors = useTheme();
  const currentThemeName = colors.isDark ? 'dark' : 'light';

  return (
    <TamaguiProvider config={config} defaultTheme={currentThemeName}>
      {children}
    </TamaguiProvider>
  );
}

export default DSProvider;
