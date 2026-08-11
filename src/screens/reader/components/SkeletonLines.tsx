import { memo, useMemo } from 'react';
import {
  DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonGroup } from '@components/Skeleton/SkeletonGroup';

interface Props {
  color?: string;
  containerHeight: DimensionValue;
  containerMargin?: DimensionValue;
  containerWidth: DimensionValue;
  highlightColor?: string;
  lineHeight: number;
  /**
   * How many lines actually shimmer. Every shimmering line costs an SVG
   * gradient view, and this placeholder is shown while the app is busy
   * loading, so the lines below the fold are rendered as plain bars.
   */
  maxAnimatedLines?: number;
  textSize: number;
  width?: DimensionValue;
}

const resolveDimension = (value: DimensionValue, available: number): number => {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return available;
  }
  return String(value).endsWith('%') ? available * (parsed / 100) : parsed;
};

const SkeletonLines = ({
  width,
  lineHeight,
  textSize,
  containerWidth,
  containerHeight,
  containerMargin = 0,
  color = '#ebebeb',
  highlightColor = '#c5c5c5',
  maxAnimatedLines = 12,
}: Props) => {
  const window = useWindowDimensions();

  const resolvedWidth = width
    ? resolveDimension(width, window.width)
    : window.width * 0.9;
  const resolvedHeight = resolveDimension(containerHeight, window.height);
  const rowHeight = Math.max(textSize, textSize * lineHeight);
  const lineCount = Math.max(1, Math.floor((resolvedHeight - 10) / rowHeight));
  const lines = useMemo(() => Array.from({ length: lineCount }), [lineCount]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: 'transparent',
          height: containerHeight,
          margin: containerMargin,
          position: 'relative',
          width: containerWidth,
        },
      }),
    [containerHeight, containerMargin, containerWidth],
  );

  return (
    <View style={styles.container}>
      <SkeletonGroup highlightColor={highlightColor}>
        {lines.map((_, index) => {
          const lineWidth =
            index % 5 === 4 ? resolvedWidth * 0.68 : resolvedWidth;

          if (index >= maxAnimatedLines) {
            return (
              <View
                key={`reader-line-skeleton-${index}`}
                accessible={false}
                style={{
                  backgroundColor: color,
                  borderRadius: 8,
                  height: textSize,
                  marginBottom: Math.max(0, rowHeight - textSize),
                  width: lineWidth,
                }}
              />
            );
          }

          return (
            <SkeletonBlock
              key={`reader-line-skeleton-${index}`}
              width={lineWidth}
              height={textSize}
              borderRadius={8}
              color={color}
              style={{
                marginBottom: Math.max(0, rowHeight - textSize),
              }}
            />
          );
        })}
      </SkeletonGroup>
    </View>
  );
};

export default memo(SkeletonLines);
