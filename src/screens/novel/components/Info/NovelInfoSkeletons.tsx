import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Row } from '@components/Common';
import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { getLoadingColors } from '@utils/useLoadingColors';

export const ChapterCountSkeleton = memo(
  ({ theme }: { theme: ThemeColors }) => {
    const [highlightColor, skeletonColor] = getLoadingColors(theme);

    return (
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
      >
        <SkeletonBlock
          width={120}
          height={14}
          borderRadius={4}
          color={skeletonColor}
          style={styles.chapterCountSkeleton}
        />
      </SkeletonSection>
    );
  },
);

const INFO_WIDTHS = [130, 180];

export const NovelDetailsSkeleton = memo(
  ({ theme }: { theme: ThemeColors }) => {
    const [highlightColor, skeletonColor] = getLoadingColors(theme);

    return (
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
      >
        {INFO_WIDTHS.map((width, index) => (
          <Row key={index} style={styles.infoRow}>
            <SkeletonBlock
              width={width}
              height={14}
              borderRadius={4}
              color={skeletonColor}
              style={styles.infoSkeletonBar}
            />
          </Row>
        ))}
      </SkeletonSection>
    );
  },
);

export const ButtonGroupSkeleton = memo(({ theme }: { theme: ThemeColors }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);

  return (
    <SkeletonSection baseColor={skeletonColor} highlightColor={highlightColor}>
      <View style={styles.buttonGroupSkeletonContainer}>
        <SkeletonBlock
          width="100%"
          height={52}
          borderRadius={8}
          color={skeletonColor}
          style={styles.buttonSkeleton}
        />
        <SkeletonBlock
          width="100%"
          height={52}
          borderRadius={8}
          color={skeletonColor}
          style={styles.buttonSkeleton}
        />
      </View>
    </SkeletonSection>
  );
});

const styles = StyleSheet.create({
  buttonGroupSkeletonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    paddingTop: 8,
  },
  buttonSkeleton: {
    flex: 1,
  },
  chapterCountSkeleton: {
    marginHorizontal: 16,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoSkeletonBar: {
    marginHorizontal: 16,
  },
});
