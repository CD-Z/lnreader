import './mocks';
import useNovelDefault, {
  LAST_READ_PREFIX,
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
  defaultNovelSettings as novelDefaultNovelSettings,
  defaultPageIndex,
  deleteCachedNovels,
  useNovel,
} from '@hooks/persisted/__mocks__/useNovel';
import {
  defaultNovelSettings as settingsDefaultNovelSettings,
  useNovelSettings,
} from '@hooks/persisted/__mocks__/useNovelSettings';
import {
  createMockNovelStore,
  createMockNovelStoreState,
  mockUseNovelContext,
} from './mocks';

describe('mock contracts (zustand novel architecture)', () => {
  it('useNovel mock exports persistence constants and compatibility helpers', () => {
    expect(NOVEL_PAGE_INDEX_PREFIX).toBe('NOVEL_PAGE_INDEX_PREFIX');
    expect(NOVEL_SETTINGS_PREFIX).toBe('NOVEL_SETTINGS');
    expect(LAST_READ_PREFIX).toBe('LAST_READ_PREFIX');
    expect(defaultPageIndex).toBe(0);
    expect(novelDefaultNovelSettings).toEqual({
      filter: [],
      showChapterTitles: true,
    });

    expect(typeof useNovel).toBe('function');
    expect(useNovelDefault).toBe(useNovel);
    expect(jest.isMockFunction(deleteCachedNovels)).toBe(true);
  });

  it('useNovel mock state includes store-era action and cache surface', () => {
    const state = useNovel();

    const requiredMembers = [
      'loading',
      'fetching',
      'pageIndex',
      'pages',
      'novel',
      'chapters',
      'firstUnreadChapter',
      'batchInformation',
      'novelSettings',
      'lastRead',
      'bootstrapNovel',
      'getChapters',
      'getNextChapterBatch',
      'loadUpToBatch',
      'refreshNovel',
      'setNovel',
      'setPages',
      'setPageIndex',
      'openPage',
      'setNovelSettings',
      'setLastRead',
      'followNovel',
      'updateChapter',
      'setChapters',
      'extendChapters',
      'bookmarkChapters',
      'markPreviouschaptersRead',
      'markChapterRead',
      'markChaptersRead',
      'markPreviousChaptersUnread',
      'markChaptersUnread',
      'updateChapterProgress',
      'deleteChapter',
      'deleteChapters',
      'refreshChapters',
      'chapterTextCache',
    ] as const;

    requiredMembers.forEach(member => {
      expect(state).toHaveProperty(member);
    });

    expect(state.chapterTextCache).toEqual(
      expect.objectContaining({
        read: expect.any(Function),
        write: expect.any(Function),
        remove: expect.any(Function),
        clear: expect.any(Function),
      }),
    );
  });

  it('useNovelSettings mock keeps settings API contract available', () => {
    const result = useNovelSettings();

    expect(settingsDefaultNovelSettings).toEqual({
      sort: undefined,
      filter: [],
      showChapterTitles: true,
    });

    [
      'sort',
      'filter',
      'showChapterTitles',
      'cycleChapterFilter',
      'setChapterFilter',
      'setChapterFilterValue',
      'getChapterFilterState',
      'getChapterFilter',
      'setChapterSort',
      'setShowChapterTitles',
    ].forEach(member => {
      expect(result).toHaveProperty(member);
    });
  });

  it('test harness mock context exposes subscribable novelStore boundary', () => {
    const state = createMockNovelStoreState();
    const store = createMockNovelStore();
    const context = mockUseNovelContext();

    [
      'bootstrapNovel',
      'getChapters',
      'getNextChapterBatch',
      'setPageIndex',
      'openPage',
      'setNovelSettings',
      'setLastRead',
      'updateChapter',
      'refreshChapters',
      'chapterTextCache',
    ].forEach(member => {
      expect(state).toHaveProperty(member);
    });

    expect(store).toEqual(
      expect.objectContaining({
        getState: expect.any(Function),
        setState: expect.any(Function),
        subscribe: expect.any(Function),
      }),
    );

    expect(context).toEqual(
      expect.objectContaining({
        novelStore: expect.objectContaining({
          getState: expect.any(Function),
          subscribe: expect.any(Function),
        }),
        navigationBarHeight: expect.any(Number),
        statusBarHeight: expect.any(Number),
      }),
    );
  });
});
