import React, { useState, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { getString } from '@i18n/translations';
import NovelCard from './NovelCard';
import type { ThemeColors } from '@theme/types';

interface NovelCarouselProps {
  novels: {
    id: number;
    name: string;
    path: string;
    cover: string | null;
    pluginId: string;
  }[];
  genreName: string;
  theme: ThemeColors;
  onNovelPress: (novel: {
    id: number;
    name: string;
    path: string;
    cover: string | null;
    pluginId: string;
  }) => void;
  onScrollChange?: (isScrolling: boolean) => void;
}

const MAX_VISIBLE = 20;

const NovelCarousel: React.FC<NovelCarouselProps> = ({
  novels,
  genreName,
  theme,
  onNovelPress,
  onScrollChange,
}) => {
  if (novels.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
        {getString('genreStats.noNovels')}
      </Text>
    );
  }

  const [showAll, setShowAll] = useState(false);
  const scrollingRef = useRef(false);

  const visibleNovels = showAll ? novels : novels.slice(0, MAX_VISIBLE);
  const hasMore = !showAll && novels.length > MAX_VISIBLE;

  const data = hasMore
    ? [...visibleNovels, { id: -1, name: '', cover: null, pluginId: '' } as any]
    : visibleNovels;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.onSurfaceVariant }]}>
        {getString('genreStats.novelsIn', { genre: genreName })}
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        onScrollBeginDrag={() => {
          if (!scrollingRef.current && onScrollChange) {
            scrollingRef.current = true;
            onScrollChange(true);
          }
        }}
        onScrollEndDrag={() => {
          if (scrollingRef.current && onScrollChange) {
            scrollingRef.current = false;
            onScrollChange(false);
          }
        }}
        onMomentumScrollEnd={() => {
          if (scrollingRef.current && onScrollChange) {
            scrollingRef.current = false;
            onScrollChange(false);
          }
        }}
        keyExtractor={item =>
          item.id != null && item.id !== -1 ? String(item.id) : 'see-all'
        }
        renderItem={({ item }) => {
          if (item.id === -1) {
            return (
              <Pressable
                onPress={() => setShowAll(true)}
                accessibilityRole="button"
                accessibilityLabel={getString('genreStats.seeAllNovels')}
                style={styles.seeAllCard}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>
                  {getString('genreStats.seeAllNovels')}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  color={theme.primary}
                  size={20}
                />
              </Pressable>
            );
          }
          return (
            <NovelCard
              novel={item}
              theme={theme}
              onPress={() => onNovelPress(item)}
            />
          );
        }}
        windowSize={5}
        maxToRenderPerBatch={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  heading: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    padding: 8,
  },
  seeAllCard: {
    width: 80,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default NovelCarousel;
