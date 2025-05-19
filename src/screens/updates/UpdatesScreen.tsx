import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { RefreshControl, SectionList, StyleSheet, Text } from 'react-native';

import {
  EmptyView,
  ErrorScreenV2,
  SearchbarV2,
  SafeAreaView,
} from '@components';

import { useSearch } from '@hooks';
import { useUpdates, useTheme } from '@hooks/persisted';
import { getString } from '@strings/translations';
import { ThemeColors } from '@theme/types';
import UpdatesSkeletonLoading from './components/UpdatesSkeletonLoading';
import UpdateNovelCard from './components/UpdateNovelCard';
import { useFocusEffect } from '@react-navigation/native';
import { deleteChapter } from '@database/queries/ChapterQueries';
import { showToast } from '@utils/showToast';
import ServiceManager from '@services/ServiceManager';
import { UpdateScreenProps } from '@navigators/types';
import { UpdateOverview } from '@database/types';
import { ChapterListSkeleton } from '@components/Skeleton/Skeleton';

const Skeleton = () => <ChapterListSkeleton img />;

const UpdatesScreen = ({ navigation }: UpdateScreenProps) => {
  const theme = useTheme();
  const {
    isLoading: isLoadingUpdates,
    updatesOverview,
    getUpdates,
    lastUpdateTime,
    showLastUpdateTime,
    error,
  } = useUpdates();
  const { searchText, setSearchText, clearSearchbar } = useSearch();
  const [isLoading, setIsLoading] = useState(true);
  const onChangeText = (text: string) => {
    setSearchText(text);
  };
  useFocusEffect(
    useCallback(() => {
      //? Push updates to the end of the stack to avoid lag
      setTimeout(() => {
        getUpdates();
        setIsLoading(isLoadingUpdates);
      }, 0);
    }, [getUpdates, isLoadingUpdates]),
  );

  useEffect(
    () =>
      navigation.addListener('tabPress', e => {
        if (navigation.isFocused()) {
          e.preventDefault();

          navigation.navigate('MoreStack', {
            screen: 'TaskQueue',
          });
        }
      }),
    [navigation],
  );

  return (
    <SafeAreaView excludeBottom>
      <SearchbarV2
        searchText={searchText}
        clearSearchbar={clearSearchbar}
        placeholder={getString('updatesScreen.searchbar')}
        onChangeText={onChangeText}
        leftIcon="magnify"
        theme={theme}
        rightIcons={[
          {
            iconName: 'reload',
            onPress: () =>
              ServiceManager.manager.addTask({ name: 'UPDATE_LIBRARY' }),
          },
        ]}
      />
      {isLoading && updatesOverview.length === 0 ? (
        <Skeleton />
      ) : error ? (
        <ErrorScreenV2 error={error} />
      ) : (
        <SectionList
          extraData={[updatesOverview.length]}
          ListHeaderComponent={
            showLastUpdateTime && lastUpdateTime ? (
              <LastUpdateTime lastUpdateTime={lastUpdateTime} theme={theme} />
            ) : null
          }
          contentContainerStyle={styles.listContainer}
          renderSectionHeader={({ section: { date } }) => (
            <Text style={[styles.dateHeader, { color: theme.onSurface }]}>
              {dayjs(date).calendar()}
            </Text>
          )}
          sections={updatesOverview
            .filter(v =>
              searchText
                ? v.novelName.toLowerCase().includes(searchText.toLowerCase())
                : true,
            )
            .reduce(
              (
                acc: { data: UpdateOverview[]; date: string }[],
                cur: UpdateOverview,
              ) => {
                if (acc.length === 0 || acc.at(-1)?.date !== cur.updateDate) {
                  acc.push({ data: [cur], date: cur.updateDate });
                  return acc;
                }
                acc.at(-1)?.data.push(cur);
                return acc;
              },
              [],
            )}
          keyExtractor={item => 'updatedGroup' + item.novelId}
          renderItem={({ item }) => (
            <Suspense fallback={<UpdatesSkeletonLoading theme={theme} />}>
              <UpdateNovelCard
                deleteChapter={chapter => {
                  deleteChapter(
                    chapter.pluginId,
                    chapter.novelId,
                    chapter.id,
                  ).then(() => {
                    showToast(
                      getString('common.deleted', {
                        name: chapter.name,
                      }),
                    );
                    getUpdates();
                  });
                }}
                chapterListInfo={item}
                descriptionText={getString('updatesScreen.updatesLower')}
              />
            </Suspense>
          )}
          ListEmptyComponent={
            <EmptyView
              icon="(˘･_･˘)"
              description={getString('updatesScreen.emptyView')}
              theme={theme}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() =>
                ServiceManager.manager.addTask({ name: 'UPDATE_LIBRARY' })
              }
              colors={[theme.onPrimary]}
              progressBackgroundColor={theme.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default memo(UpdatesScreen);

const LastUpdateTime: React.FC<{
  lastUpdateTime: Date | number | string;
  theme: ThemeColors;
}> = ({ lastUpdateTime, theme }) => (
  <Text style={[styles.lastUpdateTime, { color: theme.onSurface }]}>
    {`${getString('updatesScreen.lastUpdatedAt')} ${dayjs(
      lastUpdateTime,
    ).fromNow()}`}
  </Text>
);

const styles = StyleSheet.create({
  dateHeader: {
    paddingBottom: 2,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  lastUpdateTime: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    flexGrow: 1,
  },
});
