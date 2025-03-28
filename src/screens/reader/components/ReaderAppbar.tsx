import React from 'react';
import { StyleSheet, View } from 'react-native';
import color from 'color';

import { Text } from 'react-native-paper';
import { IconButtonV2 } from '../../../components';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ThemeColors } from '@theme/types';
import { bookmarkChapter } from '@database/queries/ChapterQueries';
import { useChapterContext } from '../ChapterContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReaderAppbarProps {
  theme: ThemeColors;
  goBack: () => void;
  bookmarked: boolean;
  setBookmarked: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReaderAppbar = ({
  goBack,
  theme,
  bookmarked,
  setBookmarked,
}: ReaderAppbarProps) => {
  const { chapter, novel } = useChapterContext();
  const { top: topInset } = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={[
        styles.container,
        {
          paddingTop: (topInset || 0) + 8,
          backgroundColor: color(theme.surface).alpha(0.9).string(),
        },
      ]}
    >
      <View style={styles.appbar}>
        <IconButtonV2
          name="arrow-left"
          onPress={goBack}
          color={theme.onSurface}
          size={26}
          theme={theme}
        />
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: theme.onSurface }]}
            numberOfLines={1}
          >
            {novel.name}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {chapter.name}
          </Text>
        </View>
        <IconButtonV2
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={24}
          onPress={() => {
            bookmarkChapter(chapter.id).then(() => setBookmarked(!bookmarked));
          }}
          color={theme.onSurface}
          theme={theme}
          style={styles.bookmark}
        />
      </View>
    </Animated.View>
  );
};

export default ReaderAppbar;

const styles = StyleSheet.create({
  appbar: {
    display: 'flex',
    flexDirection: 'row',
  },
  bookmark: {
    marginRight: 4,
  },
  container: {
    flex: 1,
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
  },
  title: {
    fontSize: 20,
  },
});
