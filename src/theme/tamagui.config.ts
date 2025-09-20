import {} from '@tamagui/config';
import { ThemeColors } from './types';
import { defaultConfig } from '@tamagui/config/v4';

import { lightThemes, darkThemes } from './md3';

// Kept for compatibility with existing imports
function createTamaguiTheme(md3Light: ThemeColors, md3Dark: ThemeColors) {
  const light = {
    ...defaultConfig.themes.light,
    // base/background and text
    background: md3Light.background,
    backgroundHover: md3Light.surface,
    backgroundPress: md3Light.surfaceVariant,
    color: md3Light.onBackground,
    colorHover: md3Light.onSurface,
    colorPress: md3Light.onSurfaceVariant,
    borderColor: md3Light.outline,
    // md3 palette
    primary: md3Light.primary,
    onPrimary: md3Light.onPrimary,
    primaryContainer: md3Light.primaryContainer,
    onPrimaryContainer: md3Light.onPrimaryContainer,
    secondary: md3Light.secondary,
    onSecondary: md3Light.onSecondary,
    secondaryContainer: md3Light.secondaryContainer,
    onSecondaryContainer: md3Light.onSecondaryContainer,
    tertiary: md3Light.tertiary,
    onTertiary: md3Light.onTertiary,
    tertiaryContainer: md3Light.tertiaryContainer,
    onTertiaryContainer: md3Light.onTertiaryContainer,
    error: md3Light.error,
    onError: md3Light.onError,
    errorContainer: md3Light.errorContainer,
    onErrorContainer: md3Light.onErrorContainer,
    surface: md3Light.surface,
    onSurface: md3Light.onSurface,
    surfaceVariant: md3Light.surfaceVariant,
    onSurfaceVariant: md3Light.onSurfaceVariant,
    outline: md3Light.outline,
    outlineVariant: md3Light.outlineVariant,
    shadow: md3Light.shadow,
    scrim: md3Light.scrim,
    inverseSurface: md3Light.inverseSurface,
    inverseOnSurface: md3Light.inverseOnSurface,
    inversePrimary: md3Light.inversePrimary,
    surfaceDisabled: md3Light.surfaceDisabled,
    onSurfaceDisabled: md3Light.onSurfaceDisabled,
    backdrop: md3Light.backdrop,
    // extras used across the app
    surface2: md3Light.surface2,
    overlay3: md3Light.overlay3,
    rippleColor: md3Light.rippleColor,
    surfaceReader: md3Light.surfaceReader,
  };
  const dark = {
    // base/background and text
    background: md3Dark.background,
    backgroundHover: md3Dark.surface,
    backgroundPress: md3Dark.surfaceVariant,
    color: md3Dark.onBackground,
    colorHover: md3Dark.onSurface,
    colorPress: md3Dark.onSurfaceVariant,
    borderColor: md3Dark.outline,
    // md3 palette
    primary: md3Dark.primary,
    onPrimary: md3Dark.onPrimary,
    primaryContainer: md3Dark.primaryContainer,
    onPrimaryContainer: md3Dark.onPrimaryContainer,
    secondary: md3Dark.secondary,
    onSecondary: md3Dark.onSecondary,
    secondaryContainer: md3Dark.secondaryContainer,
    onSecondaryContainer: md3Dark.onSecondaryContainer,
    tertiary: md3Dark.tertiary,
    onTertiary: md3Dark.onTertiary,
    tertiaryContainer: md3Dark.tertiaryContainer,
    onTertiaryContainer: md3Dark.onTertiaryContainer,
    error: md3Dark.error,
    onError: md3Dark.onError,
    errorContainer: md3Dark.errorContainer,
    onErrorContainer: md3Dark.onErrorContainer,
    surface: md3Dark.surface,
    onSurface: md3Dark.onSurface,
    surfaceVariant: md3Dark.surfaceVariant,
    onSurfaceVariant: md3Dark.onSurfaceVariant,
    outline: md3Dark.outline,
    outlineVariant: md3Dark.outlineVariant,
    shadow: md3Dark.shadow,
    scrim: md3Dark.scrim,
    inverseSurface: md3Dark.inverseSurface,
    inverseOnSurface: md3Dark.inverseOnSurface,
    inversePrimary: md3Dark.inversePrimary,
    surfaceDisabled: md3Dark.surfaceDisabled,
    onSurfaceDisabled: md3Dark.onSurfaceDisabled,
    backdrop: md3Dark.backdrop,
    // extras used across the app
    surface2: md3Dark.surface2,
    overlay3: md3Dark.overlay3,
    rippleColor: md3Dark.rippleColor,
    surfaceReader: md3Dark.surfaceReader,
  };
  return {
    light,
    dark,
  };
}
