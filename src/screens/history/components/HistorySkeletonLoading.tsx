import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonGroup } from '@components/Skeleton/SkeletonGroup';
import { getLoadingColors } from '@utils/useLoadingColors';

const SKELETON_ITEMS = [
  { dateWidth: 72 },
  { dateWidth: null },
  { dateWidth: null },
  { dateWidth: 88 },
  { dateWidth: null },
] as const;

interface Props {
  theme: ThemeColors;
}

const HistorySkeletonLoading: React.FC<Props> = ({ theme }) => {
  const [, skeletonColor] = getLoadingColors(theme);
  const { width } = useWindowDimensions();
  const textWidth = useMemo(() => Math.max(80, width - 144), [width]);

  return (
    <SkeletonGroup>
      {SKELETON_ITEMS.map(({ dateWidth }, index) => (
        <View key={`historyLoading${index}`}>
          {dateWidth ? (
            <SkeletonBlock
              width={dateWidth}
              height={19.3}
              borderRadius={6}
              color={skeletonColor}
              style={styles.date}
            />
          ) : null}
          <View style={styles.chapterCtn}>
            <SkeletonBlock
              width={56}
              height={80}
              borderRadius={4}
              color={skeletonColor}
              style={styles.picture}
            />
            <View style={styles.textCtn}>
              <SkeletonBlock
                width={textWidth}
                height={16}
                borderRadius={6}
                color={skeletonColor}
                style={styles.text}
              />
              <SkeletonBlock
                width={textWidth}
                height={12}
                borderRadius={6}
                color={skeletonColor}
                style={styles.text}
              />
            </View>
            <View style={styles.buttonCtn}>
              <SkeletonBlock
                width={24}
                height={24}
                borderRadius={12.5}
                color={skeletonColor}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12.5,
  },
  buttonCtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  chapterCtn: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  date: {
    borderRadius: 6,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  picture: {
    borderRadius: 4,
    height: 80,
    marginHorizontal: 16,
    width: 56,
  },
  text: {
    borderRadius: 6,
    marginBottom: 4,
  },
  textCtn: {
    borderRadius: 6,
    flex: 1,
    marginBottom: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
});

export default memo(HistorySkeletonLoading);
