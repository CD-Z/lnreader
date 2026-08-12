import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { getLoadingColors } from '@utils/useLoadingColors';

interface Props {
  theme: ThemeColors;
}

const SKELETON_ITEMS = [
  { height: 128, lastLineRatio: 0.72 },
  { height: 142, lastLineRatio: 0.54 },
  { height: 136, lastLineRatio: 0.8 },
  { height: 148, lastLineRatio: 0.62 },
  { height: 132, lastLineRatio: 0.7 },
] as const;

const TrackerLoading: React.FC<Props> = ({ theme }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const { width } = useWindowDimensions();
  const textWidth = useMemo(() => Math.max(80, width - 140), [width]);

  return (
    <SkeletonSection
      baseColor={skeletonColor}
      highlightColor={highlightColor}
      style={styles.container}
    >
      {SKELETON_ITEMS.map((item, index) => (
        <View
          key={`tracker-skeleton-${index}`}
          style={[styles.loadingContainer, { backgroundColor: theme.overlay3 }]}
        >
          <SkeletonBlock
            width={100}
            height={item.height}
            borderRadius={8}
            color={skeletonColor}
          />
          <View style={styles.loadingText}>
            <SkeletonBlock
              width={textWidth}
              height={16}
              borderRadius={8}
              color={skeletonColor}
              style={styles.text}
            />
            <SkeletonBlock
              width={textWidth}
              height={16}
              borderRadius={8}
              color={skeletonColor}
              style={styles.text}
            />
            <SkeletonBlock
              width={textWidth * item.lastLineRatio}
              height={16}
              borderRadius={8}
              color={skeletonColor}
              style={styles.text}
            />
          </View>
        </View>
      ))}
    </SkeletonSection>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexGrow: 1,
    marginBottom: 8,
    marginTop: -3,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingContainer: {
    borderRadius: 8,
    flexDirection: 'row',
    margin: 10,
    overflow: 'hidden',
  },
  loadingText: {
    flex: 1,
    margin: 10,
    overflow: 'hidden',
  },
  text: {
    marginVertical: 5,
  },
});

export default memo(TrackerLoading);
