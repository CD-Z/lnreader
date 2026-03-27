import { createStore } from 'zustand/vanilla';
import { ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import {
  createNovelStoreActions,
  defaultNovelStoreActionsDependencies,
} from './novelStore.actions';
import { defaultNovelSettings, NovelSettings } from './types';
import { createInitialChapterSlice } from './novelStore.chapterState';
import {
  NovelStoreApi,
  NovelStoreDependencies,
  NovelStoreState,
} from './novelStore.types';
import { createNovelStoreChapterActions } from './novelStore.chapterActions';

export interface CreateNovelStoreParams {
  pluginId: string;
  novelPath: string;
  novel?: NovelInfo;
  defaultChapterSort?: ChapterOrderKey;
  initialPageIndex?: number;
  initialNovelSettings?: NovelSettings;
  initialLastRead?: ChapterInfo;
  dependencies?: Partial<NovelStoreDependencies>;
}

export const createNovelStore = ({
  pluginId,
  novelPath,
  novel,
  defaultChapterSort = 'positionAsc',
  initialPageIndex = 0,
  initialNovelSettings = defaultNovelSettings,
  initialLastRead,
  dependencies,
}: CreateNovelStoreParams): NovelStoreApi => {
  const deps: NovelStoreDependencies = {
    bootstrapService:
      dependencies?.bootstrapService ??
      defaultNovelStoreActionsDependencies.bootstrapService,
    chapterActionsDependencies:
      dependencies?.chapterActionsDependencies ??
      defaultNovelStoreActionsDependencies.chapterActionsDependencies,
    transformChapters:
      dependencies?.transformChapters ??
      defaultNovelStoreActionsDependencies.transformChapters,
    persistPageIndex: dependencies?.persistPageIndex,
    persistNovelSettings: dependencies?.persistNovelSettings,
    persistLastRead: dependencies?.persistLastRead,
    switchNovelToLibrary: dependencies?.switchNovelToLibrary,
  };

  const chapterSlice = createInitialChapterSlice();

  return createStore<NovelStoreState>()((set, get) => {
    const actions = {
      ...createNovelStoreActions({
        set,
        get,
        deps,
        defaultChapterSort,
      }),
      ...createNovelStoreChapterActions({
        set,
        get,
        bootstrapService: deps.bootstrapService,
        chapterActionsDependencies: deps.chapterActionsDependencies,
        transformChapters: deps.transformChapters,
        defaultChapterSort,
      }),
    };

    return {
      loading: true,
      fetching: false,
      pluginId,
      novelPath,
      novel,
      pageIndex: initialPageIndex,
      pages: [],
      ...chapterSlice,
      novelSettings: initialNovelSettings,
      lastRead: initialLastRead,

      actions,
    };
  });
};
