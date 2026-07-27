import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';

import {
  Appbar,
  ErrorScreenV2,
  LoadingScreenV2,
  NovelCoverImage,
  SafeAreaView,
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
} from '@database/queries/StatsQueries';
import { Row } from '@components/Common';
import { IconButton } from 'react-native-paper';
import { translateNovelStatus } from '@utils/translateEnum';
import { getUserAgent } from '@hooks/persisted/useUserAgent';
import { getPlugin } from '@plugins/pluginManager';
import { formatTimeSpent, normalizeGenreDistribution } from './utils';
import { StatsCard, DonutChart, DONUT_COLORS } from './components';

const StatsScreen = () => {
  const theme = useTheme();
  const { goBack } = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats>({});
  const [error, setError] = useState<unknown>();

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
          getTotalTimeSpentFromDb(),
        ]);
        console.log(await getNovelStatusFromDb());
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

  const Header = (
    <Appbar
      title={getString('statsScreen.title')}
      handleGoBack={goBack}
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
      <ScrollView
        style={styles.screenCtn}
        contentContainerStyle={styles.contentCtn}
      >
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('generalSettings')}
        </Text>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.titlesInLibrary')}
            value={stats.novelsCount}
          />
          <StatsCard
            label={getString('statsScreen.totalTimeSpent')}
            value={formatTimeSpent(stats.totalTimeSpent)}
          />
        </Row>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.readChapters')}
            value={stats.chaptersRead}
          />
          <StatsCard
            label={getString('statsScreen.totalChapters')}
            value={stats.chaptersCount}
          />
        </Row>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.unreadChapters')}
            value={stats.chaptersUnread}
          />
          <StatsCard
            label={getString('statsScreen.downloadedChapters')}
            value={stats.chaptersDownloaded}
          />
        </Row>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.sources')}
            value={stats.sourcesCount}
          />
        </Row>
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('statsScreen.genreDistribution')}
        </Text>
        <View>
          {(() => {
            const entries = normalizeGenreDistribution(stats.genres || {});
            const maxCount = Math.max(...entries.map(e => e.count));
            return entries.map(entry => (
              <DistributionBar
                key={entry.name}
                label={entry.name}
                count={entry.count}
                max={maxCount}
              />
            ));
          })()}
        </View>
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
                    { backgroundColor: DONUT_COLORS[key] || '#9E9E9E' },
                  ]}
                />
                <Text
                  style={[styles.legendLabel, { color: theme.onSurface }]}
                  numberOfLines={1}
                >
                  {translateNovelStatus(key)}
                </Text>
                <Text
                  style={[styles.legendValue, { color: theme.onSurfaceVariant }]}
                >
                  {count}
                </Text>
              </View>
            ))}
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
        {showingNovels &&
          stats.topNovelsByTimeSpent?.map((novel, _) => {
            const plugin = getPlugin(novel.pluginId);
            const headers = plugin?.imageRequestInit?.headers || {
              'User-Agent': getUserAgent(),
            };
            const requestInit = { ...plugin?.imageRequestInit, headers };
            return (
              <View key={novel.id} style={styles.timeSpentRow}>
                <NovelCoverImage
                  uri={novel.cover}
                  requestInit={requestInit}
                  theme={theme}
                  iconSize={22}
                  style={styles.timeSpentNovelCover}
                  contentFit="cover"
                />
                <View>
                  <Text
                    style={[styles.timeSpentLabel, { color: theme.onSurface }]}
                  >
                    {novel.name}
                  </Text>
                  <Text style={{ color: theme.onSurfaceVariant }}>
                    {formatTimeSpent(novel.timeSpent)}
                  </Text>
                </View>
              </View>
            );
          })}
        {!showingNovels &&
          stats.topCategoriesByTimeSpent?.map((category, _) => {
            return (
              <View key={category.id} style={styles.timeSpentRow}>
                <View>
                  <Text
                    style={[styles.timeSpentLabel, { color: theme.onSurface }]}
                  >
                    {category.name}
                  </Text>
                  <Text style={{ color: theme.onSurfaceVariant }}>
                    {formatTimeSpent(category.timeSpent)}
                  </Text>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

const DistributionBar: React.FC<{
  label: string;
  count: number;
  max: number;
}> = ({ label, count, max }) => {
  const theme = useTheme();
  const barWidth = max > 0 ? `${(count / max) * 100}%` : '0%';
  label = label.trim();
  if (label.length === 0) {
    return null; // Skip rendering if label is empty
  }
  return (
    <View style={styles.distRow}>
      <Text
        style={[styles.distLabel, { color: theme.onSurface }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[styles.distBarCtn, { backgroundColor: theme.surfaceVariant }]}
      >
        <View
          style={[
            styles.distBar,
            { width: barWidth as any, backgroundColor: theme.primary },
          ]}
        />
      </View>
      <Text style={[styles.distCount, { color: theme.onSurfaceVariant }]}>
        {count}
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  contentCtn: {
    paddingBottom: 40,
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
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distLabel: {
    flex: 1,
    fontSize: 14,
  },
  distBarCtn: {
    flex: 2,
    height: 12,
    borderRadius: 6,
  },
  distBar: {
    height: '100%',
    borderRadius: 6,
  },
  distCount: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
  },
  timeSpentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
