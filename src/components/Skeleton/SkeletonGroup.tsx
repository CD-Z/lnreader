import { createContext, useContext, type PropsWithChildren } from 'react';
import { ShimmerProvider } from 'react-native-fast-shimmer';

import { useTheme, useAppSettings } from '@hooks/persisted';
import { getLoadingColors } from '@utils/useLoadingColors';

const SHIMMER_DURATION = 1800;

const SkeletonEnabledContext = createContext(true);

export const useSkeletonEnabled = () => useContext(SkeletonEnabledContext);

/**
 * Wraps a skeleton section with the shared shimmer animation state.
 * All SkeletonBlock children under this provider sweep the same gradient
 * in sync, driven by a single animation value. The animation only runs
 * while at least one Shimmer is mounted, and is replaced by static blocks
 * when the app's "disable loading animations" setting is on.
 */
export function SkeletonGroup({
  children,
  highlightColor,
}: PropsWithChildren<{ highlightColor?: string }>) {
  const theme = useTheme();
  const { disableLoadingAnimations } = useAppSettings();
  const highlight = highlightColor ?? getLoadingColors(theme)[0];

  return (
    <SkeletonEnabledContext.Provider value={!disableLoadingAnimations}>
      <ShimmerProvider
        duration={SHIMMER_DURATION}
        gradientConfig={{
          colors: ['transparent', highlight, 'transparent'],
        }}
      >
        {children}
      </ShimmerProvider>
    </SkeletonEnabledContext.Provider>
  );
}
