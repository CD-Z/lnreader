import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaskedView } from '@expo/ui/community/masked-view';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SWEEP_DURATION = 1800;

type SkeletonSectionProps = PropsWithChildren<{
  baseColor: string;
  highlightColor: string;
  loading: boolean;
  maskElement: ReactElement;
  style?: StyleProp<ViewStyle>;
  disableAnimation?: boolean;
}>;

export function SkeletonSection({
  children,
  baseColor,
  highlightColor,
  loading,
  maskElement,
  style,
  disableAnimation = false,
}: SkeletonSectionProps) {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const progress = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;

    setLayout(current => {
      if (
        current?.width === next.width &&
        current?.height === next.height &&
        current?.x === next.x &&
        current?.y === next.y
      ) {
        return current;
      }

      return next;
    });
  };

  useEffect(() => {
    cancelAnimation(progress);

    if (!loading || disableAnimation) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, {
        duration: SWEEP_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(progress);
      progress.value = 0;
    };
  }, [disableAnimation, loading, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const width = layout?.width ?? 0;

    return {
      transform: [
        {
          translateX: -width + progress.value * width * 2,
        },
      ],
    };
  });

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {children}

      {loading && layout && layout.width > 0 && layout.height > 0 ? (
        <MaskedView
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              width: layout.width,
              height: layout.height,
            },
          ]}
          maskElement={maskElement}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: baseColor,
              },
            ]}
          />

          {!disableAnimation ? (
            <Animated.View
              style={[
                styles.highlightTrack,
                {
                  height: layout.height,
                  width: layout.width * 3,
                  backgroundColor: baseColor,
                  experimental_backgroundImage: [
                    'linear-gradient(90deg,',
                    `${baseColor} 25%,`,
                    `${highlightColor} 50%,`,
                    `${baseColor} 75%)`,
                  ].join(' '),
                },
                animatedStyle,
              ]}
            />
          ) : null}
        </MaskedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  highlightTrack: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  overlay: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
