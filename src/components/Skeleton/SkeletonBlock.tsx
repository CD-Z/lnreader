import { memo } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Shimmer } from 'react-native-fast-shimmer';

import { useSkeletonEnabled } from './SkeletonGroup';

type SkeletonBlockProps = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A shimmering placeholder block. Renders the base skeleton color and a
 * gradient sweep that is driven by the nearest SkeletonGroup provider, so
 * every block on screen shares one animation. Renders as a static block
 * when loading animations are disabled.
 */
export const SkeletonBlock = memo(
  ({
    width,
    height,
    borderRadius = 8,
    color = '#E2E5E9',
    style,
  }: SkeletonBlockProps) => {
    const enabled = useSkeletonEnabled();

    return (
      <View
        accessible={false}
        style={[
          styles.block,
          {
            width,
            height,
            borderRadius,
            backgroundColor: color,
          },
          style,
        ]}
      >
        {enabled ? <Shimmer /> : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
