import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import { createBootstrapService } from './bootstrapService';
import {
  bookmarkChaptersAction,
  ChapterActionsDependencies,
  deleteChapterAction,
  deleteChaptersAction,
  markChapterReadAction,
  markChaptersReadAction,
  markChaptersUnreadAction,
  markPreviouschaptersReadAction,
  markPreviousChaptersUnreadAction,
  refreshChaptersAction,
  updateChapterProgressAction,
} from './chapterActions';
import { BatchInfo, NovelSettings } from './types';
import {
  ChapterTextCacheApi,
  GetState,
  NovelStoreChapterActions,
  SetState,
} from './novelStore.types';

interface CreateNovelStoreChapterActionsParams {
  set: SetState;
  get: GetState;
  bootstrapService: Pick<
    ReturnType<typeof createBootstrapService>,
    'getNextChapterBatch' | 'loadUpToBatch'
  >;
  chapterActionsDependencies: ChapterActionsDependencies;
  transformChapters: (chs: ChapterInfo[]) => ChapterInfo[];
  defaultChapterSort: ChapterOrderKey;
}

export const createNovelStoreChapterActions = ({
  set,
  get,
  bootstrapService,
  chapterActionsDependencies,
  transformChapters,
  defaultChapterSort,
}: CreateNovelStoreChapterActionsParams): NovelStoreChapterActions => {
  const mutateChapters = (mutation: (chs: ChapterInfo[]) => ChapterInfo[]) => {
    if (get().novel) {
      set(state => ({ chapters: mutation(state.chapters) }));
    }
  };

  const setChapters = (chs: ChapterInfo[]) => {
    set({ chapters: transformChapters(chs) });
  };

  const getSettingsSort = (settings: NovelSettings): ChapterOrderKey =>
    settings.sort || defaultChapterSort;

  const getSettingsFilter = (settings: NovelSettings): ChapterFilterKey[] =>
    settings.filter ?? [];

  const createChapterTextCache = (): ChapterTextCacheApi => {
    return {
      read: chapterId => get().chapterTextCache[chapterId],
      write: (chapterId, value) => {
        set({
          chapterTextCache: {
            ...get().chapterTextCache,
            [chapterId]: value,
          },
        });
      },
      remove: chapterId => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [chapterId]: _ignored, ...rest } = get().chapterTextCache;
        set({
          chapterTextCache: rest,
        });
      },
      clear: () => {
        set({
          chapterTextCache: {},
        });
      },
    };
  };

  return {
    chapterTextCache: createChapterTextCache(),
    getNextChapterBatch: async () => {
      const state = get();
      const result = await bootstrapService.getNextChapterBatch({
        novel: state.novel,
        pages: state.pages,
        pageIndex: state.pageIndex,
        settingsSort: getSettingsSort(state.novelSettings),
        settingsFilter: getSettingsFilter(state.novelSettings),
        batchInformation: state.batchInformation,
      });

      if (!result) return;

      set(curr => ({
        batchInformation: {
          ...curr.batchInformation,
          batch: result.batch,
        },
        chapters: curr.chapters.concat(transformChapters(result.chapters)),
      }));
    },

    loadUpToBatch: async (targetBatch: number) => {
      const state = get();

      await bootstrapService.loadUpToBatch({
        targetBatch,
        novel: state.novel,
        pages: state.pages,
        pageIndex: state.pageIndex,
        settingsSort: getSettingsSort(state.novelSettings),
        settingsFilter: getSettingsFilter(state.novelSettings),
        batchInformation: state.batchInformation,
        onBatchLoaded: (batch, chapters) => {
          set(curr => ({
            batchInformation: {
              ...curr.batchInformation,
              batch,
            },
            chapters: curr.chapters.concat(transformChapters(chapters)),
          }));
        },
      });
    },

    updateChapter: (index, update) => {
      if (get().novel) {
        set(state => {
          const next = [...state.chapters];
          next[index] = { ...next[index], ...update };
          return {
            chapters: next,
          };
        });
      }
    },

    setChapters,

    extendChapters: chs => {
      set(state => ({
        chapters: state.chapters.concat(transformChapters(chs)),
      }));
    },

    bookmarkChapters: chaptersState => {
      bookmarkChaptersAction(
        chaptersState,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    markPreviouschaptersRead: chapterId => {
      markPreviouschaptersReadAction(
        chapterId,
        get().novel,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    markChapterRead: chapterId => {
      markChapterReadAction(
        chapterId,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    markChaptersRead: chaptersState => {
      markChaptersReadAction(
        chaptersState,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    markPreviousChaptersUnread: chapterId => {
      markPreviousChaptersUnreadAction(
        chapterId,
        get().novel,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    markChaptersUnread: chaptersState => {
      markChaptersUnreadAction(
        chaptersState,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    updateChapterProgress: (chapterId, progress) => {
      updateChapterProgressAction(
        chapterId,
        progress,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    deleteChapter: chapter => {
      deleteChapterAction(
        chapter,
        get().novel,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    deleteChapters: chaptersState => {
      deleteChaptersAction(
        chaptersState,
        get().novel,
        mutateChapters,
        chapterActionsDependencies,
      );
    },

    refreshChapters: () => {
      const state = get();
      refreshChaptersAction({
        novel: state.novel,
        fetching: state.fetching,
        settingsSort: getSettingsSort(state.novelSettings),
        settingsFilter: getSettingsFilter(state.novelSettings),
        currentPage: state.pages[state.pageIndex] ?? '1',
        transformChapters,
        setChapters,
        deps: chapterActionsDependencies,
      });
    },
  };
};
