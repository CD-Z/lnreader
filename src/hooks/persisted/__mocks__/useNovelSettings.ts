export const NOVEL_PAGE_INDEX_PREFIX = 'NOVEL_PAGE_INDEX_PREFIX';
export const NOVEL_SETTINGS_PREFIX = 'NOVEL_SETTINGS';
export const LAST_READ_PREFIX = 'LAST_READ_PREFIX';

const defaultNovelSettings = {
  sort: undefined,
  filter: [],
  showChapterTitles: true,
};

const useNovelSettings = jest.fn(() => ({
  ...defaultNovelSettings,
  cycleChapterFilter: jest.fn(),
  setChapterFilter: jest.fn(),
  setChapterFilterValue: jest.fn(),
  getChapterFilterState: jest.fn(() => false),
  getChapterFilter: jest.fn(() => []),
  setChapterSort: jest.fn(),
  setShowChapterTitles: jest.fn(),
}));

export { useNovelSettings };
