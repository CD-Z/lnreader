/* eslint-disable no-console */
import { useLibraryContext } from '@components/Context/LibraryContext';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import {
  deleteCachedNovels as _deleteCachedNovels,
  getCachedNovels as _getCachedNovels,
} from '@database/queries/NovelQueries';
import { ChapterInfo, NovelInfo } from '@database/types';
import NativeFile from '@specs/NativeFile';
import { MMKVStorage } from '@utils/mmkv/mmkv';
import { parseChapterNumber } from '@utils/parseChapterNumber';
import { NOVEL_STORAGE } from '@utils/Storages';
import { showToast } from '@utils/showToast';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMMKVNumber, useMMKVObject } from 'react-native-mmkv';
import { useAppSettings } from './useSettings';
import { TRACKED_NOVEL_PREFIX } from './useTrackedNovel';
import {
  BatchInfo,
  defaultNovelSettings,
  defaultPageIndex,
  NovelSettings,
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
  LAST_READ_PREFIX,
} from './useNovel/types';
import { useChapterOperations } from './useNovel/useChapterOperations';
import { useNovelData } from './useNovel/useNovelData';

export { NOVEL_PAGE_INDEX_PREFIX, NOVEL_SETTINGS_PREFIX, LAST_READ_PREFIX };
export { defaultNovelSettings, defaultPageIndex };
export type { NovelSettings, BatchInfo };

export const useNovel = (novelOrPath: string | NovelInfo, pluginId: string) => {
  const { switchNovelToLibrary } = useLibraryContext();
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [novel, setNovel] = useState<NovelInfo | undefined>(
    typeof novelOrPath === 'object' ? novelOrPath : undefined,
  );
  const [pages, setPages] = useState<string[]>(() => {
    if (novel && (novel.totalPages ?? 0) > 0) {
      const tmpPages = Array(novel.totalPages)
        .fill(0)
        .map((_, idx) => String(idx + 1));
      return tmpPages.length > 1 ? tmpPages : ['1'];
    }
    return [];
  });

  const { defaultChapterSort } = useAppSettings();

  const novelPath = novel?.path ?? (novelOrPath as string);

  const [pageIndex = defaultPageIndex, setPageIndex] = useMMKVNumber(
    `${NOVEL_PAGE_INDEX_PREFIX}_${pluginId}_${novelPath}`,
  );
  const currentPage = pages[pageIndex];

  const [lastRead, setLastRead] = useMMKVObject<ChapterInfo>(
    `${LAST_READ_PREFIX}_${pluginId}_${novelPath}`,
  );
  const [novelSettings = defaultNovelSettings, _setNovelSettings] =
    useMMKVObject<NovelSettings>(
      `${NOVEL_SETTINGS_PREFIX}_${pluginId}_${novelPath}`,
    );

  const [chapters, _setChapters] = useState<ChapterInfo[]>([]);
  const [firstUnreadChapter, setFirstUnreadChapter] = useState<
    ChapterInfo | undefined
  >();
  const [batchInformation, setBatchInformation] = useState<BatchInfo>({
    batch: 0,
    total: 0,
  });

  const settingsSort: ChapterOrderKey =
    novelSettings.sort || defaultChapterSort;
  const settingsFilter: ChapterFilterKey[] = useMemo(
    () => novelSettings.filter ?? [],
    [novelSettings.filter],
  );

  const transformChapters = useCallback(
    (chs: ChapterInfo[]) => {
      if (!novel) return chs;
      const newChapters = chs.map(chapter => {
        const parsedTime = dayjs(chapter.releaseTime);
        const releaseTime = parsedTime.isValid()
          ? parsedTime.format('LL')
          : chapter.releaseTime;
        const chapterNumber = chapter.chapterNumber
          ? chapter.chapterNumber
          : parseChapterNumber(novel.name, chapter.name);
        return {
          ...chapter,
          releaseTime,
          chapterNumber,
        };
      });
      return newChapters;
    },
    [novel],
  );

  const {
    updateChapter,
    setChapters,
    extendChapters,
    bookmarkChapters,
    markPreviouschaptersRead,
    markChapterRead,
    markChaptersRead,
    markPreviousChaptersUnread,
    markChaptersUnread,
    updateChapterProgress,
    deleteChapter,
    deleteChapters,
    refreshChapters,
  } = useChapterOperations({
    novel,
    chapters,
    _setChapters,
    transformChapters,
    settingsSort,
    settingsFilter,
    currentPage,
    fetching,
  });

  const {
    calculatePages,
    getNovel,
    getChapters,
    getNextChapterBatch,
    loadUpToBatch,
  } = useNovelData({
    novel,
    novelPath,
    pluginId,
    pages,
    pageIndex,
    settingsSort,
    settingsFilter,
    batchInformation,
    setPages,
    setNovel,
    setFirstUnreadChapter,
    setBatchInformation,
    setChapters,
    extendChapters,
  });

  const followNovel = useCallback(() => {
    switchNovelToLibrary(novelPath, pluginId).then(() => {
      if (novel) {
        setNovel({
          ...novel,
          inLibrary: !novel?.inLibrary,
        });
      }
    });
  }, [novel, novelPath, pluginId, switchNovelToLibrary]);

  const openPage = useCallback(
    (index: number) => {
      setPageIndex(index);
    },
    [setPageIndex],
  );

  useEffect(() => {
    if (novel) {
      if (pages.length === 0) {
        calculatePages(novel).then(setPages);
      }
      setLoading(false);
    } else {
      getNovel()
        .catch(() => {
          // Error is handled - novel stays undefined and loading becomes false
        })
        .finally(() => {
          //? Sometimes loading state changes doesn't trigger rerender causing NovelScreen to be in endless loading state
          setLoading(false);
          // getNovel();
        });
    }
  }, [getNovel, novel, calculatePages, pages.length]);

  useEffect(() => {
    if (novel === undefined || pages.length === 0) {
      return;
    }

    setFetching(true);
    getChapters()
      .catch(e => {
        if (__DEV__) console.error(e);

        showToast(e.message);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [getChapters, novel, novelOrPath, pages.length]);

  return useMemo(
    () => ({
      loading,
      fetching,
      pageIndex,
      pages,
      novel,
      lastRead,
      firstUnreadChapter,
      chapters,
      novelSettings,
      batchInformation,
      getNextChapterBatch,
      loadUpToBatch,
      getNovel,
      setPageIndex,
      openPage,
      setNovel,
      setLastRead,

      followNovel,
      bookmarkChapters,
      markPreviouschaptersRead,
      markChapterRead,
      markChaptersRead,
      markPreviousChaptersUnread,
      markChaptersUnread,

      refreshChapters,
      updateChapter,
      updateChapterProgress,
      deleteChapter,
      deleteChapters,
    }),
    [
      loading,
      fetching,
      pageIndex,
      pages,
      novel,
      lastRead,
      firstUnreadChapter,
      chapters,
      novelSettings,
      batchInformation,
      getNextChapterBatch,
      loadUpToBatch,
      getNovel,
      setPageIndex,
      openPage,
      setLastRead,
      followNovel,
      bookmarkChapters,
      markPreviouschaptersRead,
      markChapterRead,
      markChaptersRead,
      markPreviousChaptersUnread,
      markChaptersUnread,
      refreshChapters,
      updateChapter,
      updateChapterProgress,
      deleteChapter,
      deleteChapters,
    ],
  );
};

export const deleteCachedNovels = async () => {
  const cachedNovels = await _getCachedNovels();
  for (const novel of cachedNovels) {
    MMKVStorage.remove(`${TRACKED_NOVEL_PREFIX}_${novel.id}`);
    MMKVStorage.remove(
      `${NOVEL_PAGE_INDEX_PREFIX}_${novel.pluginId}_${novel.path}`,
    );
    MMKVStorage.remove(
      `${NOVEL_SETTINGS_PREFIX}_${novel.pluginId}_${novel.path}`,
    );
    MMKVStorage.remove(`${LAST_READ_PREFIX}_${novel.pluginId}_${novel.path}`);
    const novelDir = NOVEL_STORAGE + '/' + novel.pluginId + '/' + novel.id;
    if (NativeFile.exists(novelDir)) {
      NativeFile.unlink(novelDir);
    }
  }
  _deleteCachedNovels();
};
