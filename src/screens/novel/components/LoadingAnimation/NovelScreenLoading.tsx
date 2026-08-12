import React, { memo, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { getLoadingColors } from '@utils/useLoadingColors';

interface SkeletonProps {
  color: string;
  fullWidth: number;
}

const DESCRIPTION_LINES = [0, 1];
const CHIP_WIDTHS = [64, 88, 52, 72];
const STAT_ITEMS = [0, 1, 2];
const CHAPTER_ITEMS = [0, 1, 2, 3, 4, 5, 6];

const NovelTop = memo(({ color, fullWidth }: SkeletonProps) => {
  const textWidth = Math.max(80, fullWidth - 116);
  return (
    <View style={styles.headerContainer}>
      <SkeletonBlock
        width={100}
        height={150}
        borderRadius={8}
        color={color}
        style={styles.picture}
      />
      <View style={styles.headerText}>
        <SkeletonBlock
          width={textWidth}
          height={25}
          borderRadius={8}
          color={color}
          style={styles.text}
        />
        <SkeletonBlock
          width={textWidth}
          height={20}
          borderRadius={8}
          color={color}
          style={styles.text}
        />
        <SkeletonBlock
          width={textWidth}
          height={20}
          borderRadius={8}
          color={color}
          style={styles.text}
        />
      </View>
    </View>
  );
});

const LoadingDescription = memo(({ color, fullWidth }: SkeletonProps) => (
  <View style={styles.novelInformationText}>
    {DESCRIPTION_LINES.map((_, index) => (
      <SkeletonBlock
        key={`description-skeleton-${index}`}
        width={fullWidth}
        height={16}
        borderRadius={8}
        color={color}
        style={styles.text}
      />
    ))}
  </View>
));

const LoadingChips = memo(({ color }: Omit<SkeletonProps, 'fullWidth'>) => (
  <View style={styles.novelInformationChips}>
    {CHIP_WIDTHS.map((width, index) => (
      <SkeletonBlock
        key={`chip-skeleton-${index}`}
        width={width}
        height={32}
        borderRadius={8}
        color={color}
        style={styles.chip}
      />
    ))}
  </View>
));

const NovelInformation = memo(({ color, fullWidth }: SkeletonProps) => (
  <View style={styles.metadataContainer}>
    <View style={styles.statsContainer}>
      {STAT_ITEMS.map((_, index) => (
        <SkeletonBlock
          key={`stat-skeleton-${index}`}
          width={90}
          height={56}
          borderRadius={30}
          color={color}
          style={styles.icon}
        />
      ))}
    </View>
    <LoadingDescription color={color} fullWidth={fullWidth} />
    <LoadingChips color={color} />
  </View>
));

const LoadingChapterItem = memo(({ color, fullWidth }: SkeletonProps) => {
  const textWidth = Math.max(80, fullWidth - 50);
  return (
    <View style={styles.chapter}>
      <View>
        <SkeletonBlock
          width={textWidth}
          height={20}
          borderRadius={8}
          color={color}
          style={styles.text}
        />
        <SkeletonBlock
          width={textWidth}
          height={16}
          borderRadius={8}
          color={color}
          style={styles.text}
        />
      </View>
      <SkeletonBlock
        width={30}
        height={30}
        borderRadius={20}
        color={color}
        style={styles.loadingChapterItem}
      />
    </View>
  );
});

const Chapters = memo(({ color, fullWidth }: SkeletonProps) => (
  <View>
    <SkeletonBlock
      width={fullWidth}
      height={30}
      borderRadius={8}
      color={color}
      style={[styles.text, styles.chapters]}
    />
    {CHAPTER_ITEMS.map((_, index) => (
      <LoadingChapterItem
        key={`chapter-skeleton-${index}`}
        color={color}
        fullWidth={fullWidth}
      />
    ))}
  </View>
));

const NovelScreenLoading: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const { width } = useWindowDimensions();
  const fullWidth = useMemo(() => Math.max(160, width - 32), [width]);

  const sharedProps = useMemo(
    () => ({ color: skeletonColor, fullWidth }),
    [skeletonColor, fullWidth],
  );

  return (
    <SkeletonSection
      baseColor={skeletonColor}
      highlightColor={highlightColor}
      style={styles.container}
    >
      <NovelTop {...sharedProps} />
      <NovelInformation {...sharedProps} />
      <Chapters {...sharedProps} />
    </SkeletonSection>
  );
};

const styles = StyleSheet.create({
  chapter: {
    flexDirection: 'row',
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  chapters: {
    marginBottom: 5,
    marginHorizontal: 16,
  },
  chip: {
    marginLeft: 8,
  },
  container: {
    flexGrow: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 268,
    justifyContent: 'space-evenly',
    paddingTop: 118,
    width: '100%',
  },
  headerText: {
    height: 100,
    justifyContent: 'center',
    paddingTop: 30,
  },
  icon: {
    borderRadius: 30,
  },
  loadingChapterItem: {
    alignSelf: 'center',
    marginLeft: 20,
  },
  metadataContainer: {
    marginVertical: 4,
  },
  novelInformationChips: {
    flexDirection: 'row',
    paddingBottom: 6,
    paddingLeft: 8,
  },
  novelInformationText: {
    height: 62,
    margin: 16,
    marginTop: 8,
  },
  picture: {
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  text: {
    borderRadius: 8,
    marginTop: 5,
  },
});

export default memo(NovelScreenLoading);
