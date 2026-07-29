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
  getDonutPalette,
  ChapterBar,
  PluginSection,
  DonutChartWithLegend,
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

  const statusColors = getDonutPalette(Object.keys(stats.status || {}), theme);
  const layout = useWindowDimensions();

  type StatsRoute = {
    key: 'overview' | 'plugins' | 'time';
    title: string;
  };

  const routes: StatsRoute[] = useMemo(
    () => [
      { key: 'overview', title: getString('generalSettings') },
      { key: 'plugins', title: getString('statsScreen.plugins') },
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

  const pluginData = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; count: number; novelIds: number[] }
    >();
    for (const novel of allNovels) {
      const plugin = getPlugin(novel.pluginId);
      const name = plugin?.name ?? novel.pluginId;
      const group = groups.get(novel.pluginId);
      if (group) {
        group.novelIds.push(novel.id);
        group.count++;
      } else {
        groups.set(novel.pluginId, { name, count: 1, novelIds: [novel.id] });
      }
    }
    const nodes = Array.from(groups.entries())
      .map(([pluginId, data]) => ({
        pluginId,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
    const keys = nodes.map(n => n.name);
    const colors = getDonutPalette(keys, theme);
    const donutEntries = nodes.map(n => ({ key: n.name, value: n.count }));
    return { nodes, colors, donutEntries };
  }, [allNovels, theme]);

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

  const renderPluginItem = useCallback(
    ({
      item,
    }: LegendListRenderItemProps<(typeof pluginData.nodes)[number]>) => (
      <PluginSection
        pluginId={item.pluginId}
        name={item.name}
        count={item.count}
        novels={allNovels}
        theme={theme}
        onNovelPress={handleNovelPress}
      />
    ),
    [allNovels, theme, handleNovelPress],
  );

  const pluginListHeader = useCallback(
    () => (
      <View>
        <DonutChartWithLegend
          title={getString('statsScreen.pluginDistribution')}
          entries={pluginData.donutEntries}
          colors={pluginData.colors}
          theme={theme}
        />
      </View>
    ),
    [pluginData, theme],
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
        <ChapterBar
          read={stats.chaptersRead ?? 0}
          total={stats.chaptersCount ?? 0}
          downloaded={stats.chaptersDownloaded ?? 0}
        />
        <DonutChartWithLegend
          title={getString('statsScreen.statusDistribution')}
          entries={Object.entries(stats.status || {})
            .filter(([_, v]) => v > 0)
            .map(([k, v]) => ({ key: k, value: v }))}
          colors={statusColors}
          theme={theme}
          getLabel={key => translateNovelStatus(key)}
        />
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

      if (tabRoute.key === 'plugins') {
        return (
          <LegendList
            style={styles.screenCtn}
            contentContainerStyle={styles.contentCtn}
            data={pluginData.nodes}
            estimatedItemSize={56}
            keyExtractor={item => item.pluginId}
            ListHeaderComponent={pluginListHeader}
            renderItem={renderPluginItem}
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
      pluginData,
      pluginListHeader,
      renderPluginItem,
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
  contentCtn: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});
