import { midnightDusk } from './mignightDusk';

// Create a Tamagui theme from MD3 midnightDusk colors
export const createMidnightDuskTheme = (isDark: boolean) => {
  const theme = isDark ? midnightDusk.dark : midnightDusk.light;

  // Helper function to create slightly different shades for focus/hover/press states
  const lightenColor = (color: string, amount: number = 0.1) => {
    // Simple color manipulation - in a real app you'd use a proper color library
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
      const newRgb = rgb.map(c =>
        Math.min(255, Math.floor(c + (255 - c) * amount)),
      );
      return `rgb(${newRgb[0]}, ${newRgb[1]}, ${newRgb[2]})`;
    }
    return color;
  };

  const darkenColor = (color: string, amount: number = 0.1) => {
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
      const newRgb = rgb.map(c => Math.max(0, Math.floor(c * (1 - amount))));
      return `rgb(${newRgb[0]}, ${newRgb[1]}, ${newRgb[2]})`;
    }
    return color;
  };

  return {
    // Background colors
    background: theme.background,
    backgroundFocus: lightenColor(theme.background, 0.05),
    backgroundHover: lightenColor(theme.background, 0.03),
    backgroundPress: darkenColor(theme.background, 0.05),

    // Border colors
    borderColor: theme.outline,
    borderColorFocus: theme.primary,
    borderColorHover: lightenColor(theme.outline, 0.1),
    borderColorPress: darkenColor(theme.outline, 0.1),

    // Text colors
    color: theme.onBackground,
    colorFocus: theme.primary,
    colorHover: lightenColor(theme.onBackground, 0.1),
    colorPress: darkenColor(theme.onBackground, 0.1),

    // Transparent color for overlays
    colorTransparent: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',

    // Placeholder color
    placeholderColor: theme.onSurfaceVariant,

    // Shadow colors
    shadowColor: theme.shadow,
    shadowColorFocus: theme.shadow,
    shadowColorHover: theme.shadow,
    shadowColorPress: theme.shadow,

    // Additional Tamagui theme properties
    accentBackground: theme.primaryContainer,
    accentColor: theme.onPrimaryContainer,
    color1: theme.surface,
    color2: theme.surfaceVariant,
    color3: lightenColor(theme.surface, 0.05),
    color4: lightenColor(theme.surface, 0.1),
    color5: theme.error,
    color6: lightenColor(theme.error, 0.1),
    color7: lightenColor(theme.primary, 0.2),
    color8: lightenColor(theme.primary, 0.4),
    color9: theme.primary,
    color10: theme.onPrimary,
    color11: lightenColor(theme.primary, 0.1),
    color12: theme.primary,
  };
};

// Export the actual themes
export const midnightDuskLightTheme = createMidnightDuskTheme(false);
export const midnightDuskDarkTheme = createMidnightDuskTheme(true);

// Type for the theme
export type MidnightDuskTheme = typeof midnightDuskLightTheme;
