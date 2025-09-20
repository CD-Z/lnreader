import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { useTheme } from './ThemeContext';
import config from '../../../tamagui.config';

/**
 * DSProvider provides Tamagui themes generated from midnightDusk MD3 colors.
 * It automatically switches between light and dark themes based on system preference.
 */
export function DSProvider({ children }: { children: React.JSX.Element }) {
  const colors = useTheme();

  // Use the generated themes from midnightDusk colors
  const themeName = colors.isDark ? 'dark' : 'light';

  return (
    <TamaguiProvider config={config} defaultTheme={themeName}>
      {children}
    </TamaguiProvider>
  );
}

export default DSProvider;
