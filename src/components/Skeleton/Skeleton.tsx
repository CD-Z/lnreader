import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonGroup } from '@components/Skeleton/SkeletonGroup';
import { useTheme } from '@hooks/persisted';
import { getLoadingColors } from '@utils/useLoadingColors';

function useSharedSkeleton() {
  const theme = useTheme();
  const [, skeletonColor] = getLoadingColors(theme);
  return { skeletonColor };
}

const ChapterSkeleton = React.memo(function ChapterSkeletonItem({
  color,
  img,
}: {
  color: string;
  img?: boolean;
}) {
  return (
    <View style={styles.chapter}>
      {img ? (
        <SkeletonBlock
          width={40}
          height={40}
          borderRadius={4}
          color={color}
          style={styles.img}
        />
      ) : null}
      <View style={[styles.flex, styles.chapterText]}>
        <SkeletonBlock
          width="100%"
          height={20}
          borderRadius={4}
          color={color}
          style={styles.h20}
        />
        <SkeletonBlock
          width="100%"
          height={15}
          borderRadius={4}
          color={color}
          style={styles.h15}
        />
      </View>
      <SkeletonBlock
        width={30}
        height={30}
        borderRadius={20}
        color={color}
        style={styles.circle}
      />
    </View>
  );
});

export function VerticalBarSkeleton() {
  const { skeletonColor } = useSharedSkeleton();
  return (
    <SkeletonGroup>
      <View style={styles.verticalBar}>
        <SkeletonBlock
          width="100%"
          height={24}
          borderRadius={4}
          color={skeletonColor}
        />
      </View>
    </SkeletonGroup>
  );
}

export function NovelMetaSkeleton() {
  const { skeletonColor } = useSharedSkeleton();

  return (
    <SkeletonGroup>
      <View style={[styles.novelInformationText, styles.h62]}>
        <View style={[styles.flex, styles.h20]}>
          <SkeletonBlock
            width="100%"
            height={20}
            borderRadius={4}
            color={skeletonColor}
            style={styles.h20}
          />
          <SkeletonBlock
            width="100%"
            height={20}
            borderRadius={4}
            color={skeletonColor}
            style={styles.h20}
          />
          <View style={[styles.metaGap, styles.row, styles.flex]}>
            {[0, 1, 2, 3].map(i => (
              <SkeletonBlock
                key={i}
                width={80}
                height={30}
                borderRadius={8}
                color={skeletonColor}
                style={styles.chip}
              />
            ))}
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

export const ChapterListSkeleton = ({ img }: { img?: boolean }) => {
  const { skeletonColor } = useSharedSkeleton();
  const items = useMemo(() => [0, 1, 2, 3, 4, 5, 6], []);

  return (
    <SkeletonGroup>
      {items.map(i => (
        <ChapterSkeleton key={i} color={skeletonColor} img={img} />
      ))}
    </SkeletonGroup>
  );
};

const styles = StyleSheet.create({
  chapter: {
    flexDirection: 'row',
    height: 40,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  chapterText: {
    height: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  chip: {
    borderRadius: 8,
    height: 30,
    marginRight: 8,
    width: 80,
  },
  circle: {
    alignSelf: 'center',
    borderRadius: 20,
    height: 30,
    marginLeft: 20,
    width: 30,
  },
  flex: { flex: 1 },
  h15: {
    height: 15,
  },
  h20: {
    height: 20,
    marginBottom: 5,
  },
  h62: {
    height: 110,
  },
  img: {
    alignSelf: 'center',
    height: 40,
    marginRight: 20,
    width: 40,
  },
  metaGap: {
    marginTop: 22,
  },
  novelInformationText: {
    height: 62,
    marginBottom: 2.5,
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 5,
  },
  row: { flexDirection: 'row' },
  verticalBar: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
});
