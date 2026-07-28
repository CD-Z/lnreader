import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  LegendList,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { useNavigation } from '@react-navigation/native';
import { TabView } from 'react-native-tab-view';

import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';

import {
  Appbar,
  ErrorScreenV2,
  LoadingScreenV2,
  NovelCoverImage,
  SafeAreaView,
  TopTabBar,
} from '@components';

import { LibraryStats } from '@database/types';
import {
  getChaptersDownloadedCountFromDb,
  getChaptersReadCountFromDb,
  getChaptersTotalCountFromDb,
  getChaptersUnreadCountFromDb,
  getLibraryStatsFromDb,
  getNovelGenresFromDb,
  getNovelStatusFromDb,
  getTopCategoriesByTimeSpentFromDb,
  getTopNovelsByTimeSpentFromDb,
  getTotalTimeSpentFromDb,
  getNovelsWithGenresFromDb,
  type NovelWithGenres,
} from '@database/queries/StatsQueries';
import { Row } from '@components/Common';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { translateNovelStatus } from '@utils/translateEnum';
import { getUserAgent } from '@hooks/persisted/useUserAgent';
import { getPlugin } from '@plugins/pluginManager';
import { formatTimeSpent } from './utils';
import {
  buildGenreTree,
  type GenreTreeNode,
} from '@screens/GenreStatsScreen/utils';
import { useGenreTaxonomy } from '@hooks/persisted/useGenreTaxonomy';
import { GenreSection } from '@screens/GenreStatsScreen/components';
import {
  StatsCard,
  DonutChart,
  getStatusColors,
  ChapterBar,
} from './components';

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

const StatsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats>({});
  const [error, setError] = useState<unknown>();
  const [allNovels, setAllNovels] = useState<NovelWithGenres[]>([]);

  const [index, setIndex] = useState(0);
  const [showingNovels, setShowingNovels] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const res = await Promise.all([
          getLibraryStatsFromDb(),
          getChaptersTotalCountFromDb(),
          getChaptersReadCountFromDb(),
          getChaptersUnreadCountFromDb(),
          getChaptersDownloadedCountFromDb(),
          getNovelGenresFromDb(),
          getNovelStatusFromDb(),
          getTopNovelsByTimeSpentFromDb(),
          getTopCategoriesByTimeSpentFromDb(),
          getNovelsWithGenresFromDb(),
          getTotalTimeSpentFromDb(),
        ]);

        if (!cancelled) {
          setStats(
            res.reduce<LibraryStats>(
              (combinedStats, currentStats) => ({
                ...combinedStats,
                ...currentStats,
              }),
              {},
            ),
          );
        }
        if (!cancelled) setAllNovels(res[9] as NovelWithGenres[]);
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);
  const { taxonomy } = useGenreTaxonomy();
  const tree = useMemo(
    () => buildGenreTree(allNovels, taxonomy),
    [allNovels, taxonomy],
  );
  const globalMax = Math.max(
    ...tree.flatMap(n => [n.count, ...(n.children?.map(c => c.count) ?? [])]),
    1,
  );

  const handleNovelPress = useCallback(
    (novel: {
      id: number;
      name: string;
      path: string;
      cover: string | null;
      pluginId: string;
    }) => {
      navigation.navigate('ReaderStack', {
        screen: 'Novel',
        params: {
          name: novel.name,
          path: novel.path,
          pluginId: novel.pluginId,
          cover: novel.cover,
        },
      });
    },
    [navigation],
  );

  const statusColors = getStatusColors(theme);
  const layout = useWindowDimensions();

  type StatsRoute = {
    key: 'overview' | 'time';
    title: string;
  };

  const routes: StatsRoute[] = useMemo(
    () => [
      { key: 'overview', title: getString('generalSettings') },
      { key: 'time', title: getString('statsScreen.totalTimeSpent') },
    ],
    [],
  );

  const navigationState = useMemo(() => ({ index, routes }), [index, routes]);
  const initialLayout = useMemo(
    () => ({ width: layout.width }),
    [layout.width],
  );

  const renderTabBar = useCallback(
    (props: any) => (
      <TopTabBar
        {...props}
        indicatorStyle={styles.tabBarIndicator}
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.outlineVariant,
          },
        ]}
        tabStyle={styles.tabStyle}
        gap={8}
        inactiveColor={theme.secondary}
        activeColor={theme.primary}
        android_ripple={{ color: theme.rippleColor }}
      />
    ),
    [
      theme.outlineVariant,
      theme.primary,
      theme.rippleColor,
      theme.secondary,
      theme.surface,
    ],
  );

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

  const renderOverviewItem = useCallback(
    ({ item }: LegendListRenderItemProps<GenreTreeNode>) => (
      <GenreSection
        node={item}
        globalMax={globalMax}
        novels={allNovels}
        theme={theme}
        onNovelPress={handleNovelPress}
      />
    ),
    [globalMax, allNovels, theme, handleNovelPress],
  );

  const renderTimeItem = useCallback(
    ({ item }: LegendListRenderItemProps<TimeSpentItem>) => {
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

  const overviewListHeader = useCallback(
    () => (
      <View>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.titlesInLibrary')}
            value={stats.novelsCount}
          />
          <StatsCard
            label={getString('statsScreen.sources')}
            value={stats.sourcesCount}
          />
        </Row>
        <ChapterBar
          read={stats.chaptersRead ?? 0}
          total={stats.chaptersCount ?? 0}
          downloaded={stats.chaptersDownloaded ?? 0}
        />
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('statsScreen.statusDistribution')}
        </Text>
        <View style={styles.donutContainer}>
          <DonutChart
            entries={Object.entries(stats.status || {})
              .filter(([_, v]) => v > 0)
              .map(([k, v]) => ({ key: k, value: v }))}
            size={160}
            thickness={28}
            colors={statusColors}
          />
        </View>
        <View style={styles.legendContainer}>
          {Object.entries(stats.status || {})
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => (
              <View key={key} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: statusColors[key] || theme.outline },
                  ]}
                />
                <Text
                  style={[styles.legendLabel, { color: theme.onSurface }]}
                  numberOfLines={1}
                >
                  {translateNovelStatus(key)}
                </Text>
                <Text
                  style={[
                    styles.legendValue,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  {count}
                </Text>
              </View>
            ))}
        </View>
        {tree.length > 0 && (
          <View style={styles.genreSectionHeader}>
            <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
              {getString('statsScreen.genreDistribution')}
            </Text>
            <Pressable
              onPress={() =>
                navigation.navigate('SettingsStack', {
                  screen: 'GenreTaxonomy',
                })
              }
              accessibilityRole="button"
              accessibilityLabel={getString('genreStats.editTaxonomy')}
              hitSlop={12}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                color={theme.onSurfaceVariant}
                size={20}
              />
            </Pressable>
          </View>
        )}
      </View>
    ),
    [stats, theme, statusColors, tree.length, navigation],
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

  const renderScene = useCallback(
    ({ route: tabRoute }: { route: StatsRoute }) => {
      if (tabRoute.key === 'overview') {
        return (
          <LegendList
            style={styles.screenCtn}
            contentContainerStyle={styles.contentCtn}
            data={tree}
            estimatedItemSize={64}
            keyExtractor={item => item.name}
            ListHeaderComponent={overviewListHeader}
            renderItem={renderOverviewItem}
            showsVerticalScrollIndicator={false}
          />
        );
      }

      return (
        <LegendList
          style={styles.screenCtn}
          contentContainerStyle={styles.contentCtn}
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
    },
    [
      tree,
      overviewListHeader,
      renderOverviewItem,
      timeSpentData,
      timeListHeader,
      renderTimeItem,
    ],
  );

  const Header = (
    <Appbar
      title={getString('statsScreen.title')}
      handleGoBack={navigation.goBack}
      theme={theme}
    />
  );

  if (error) {
    return (
      <>
        {Header}
        <ErrorScreenV2 error={error} />
      </>
    );
  }
  if (isLoading) {
    return (
      <>
        {Header}
        <LoadingScreenV2 theme={theme} />
      </>
    );
  }

  return (
    <SafeAreaView excludeTop>
      {Header}
      <TabView
        navigationState={navigationState}
        renderTabBar={renderTabBar}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        lazy
      />
    </SafeAreaView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  tabBar: {
    borderBottomWidth: 1,
    elevation: 0,
  },
  tabBarIndicator: {
    backgroundColor: '#000',
    height: 3,
  },
  tabStyle: {
    flex: 1,
  },
  genreSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  screenCtn: {
    paddingHorizontal: 16,
  },
  statsRow: {
    justifyContent: 'center',
    marginBottom: 8,
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
  donutContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legendContainer: {
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
  },
  legendValue: {
    fontSize: 14,
    textAlign: 'right',
    width: 40,
  },
  contentCtn: {
    paddingBottom: 40,
  },
});
