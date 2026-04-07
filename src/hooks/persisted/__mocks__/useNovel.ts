export const NOVEL_PAGE_INDEX_PREFIX = 'NOVEL_PAGE_INDEX_PREFIX';
export const NOVEL_SETTINGS_PREFIX = 'NOVEL_SETTINGS';
export const LAST_READ_PREFIX = 'LAST_READ_PREFIX';
export const defaultPageIndex = 0;
export const defaultNovelSettings = {
  filter: [],
  showChapterTitles: true,
};

type ChapterTextValue = string | Promise<string>;

const createChapterTextCache = () => {
  const cache = new Map<number, ChapterTextValue>();

  return {
    read: jest.fn((chapterId: number) => cache.get(chapterId)),
    write: jest.fn((chapterId: number, value: ChapterTextValue) => {
      cache.set(chapterId, value);
    }),
    remove: jest.fn((chapterId: number) => cache.delete(chapterId)),
    clear: jest.fn(() => cache.clear()),
  };
};

const mockNovel = {
  id: 123,
  pluginId: 'mock-plugin',
  path: '/mock/path',
  name: 'Mock Novel',
  totalPages: 1,
};
const mockChapters: unknown[] = [];
const useNovel = jest.fn(() => ({
  pluginId: 'mock-plugin',
  novelPath: '/mock/path',
  loading: false,
  fetching: false,
  pageIndex: 0,
  pages: ['page-1'],
  novel: mockNovel,
  lastRead: null,
  firstUnreadChapter: null,
  chapters: mockChapters,
  novelSettings: {
    filter: [],
    showChapterTitles: true,
  },
  batchInformation: {
    batch: 1,
    total: 1,
  },
  chapterTextCache: createChapterTextCache(),
  bootstrapNovel: jest.fn().mockResolvedValue(true),
  getChapters: jest.fn().mockResolvedValue(undefined),
  getNextChapterBatch: jest.fn(),
  loadUpToBatch: jest.fn(),
  refreshNovel: jest.fn().mockResolvedValue(undefined),
  getNovel: jest.fn().mockResolvedValue(mockNovel),
  setPages: jest.fn(),
  setPageIndex: jest.fn(),
  openPage: jest.fn(),
  setNovel: jest.fn(),
  setNovelSettings: jest.fn(),
  setLastRead: jest.fn(),
  followNovel: jest.fn(),
  setChapters: jest.fn(),
  extendChapters: jest.fn(),
  bookmarkChapters: jest.fn(),
  markPreviouschaptersRead: jest.fn(),
  markChapterRead: jest.fn(),
  markChaptersRead: jest.fn(),
  markPreviousChaptersUnread: jest.fn(),
  markChaptersUnread: jest.fn(),
  refreshChapters: jest.fn(),
  updateChapter: jest.fn(),
  updateChapterProgress: jest.fn(),
  deleteChapter: jest.fn(),
  deleteChapters: jest.fn(),
}));
export const deleteCachedNovels = jest.fn();
export { mockNovel, mockChapters };
export { useNovel };
export default useNovel;
