export const NOVEL_PAGE_INDEX_PREFIX = 'NOVEL_PAGE_INDEX_PREFIX';
export const NOVEL_SETTINGS_PREFIX = 'NOVEL_SETTINGS';
export const LAST_READ_PREFIX = 'LAST_READ_PREFIX';
const mockNovel = {
  id: 123,
  pluginId: 'mock-plugin',
  path: '/mock/path',
  name: 'Mock Novel',
  totalPages: 1,
};
const mockChapters: unknown[] = [];
const useNovel = jest.fn(() => ({
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
  getNextChapterBatch: jest.fn(),
  loadUpToBatch: jest.fn(),
  getNovel: jest.fn().mockResolvedValue(mockNovel),
  setPageIndex: jest.fn(),
  openPage: jest.fn(),
  setNovel: jest.fn(),
  setLastRead: jest.fn(),
  followNovel: jest.fn(),
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
