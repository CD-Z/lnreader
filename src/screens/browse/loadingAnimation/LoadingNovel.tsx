import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { DisplayModes } from '@screens/library/constants/constants';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';

interface Props {
  availableWidth: number;
  color: string;
  pictureHeight: number;
  pictureWidth: number;
  displayMode: DisplayModes;
}

const LoadingNovel = ({
  availableWidth,
  color,
  pictureHeight,
  pictureWidth,
  displayMode,
}: Props) => {
  const showTitle =
    displayMode !== DisplayModes.CoverOnly &&
    displayMode !== DisplayModes.Compact;

  if (displayMode !== DisplayModes.List) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            height: pictureHeight + (showTitle ? 54.6 : 9.6),
            width: pictureWidth + 9.6,
          },
        ]}
      >
        <SkeletonBlock
          width={pictureWidth}
          height={pictureHeight}
          borderRadius={4}
          color={color}
          style={styles.picture}
        />
        {showTitle ? (
          <>
            <SkeletonBlock
              width={pictureWidth}
              height={16}
              borderRadius={8}
              color={color}
              style={styles.text}
            />
            <SkeletonBlock
              width={pictureWidth * 0.68}
              height={16}
              borderRadius={8}
              color={color}
              style={styles.text}
            />
          </>
        ) : null}
      </View>
    );
  }

  const chapterNumberWidth = 40;
  const textWidth = Math.max(80, availableWidth - chapterNumberWidth - 88);

  return (
    <View style={styles.listLoadingContainer}>
      <SkeletonBlock
        width={40}
        height={40}
        borderRadius={4}
        color={color}
        style={styles.picture}
      />
      <SkeletonBlock
        width={textWidth}
        height={18}
        borderRadius={4}
        color={color}
        style={styles.listText}
      />
      <SkeletonBlock
        width={chapterNumberWidth}
        height={20}
        borderRadius={4}
        color={color}
        style={styles.picture}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listLoadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  listText: {
    borderRadius: 4,
    marginLeft: 16,
    marginRight: 8,
  },
  loadingContainer: {
    marginBottom: 4,
    overflow: 'hidden',
    padding: 4.8,
  },
  picture: {
    borderRadius: 4,
  },
  text: {
    borderRadius: 8,
    marginTop: 5,
  },
});

export default memo(LoadingNovel);
