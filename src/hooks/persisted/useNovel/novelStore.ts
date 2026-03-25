import { createStore, StoreApi } from 'zustand/vanilla';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import {
  bookmarkChaptersAction,
  ChapterActionsDependencies,
  defaultChapterActionsDependencies,
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
import {
  bootstrapService as defaultBootstrapService,
  createBootstrapService,
} from './bootstrapService';
import { BatchInfo, defaultNovelSettings, NovelSettings } from './types';

type ChapterTextValue = string | Promise<string>;

export interface ChapterTextCacheApi {
  read: (chapterId: number) => ChapterTextValue | undefined;
  write: (chapterId: number, value: ChapterTextValue) => void;
  remove: (chapterId: number) => boolean;
  clear: () => void;
}

export interface NovelStoreDependencies {
  bootstrapService: Pick<
    ReturnType<typeof createBootstrapService>,
    | 'bootstrapNovel'
    | 'getChaptersForPage'
    | 'getNextChapterBatch'
    | 'loadUpToBatch'
  >;
  chapterActionsDependencies: ChapterActionsDependencies;
  transformChapters: (chs: ChapterInfo[]) => ChapterInfo[];
}

export interface CreateNovelStoreParams {
  pluginId: string;
  novelPath: string;
  novel?: NovelInfo;
  defaultChapterSort?: ChapterOrderKey;
  initialPageIndex?: number;
  initialNovelSettings?: NovelSettings;
  dependencies?: Partial<NovelStoreDependencies>;
}

export interface NovelStoreState {
  loading: boolean;
  fetching: boolean;
  pluginId: string;
  novelPath: string;
  novel: NovelInfo | undefined;
  pageIndex: number;
  pages: string[];
  chapters: ChapterInfo[];
  firstUnreadChapter: ChapterInfo | undefined;
  batchInformation: BatchInfo;
  novelSettings: NovelSettings;
  chapterTextCache: ChapterTextCacheApi;

  bootstrapNovel: () => Promise<boolean>;
  getChapters: () => Promise<void>;
  getNextChapterBatch: () => Promise<void>;
  loadUpToBatch: (targetBatch: number) => Promise<void>;

  setNovel: (novel: NovelInfo | undefined) => void;
  setPages: (pages: string[]) => void;
  setPageIndex: (index: number) => void;
  openPage: (index: number) => Promise<void>;
  setNovelSettings: (settings: NovelSettings) => void;

  updateChapter: (index: number, update: Partial<ChapterInfo>) => void;
  setChapters: (chs: ChapterInfo[]) => void;
  extendChapters: (chs: ChapterInfo[]) => void;

  bookmarkChapters: (chapters: ChapterInfo[]) => void;
  markPreviouschaptersRead: (chapterId: number) => void;
  markChapterRead: (chapterId: number) => void;
  markChaptersRead: (chapters: ChapterInfo[]) => void;
  markPreviousChaptersUnread: (chapterId: number) => void;
  markChaptersUnread: (chapters: ChapterInfo[]) => void;
  updateChapterProgress: (chapterId: number, progress: number) => void;
  deleteChapter: (chapter: ChapterInfo) => void;
  deleteChapters: (chapters: ChapterInfo[]) => void;
  refreshChapters: () => void;
}

export type NovelStoreApi = StoreApi<NovelStoreState>;

export const createNovelStore = ({
  pluginId,
  novelPath,
  novel,
  defaultChapterSort = 'positionAsc',
  initialPageIndex = 0,
  initialNovelSettings = defaultNovelSettings,
  dependencies,
}: CreateNovelStoreParams): NovelStoreApi => {
  const deps: NovelStoreDependencies = {
    bootstrapService: dependencies?.bootstrapService ?? defaultBootstrapService,
    chapterActionsDependencies:
      dependencies?.chapterActionsDependencies ??
      defaultChapterActionsDependencies,
    transformChapters: dependencies?.transformChapters ?? (chs => chs),
  };

  const chapterTextCacheMap = new Map<number, ChapterTextValue>();
  const chapterTextCache: ChapterTextCacheApi = {
    read: chapterId => chapterTextCacheMap.get(chapterId),
    write: (chapterId, value) => {
      chapterTextCacheMap.set(chapterId, value);
    },
    remove: chapterId => chapterTextCacheMap.delete(chapterId),
    clear: () => {
      chapterTextCacheMap.clear();
    },
  };

  let inflightBootstrap: Promise<boolean> | null = null;

  return createStore<NovelStoreState>((set, get) => {
    const mutateChapters = (
      mutation: (chs: ChapterInfo[]) => ChapterInfo[],
    ) => {
      if (get().novel) {
        set(state => ({ chapters: mutation(state.chapters) }));
      }
    };

    const setChapters = (chs: ChapterInfo[]) => {
      set({ chapters: deps.transformChapters(chs) });
    };

    const getSettingsSort = (settings: NovelSettings): ChapterOrderKey =>
      settings.sort || defaultChapterSort;

    const getSettingsFilter = (settings: NovelSettings): ChapterFilterKey[] =>
      settings.filter ?? [];

    return {
      loading: true,
      fetching: false,
      pluginId,
      novelPath,
      novel,
      pageIndex: initialPageIndex,
      pages: [],
      chapters: [],
      firstUnreadChapter: undefined,
      batchInformation: {
        batch: 0,
        total: 0,
      },
      novelSettings: initialNovelSettings,
      chapterTextCache,

      bootstrapNovel: async () => {
        if (inflightBootstrap) {
          return inflightBootstrap;
        }

        inflightBootstrap = (async () => {
          set({ fetching: true });

          const state = get();
          const result = await deps.bootstrapService.bootstrapNovel({
            novel: state.novel,
            novelPath: state.novelPath,
            pluginId: state.pluginId,
            pageIndex: state.pageIndex,
            settingsSort: getSettingsSort(state.novelSettings),
            settingsFilter: getSettingsFilter(state.novelSettings),
          });

          if (!result.ok) {
            set({
              loading: false,
              fetching: false,
            });
            return false;
          }

          set({
            loading: false,
            fetching: false,
            novel: result.novel,
            pages: result.pages,
            chapters: deps.transformChapters(result.chapters),
            batchInformation: result.batchInformation,
            firstUnreadChapter: result.firstUnreadChapter,
          });

          return true;
        })().finally(() => {
          inflightBootstrap = null;
        });

        return inflightBootstrap;
      },

      getChapters: async () => {
        const state = get();
        if (!state.novel || state.pages.length === 0) {
          return;
        }

        set({ fetching: true });
        const result = await deps.bootstrapService.getChaptersForPage({
          novel: state.novel,
          novelPath: state.novelPath,
          pluginId: state.pluginId,
          pages: state.pages,
          pageIndex: state.pageIndex,
          settingsSort: getSettingsSort(state.novelSettings),
          settingsFilter: getSettingsFilter(state.novelSettings),
        });

        set({
          fetching: false,
          chapters: deps.transformChapters(result.chapters),
          batchInformation: result.batchInformation,
          firstUnreadChapter: result.firstUnreadChapter,
        });
      },

      getNextChapterBatch: async () => {
        const state = get();
        const result = await deps.bootstrapService.getNextChapterBatch({
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
          chapters: curr.chapters.concat(
            deps.transformChapters(result.chapters),
          ),
        }));
      },

      loadUpToBatch: async (targetBatch: number) => {
        const state = get();

        await deps.bootstrapService.loadUpToBatch({
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
              chapters: curr.chapters.concat(deps.transformChapters(chapters)),
            }));
          },
        });
      },

      setNovel: novelState => set({ novel: novelState }),
      setPages: pagesState => set({ pages: pagesState }),
      setPageIndex: index => set({ pageIndex: index }),
      openPage: async index => {
        set({ pageIndex: index });
        await get().getChapters();
      },
      setNovelSettings: settings => set({ novelSettings: settings }),

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
          chapters: state.chapters.concat(deps.transformChapters(chs)),
        }));
      },

      bookmarkChapters: chaptersState => {
        bookmarkChaptersAction(
          chaptersState,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      markPreviouschaptersRead: chapterId => {
        markPreviouschaptersReadAction(
          chapterId,
          get().novel,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      markChapterRead: chapterId => {
        markChapterReadAction(
          chapterId,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      markChaptersRead: chaptersState => {
        markChaptersReadAction(
          chaptersState,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      markPreviousChaptersUnread: chapterId => {
        markPreviousChaptersUnreadAction(
          chapterId,
          get().novel,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      markChaptersUnread: chaptersState => {
        markChaptersUnreadAction(
          chaptersState,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      updateChapterProgress: (chapterId, progress) => {
        updateChapterProgressAction(
          chapterId,
          progress,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      deleteChapter: chapter => {
        deleteChapterAction(
          chapter,
          get().novel,
          mutateChapters,
          deps.chapterActionsDependencies,
        );
      },
      deleteChapters: chaptersState => {
        deleteChaptersAction(
          chaptersState,
          get().novel,
          mutateChapters,
          deps.chapterActionsDependencies,
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
          transformChapters: deps.transformChapters,
          setChapters,
          deps: deps.chapterActionsDependencies,
        });
      },
    };
  });
};
