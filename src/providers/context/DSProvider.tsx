import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { useTheme } from './ThemeContext';
import config from '../../../tamagui.config';

/**
 * DSProvider bridges ThemeContext (MD3 colors) to Tamagui themes.
 * It selects the appropriate predefined theme based on the current MD3 theme.
 */
export function DSProvider({ children }: { children: React.JSX.Element }) {
  const colors = useTheme();

  // For now, use the default theme (index 0)
  const themeName = colors.isDark ? 'dark-0' : 'light-0';

  return (
    <TamaguiProvider config={config} defaultTheme={themeName}>
      {children}
    </TamaguiProvider>
  );
}

export default DSProvider;
