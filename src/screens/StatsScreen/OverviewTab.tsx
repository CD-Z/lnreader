import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { NavigationProp } from '@react-navigation/native';

import { getString } from '@i18n/translations';

import { translateNovelStatus } from '@utils/translateEnum';

import {
  buildGenreTree,
  type GenreTreeNode,
} from '@screens/GenreStatsScreen/utils';
import { useGenreTaxonomy } from '@hooks/persisted/useGenreTaxonomy';
import { GenreSection } from '@screens/GenreStatsScreen/components';
import {
  getDonutPalette,
  ChapterBar,
  DonutChartWithLegend,
} from './components';

import type { ThemeColors } from '@theme/types';
import type { NovelWithGenres } from '@database/queries/StatsQueries';
import type { LibraryStats } from '@database/types';
import type { MoreStackParamList } from '@navigators/types';

interface OverviewTabProps {
  allNovels: NovelWithGenres[];
  stats: LibraryStats;
  theme: ThemeColors;
  onNovelPress: (novel: {
    id: number;
    name: string;
    path: string;
    cover: string | null;
    pluginId: string;
  }) => void;
  navigation: NavigationProp<MoreStackParamList>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  allNovels,
  stats,
  theme,
  onNovelPress,
  navigation,
}) => {
  const { taxonomy } = useGenreTaxonomy();
  const tree = useMemo(
    () => buildGenreTree(allNovels, taxonomy),
    [allNovels, taxonomy],
  );
  const globalMax = Math.max(
    ...tree.flatMap(n => [n.count, ...(n.children?.map(c => c.count) ?? [])]),
    1,
  );

  const statusColors = getDonutPalette(Object.keys(stats.status || {}), theme);

  const renderOverviewItem = useCallback(
    ({ item }: { item: GenreTreeNode }) => (
      <GenreSection
        node={item}
        globalMax={globalMax}
        novels={allNovels}
        theme={theme}
        onNovelPress={onNovelPress}
      />
    ),
    [globalMax, allNovels, theme, onNovelPress],
  );

  const overviewListHeader = useCallback(
    () => (
      <View style={styles.overviewHeader}>
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
          centerLabel={getString('statsScreen.novels')}
          getLabel={key => translateNovelStatus(key)}
        />
        {tree.length > 0 && (
          <View style={styles.genreSectionHeader}>
            <Text style={[styles.header, { color: theme.onSurface }]}>
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
              style={styles.customizeButton}
            >
              <Text style={[styles.customizeText, { color: theme.primary }]}>
                {getString('statsScreen.customizeGenres')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    ),
    [stats, theme, statusColors, tree.length, navigation],
  );

  return (
    <LegendList
      contentContainerStyle={styles.listContent}
      data={tree}
      estimatedItemSize={64}
      keyExtractor={item => item.name}
      getItemType={() => 'genre'}
      ListHeaderComponent={overviewListHeader}
      renderItem={renderOverviewItem}
      recycleItems
      showsVerticalScrollIndicator={false}
      experimental_adaptiveRender={{}}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  overviewHeader: {
    paddingHorizontal: 16,
  },
  genreSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
  },
  customizeButton: {
    minHeight: 40,
    justifyContent: 'center',
  },
  customizeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
