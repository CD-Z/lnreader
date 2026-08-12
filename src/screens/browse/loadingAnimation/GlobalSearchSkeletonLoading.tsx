import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { ThemeColors } from '@theme/types';
import { getLoadingColors } from '@utils/useLoadingColors';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import LoadingNovel from './LoadingNovel';
import { DisplayModes } from '@screens/library/constants/constants';

interface Props {
  theme: ThemeColors;
}

const SKELETON_ITEMS = [0, 1, 2, 3];

const GlobalSearchSkeletonLoading: React.FC<Props> = ({ theme }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const { width } = useWindowDimensions();

  return (
    <SkeletonSection
      baseColor={skeletonColor}
      highlightColor={highlightColor}
      style={[styles.container, styles.row]}
    >
      {SKELETON_ITEMS.map(index => (
        <LoadingNovel
          key={index}
          availableWidth={width}
          color={skeletonColor}
          pictureHeight={153.1}
          pictureWidth={100}
          displayMode={DisplayModes.Comfortable}
        />
      ))}
    </SkeletonSection>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
    marginHorizontal: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 3,
  },
});

export default memo(GlobalSearchSkeletonLoading);
