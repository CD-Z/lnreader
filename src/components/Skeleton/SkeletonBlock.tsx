import { memo } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type SkeletonBlockProps = {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A static skeleton shape. Used as the mask inside a SkeletonSection, so it
 * must stay lightweight and carry an opaque background (the mask reads the
 * shape's alpha).
 */
export const SkeletonBlock = memo(
  ({
    width,
    height,
    borderRadius = 8,
    color = '#E2E5E9',
    style,
  }: SkeletonBlockProps) => (
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
    />
  ),
);

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
