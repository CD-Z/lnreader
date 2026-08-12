import { memo, useMemo } from 'react';
import {
  DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';

interface Props {
  color?: string;
  containerHeight: DimensionValue;
  containerMargin?: DimensionValue;
  containerWidth: DimensionValue;
  highlightColor?: string;
  lineHeight: number;
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
      <SkeletonSection
        baseColor={color}
        highlightColor={highlightColor}
        style={stylesSection}
      >
        {lines.map((_, index) => {
          const lineWidth =
            index % 5 === 4 ? resolvedWidth * 0.68 : resolvedWidth;

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
      </SkeletonSection>
    </View>
  );
};

const stylesSection = { flex: 1 };

export default memo(SkeletonLines);
