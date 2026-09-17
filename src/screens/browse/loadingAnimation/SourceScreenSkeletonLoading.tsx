import React, { memo, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemeColors } from '@theme/types';
import { getLoadingColors } from '@utils/useLoadingColors';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import LoadingNovel from './LoadingNovel';
import { useLibrarySettings } from '@hooks/persisted';
import { DisplayModes } from '@screens/library/constants/constants';
import { useDeviceOrientation } from '@hooks';

interface Props {
  theme: ThemeColors;
  completeRow?: number;
}

const SourceScreenSkeletonLoading: React.FC<Props> = ({
  theme,
  completeRow,
}) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);

  const { displayMode = DisplayModes.Comfortable, novelsPerRow = 3 } =
    useLibrarySettings();

  const window = useWindowDimensions();
  const orientation = useDeviceOrientation();

  const numColumns = useMemo(
    () =>
      displayMode === DisplayModes.List
        ? 1
        : orientation === 'landscape'
        ? 6
        : novelsPerRow,
    [displayMode, orientation, novelsPerRow],
  );

  const [pictureHeight, pictureWidth] = useMemo(() => {
    const width = (window.width - 12 - 9.6 * numColumns) / numColumns;
    return [width * (4 / 3), width];
  }, [numColumns, window.width]);

  const renderLoadingNovel = (item: number) => (
    <View
      key={'sourceLoading' + item}
      style={[styles.item, { flex: 1 / numColumns }]}
    >
      <LoadingNovel
        availableWidth={window.width}
        color={highlightColor}
        pictureHeight={pictureHeight}
        pictureWidth={pictureWidth}
        displayMode={displayMode}
      />
    </View>
  );

  if (completeRow === 1) {
    const skeleton = <>{renderLoadingNovel(completeRow)}</>;
    return (
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
        loading
        maskElement={skeleton}
      >
        {skeleton}
      </SkeletonSection>
    );
  }

  if (displayMode === DisplayModes.List) {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const skeleton = (
      <>
        {items.map(item => (
          <View key={'sourceSkeletonRow' + item} style={styles.row}>
            {renderLoadingNovel(item)}
          </View>
        ))}
      </>
    );
    return (
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
        loading
        maskElement={skeleton}
        style={styles.container}
      >
        {skeleton}
      </SkeletonSection>
    );
  }

  const rowCount = Math.max(
    1,
    Math.floor((window.height - 100) / pictureHeight),
  );

  const skeleton = (
    <>
      {Array.from({ length: rowCount }, (_, item) => {
        const offset = Math.pow(10, item);
        const items: number[] = [1 * offset];
        for (let i = 2; i <= numColumns; i++) {
          items.push(i * offset);
        }
        return (
          <View key={'sourceSkeletonRow' + item} style={styles.row}>
            {items.map(renderLoadingNovel)}
          </View>
        );
      })}
    </>
  );

  return (
    <SkeletonSection
      baseColor={skeletonColor}
      highlightColor={highlightColor}
      loading
      maskElement={skeleton}
      style={styles.container}
    >
      {skeleton}
    </SkeletonSection>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    marginBottom: 8,
    marginHorizontal: 2,
    marginTop: 2,
    overflow: 'visible',
  },
  item: {
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 1,
  },
});

export default memo(SourceScreenSkeletonLoading);
