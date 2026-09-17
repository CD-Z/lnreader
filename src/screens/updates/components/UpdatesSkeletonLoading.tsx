import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemeColors } from '@theme/types';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { getLoadingColors } from '@utils/useLoadingColors';
import { useAppSettings } from '@hooks/persisted';

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7];

interface Props {
  theme: ThemeColors;
}

const UpdatesSkeletonLoading: React.FC<Props> = ({ theme }) => {
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const { width } = useWindowDimensions();
  const textWidth = useMemo(() => Math.max(80, width - 120), [width]);
  const { disableLoadingAnimations } = useAppSettings();

  const skeleton = (
    <>
      {SKELETON_ITEMS.map(i => (
        <View key={`updates-skeleton-${i}`} style={styles.chapterCtn}>
          <SkeletonBlock
            width={42}
            height={42}
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
              style={styles.textTop}
            />
            <SkeletonBlock
              width={textWidth}
              height={12}
              borderRadius={6}
              color={skeletonColor}
              style={styles.textBottom}
            />
          </View>
          <View style={styles.buttonCtn}>
            <SkeletonBlock
              width={25}
              height={25}
              borderRadius={12.5}
              color={skeletonColor}
              style={styles.button}
            />
          </View>
        </View>
      ))}
    </>
  );

  return (
    <Animated.View
      entering={disableLoadingAnimations ? undefined : FadeIn.duration(500)}
      style={styles.contentCtn}
    >
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
        loading
        maskElement={skeleton}
      >
        {skeleton}
      </SkeletonSection>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12.5,
  },
  buttonCtn: {
    alignItems: 'center',
    height: 45.1,
    justifyContent: 'center',
    width: 45.1,
  },
  chapterCtn: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  contentCtn: {
    paddingVertical: 8,
  },
  picture: {
    borderRadius: 4,
    height: 42,
    marginHorizontal: 16,
    width: 42,
  },
  textBottom: {
    borderRadius: 6,
    marginBottom: 5,
    marginTop: 2,
  },
  textCtn: {
    flex: 1,
    overflow: 'hidden',
  },
  textTop: {
    borderRadius: 6,
    marginBottom: 2,
    marginTop: 5,
  },
});

export default memo(UpdatesSkeletonLoading);
