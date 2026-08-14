import { useEffect, type PropsWithChildren } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaskedView } from '@expo/ui/community/masked-view';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppSettings } from '@hooks/persisted';

const SWEEP_DURATION = 1800;
const transparent = 'rgba(0, 0, 0, 0)';
const semiTransparent = 'rgba(0, 0, 0, 0.4)';
const gradientBackground =
  'linear-gradient(90deg, transparent 0%, black 50%, transparent 100%)';

type SkeletonSectionProps = PropsWithChildren<{
  baseColor: string;
  highlightColor: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}>;

/**
 * Renders the skeleton shapes (children) as an alpha mask over a base-color
 * layer with ONE animated gradient sweeping across all shapes. The mask
 * holds the exact layout of the final content, so the skeleton occupies the
 * same space as the loaded screen, and the sweep is clipped to the shapes.
 */
export function SkeletonSection({
  children,
  baseColor,
  highlightColor,
  style = { flex: 1 },
  loading = true,
}: SkeletonSectionProps) {
  const { width, height } = useWindowDimensions();
  const { disableLoadingAnimations } = useAppSettings();
  const translateX = useSharedValue(-width);
  const translateY = useSharedValue(-height);

  useEffect(() => {
    if (disableLoadingAnimations) {
      return;
    }
    const anim = (num: number) =>
      withRepeat(
        withTiming(num, {
          duration: SWEEP_DURATION,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      );
    translateX.value = anim(width);
    translateY.value = anim(height);
    return () => {
      // reset to the resting position for the next cycle
      translateX.value = -width;
      translateY.value = -height;
    };
  }, [disableLoadingAnimations, height, translateX, translateY, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={style}>
      <MaskedView
        style={{ height, width }}
        maskElement={
          <>
            {!loading ? (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}
              />
            ) : (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: '-100%',
                    left: '-100%',
                    width: '300%',
                    height: '300%',
                  },
                  animatedStyle,
                  {
                    backgroundColor: semiTransparent,
                  },
                ]}
              >
                <View
                  style={{
                    width: width,
                    height: 2 * height,
                    transform: [
                      { rotate: '45deg' },
                      { translateX: width / 2 },
                      { translateY: height / 2 },
                    ],
                    transformOrigin: 'bottom left',
                    experimental_backgroundImage: gradientBackground,
                  }}
                />
              </Animated.View>
            )}
          </>
        }
      >
        {children}
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  maskFill: {
    flex: 1,
  },
  measure: {
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
