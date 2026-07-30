import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { IconButton } from 'react-native-paper';

import { getString } from '@i18n/translations';

import { NovelCoverImage } from '@components';

import { getPlugin } from '@plugins/pluginManager';
import { getUserAgent } from '@hooks/persisted/useUserAgent';
import { formatTimeSpent } from './utils';
import { StatsCard } from './components';

import type { ThemeColors } from '@theme/types';
import type { LibraryStats } from '@database/types';

type TimeSpentItem =
  | {
    type: 'novel';
    id: number;
    pluginId: string;
    name: string;
    cover: string | null;
    timeSpent: number;
  }
  | { type: 'category'; id: number; name: string; timeSpent: number };

interface TimeTabProps {
  stats: LibraryStats;
  theme: ThemeColors;
}

export const TimeTab: React.FC<TimeTabProps> = ({ stats, theme }) => {
  const [showingNovels, setShowingNovels] = useState(true);

  const timeSpentData = useMemo<TimeSpentItem[]>(() => {
    if (showingNovels) {
      return (stats.topNovelsByTimeSpent ?? []).map(n => ({
        type: 'novel' as const,
        id: n.id,
        pluginId: n.pluginId,
        name: n.name,
        cover: n.cover,
        timeSpent: n.timeSpent,
      }));
    }
    return (stats.topCategoriesByTimeSpent ?? []).map(c => ({
      type: 'category' as const,
      id: c.id,
      name: c.name,
      timeSpent: c.timeSpent,
    }));
  }, [
    showingNovels,
    stats.topNovelsByTimeSpent,
    stats.topCategoriesByTimeSpent,
  ]);

  const renderTimeItem = useCallback(
    ({ item }: { item: TimeSpentItem }) => {
      if (item.type === 'novel') {
        const plugin = getPlugin(item.pluginId);
        const headers = plugin?.imageRequestInit?.headers || {
          'User-Agent': getUserAgent(),
        };
        const requestInit = { ...plugin?.imageRequestInit, headers };
        return (
          <View style={styles.timeSpentRow}>
            <NovelCoverImage
              uri={item.cover}
              requestInit={requestInit}
              theme={theme}
              iconSize={22}
              style={styles.timeSpentNovelCover}
              contentFit="cover"
            />
            <View>
              <Text style={[styles.timeSpentLabel, { color: theme.onSurface }]}>
                {item.name}
              </Text>
              <Text style={{ color: theme.onSurfaceVariant }}>
                {formatTimeSpent(item.timeSpent)}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View style={styles.timeSpentRow}>
          <View>
            <Text style={[styles.timeSpentLabel, { color: theme.onSurface }]}>
              {item.name}
            </Text>
            <Text style={{ color: theme.onSurfaceVariant }}>
              {formatTimeSpent(item.timeSpent)}
            </Text>
          </View>
        </View>
      );
    },
    [theme],
  );

  const timeListHeader = useCallback(
    () => (
      <>
        <View style={styles.timeSpentCardContainer}>
          <StatsCard
            label={getString('statsScreen.totalTimeSpent')}
            value={formatTimeSpent(stats.totalTimeSpent)}
          />
        </View>
        <View style={styles.timeSpentHeader}>
          <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
            {showingNovels
              ? getString('statsScreen.topNovelsByTimeSpent')
              : getString('statsScreen.topCategoriesByTimeSpent')}
          </Text>
          <IconButton
            icon={showingNovels ? 'label-outline' : 'book'}
            iconColor={theme.onSurfaceVariant}
            onPress={() => setShowingNovels(!showingNovels)}
            accessibilityRole="button"
            accessibilityLabel={
              showingNovels
                ? getString('statsScreen.showCategories')
                : getString('statsScreen.showNovels')
            }
          />
        </View>
      </>
    ),
    [stats.totalTimeSpent, theme, showingNovels],
  );

  return (
    <LegendList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={timeSpentData}
      estimatedItemSize={56}
      getItemType={item => item.type}
      keyExtractor={item => `${item.type}-${item.id}`}
      ListHeaderComponent={timeListHeader}
      recycleItems
      renderItem={renderTimeItem}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  timeSpentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSpentCardContainer: {
    alignItems: 'center',
  },
  timeSpentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSpentNovelCover: {
    width: 50,
    aspectRatio: 2 / 3,
    marginRight: 8,
    borderRadius: 4,
  },
  timeSpentLabel: {
    fontWeight: 'bold',
  },
  header: {
    fontWeight: 'bold',
    paddingVertical: 16,
  },
});
