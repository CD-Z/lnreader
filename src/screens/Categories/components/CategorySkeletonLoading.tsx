import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { getLoadingColors } from '@utils/useLoadingColors';

interface Props {
  width: number;
  height: number;
  theme: ThemeColors;
}

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5];

const CategorySkeletonLoading: React.FC<Props> = ({ height, width, theme }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const window = useWindowDimensions();
  const cardWidth = Math.min(width, window.width - 32);

  const skeleton = (
    <>
      {SKELETON_ITEMS.map(i => (
        <SkeletonBlock
          key={`category-skeleton-${i}`}
          width={cardWidth}
          height={height}
          borderRadius={12}
          color={skeletonColor}
          style={styles.categoryCard}
        />
      ))}
    </>
  );

  return (
    <SkeletonSection
      baseColor={skeletonColor}
      highlightColor={highlightColor}
      loading
      maskElement={skeleton}
      style={styles.contentCtn}
    >
      {skeleton}
    </SkeletonSection>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    marginHorizontal: 16,
  },
  contentCtn: {
    gap: 8,
    paddingBottom: 100,
    paddingVertical: 16,
  },
});

export default memo(CategorySkeletonLoading);
