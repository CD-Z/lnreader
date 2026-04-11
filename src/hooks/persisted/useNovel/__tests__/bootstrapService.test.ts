import '../../../__tests__/mocks';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import {
  getChapterCount,
  getCustomPages,
  getFirstUnreadChapter,
  getPageChapters,
  getPageChaptersBatched,
  insertChapters,
} from '@database/queries/ChapterQueries';
import {
  getNovelByPath,
  insertNovelAndChapters,
} from '@database/queries/NovelQueries';
import { fetchNovel, fetchPage } from '@services/plugin/fetch';
import { createBootstrapService } from '../store-helper/bootstrapService';

const PLUGIN_ID = 'test-plugin';
const NOVEL_PATH = '/novels/test';

const settingsSort: ChapterOrderKey = 'positionAsc';
const settingsFilter: ChapterFilterKey[] = [];

const mockNovel: NovelInfo = {
  id: 1,
  path: NOVEL_PATH,
  pluginId: PLUGIN_ID,
  name: 'Test Novel',
  inLibrary: false,
  totalPages: 0,
};

const makeChapter = (id: number, overrides: Partial<ChapterInfo> = {}) => ({
  id,
  novelId: mockNovel.id,
  name: `Chapter ${id}`,
  path: `/chapter/${id}`,
  releaseTime: '2024-01-01',
  updatedTime: '2024-01-02',
  readTime: '2024-01-03',
  chapterNumber: id,
  unread: true,
  isDownloaded: false,
  bookmark: false,
  progress: 0,
  page: '1',
  ...overrides,
});

const mockChapters: ChapterInfo[] = [makeChapter(1), makeChapter(2), makeChapter(3)];

const mockGetCustomPages = getCustomPages as jest.MockedFunction<
  typeof getCustomPages
>;
const mockGetNovelByPath = getNovelByPath as jest.MockedFunction<
  typeof getNovelByPath
>;
const mockFetchNovel = fetchNovel as jest.MockedFunction<typeof fetchNovel>;
const mockInsertNovelAndChapters = insertNovelAndChapters as jest.MockedFunction<
  typeof insertNovelAndChapters
>;
const mockGetChapterCount = getChapterCount as jest.MockedFunction<
  typeof getChapterCount
>;
const mockGetPageChaptersBatched = getPageChaptersBatched as jest.MockedFunction<
  typeof getPageChaptersBatched
>;
const mockFetchPage = fetchPage as jest.MockedFunction<typeof fetchPage>;
const mockInsertChapters = insertChapters as jest.MockedFunction<
  typeof insertChapters
>;
const mockGetPageChapters = getPageChapters as jest.MockedFunction<
  typeof getPageChapters
>;
const mockGetFirstUnreadChapter = getFirstUnreadChapter as jest.MockedFunction<
  typeof getFirstUnreadChapter
>;

const setupDbFirstSuccess = () => {
  mockGetCustomPages.mockReturnValue([]);
  mockGetNovelByPath.mockReturnValue(mockNovel);
  mockGetChapterCount.mockResolvedValue(mockChapters.length);
  mockGetPageChaptersBatched.mockResolvedValue(mockChapters);
  mockGetFirstUnreadChapter.mockReturnValue(mockChapters[0]);
};

describe('bootstrapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'time').mockImplementation(() => {});
    jest.spyOn(console, 'timeEnd').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns success payload from db-first branch', async () => {
    setupDbFirstSuccess();
    const service = createBootstrapService();

    const result = await service.bootstrapNovelAsync({
      novel: undefined,
      novelPath: NOVEL_PATH,
      pluginId: PLUGIN_ID,
      pageIndex: 0,
      settingsSort,
      settingsFilter,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.novel).toEqual(mockNovel);
    expect(result.pages).toEqual(['1']);
    expect(result.chapters).toEqual(mockChapters);
    expect(result.firstUnreadChapter).toEqual(mockChapters[0]);
    expect(result.batchInformation).toEqual({
      batch: 0,
      total: 0,
      totalChapters: mockChapters.length,
    });
    expect(mockGetNovelByPath).toHaveBeenCalledWith(NOVEL_PATH, PLUGIN_ID);
    expect(mockGetChapterCount).toHaveBeenCalledWith(mockNovel.id, '1');
  });

  it('falls back to source page and inserts chapters when db count is 0', async () => {
    setupDbFirstSuccess();
    mockGetChapterCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(mockChapters.length);
    mockFetchPage.mockResolvedValue({
      chapters: mockChapters.map(ch => ({ ...ch, page: null })),
    } as never);
    mockGetPageChapters.mockResolvedValue(mockChapters);
    const service = createBootstrapService();

    const result = await service.bootstrapNovelAsync({
      novel: mockNovel,
      novelPath: NOVEL_PATH,
      pluginId: PLUGIN_ID,
      pageIndex: 0,
      settingsSort,
      settingsFilter,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(mockFetchPage).toHaveBeenCalledWith(PLUGIN_ID, NOVEL_PATH, '1');
    expect(mockInsertChapters).toHaveBeenCalled();
    expect(mockGetPageChapters).toHaveBeenCalledWith(
      mockNovel.id,
      settingsSort,
      settingsFilter,
      '1',
    );
    expect(result.batchInformation.totalChapters).toBe(mockChapters.length);
  });

  it('returns missing-novel when source insert path still resolves no novel', async () => {
    mockGetNovelByPath.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    mockFetchNovel.mockResolvedValue({ ...mockNovel, chapters: [] } as never);
    mockInsertNovelAndChapters.mockResolvedValue(undefined);
    const service = createBootstrapService();

    const result = await service.bootstrapNovelAsync({
      novel: undefined,
      novelPath: NOVEL_PATH,
      pluginId: PLUGIN_ID,
      pageIndex: 0,
      settingsSort,
      settingsFilter,
    });

    expect(result).toEqual({ ok: false, reason: 'missing-novel' });
  });

  it('returns error result when underlying data operation throws', async () => {
    setupDbFirstSuccess();
    mockGetChapterCount.mockRejectedValue(new Error('db failed'));
    const service = createBootstrapService();

    const result = await service.bootstrapNovelAsync({
      novel: mockNovel,
      novelPath: NOVEL_PATH,
      pluginId: PLUGIN_ID,
      pageIndex: 0,
      settingsSort,
      settingsFilter,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('error');
  });

  it('dedupes in-flight bootstrap per ${pluginId}_${novelPath}', async () => {
    setupDbFirstSuccess();
    mockGetChapterCount.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockChapters.length), 10)),
    );
    const service = createBootstrapService();

    const [result1, result2] = await Promise.all([
      service.bootstrapNovelAsync({
        novel: mockNovel,
        novelPath: NOVEL_PATH,
        pluginId: PLUGIN_ID,
        pageIndex: 0,
        settingsSort,
        settingsFilter,
      }),
      service.bootstrapNovelAsync({
        novel: mockNovel,
        novelPath: NOVEL_PATH,
        pluginId: PLUGIN_ID,
        pageIndex: 0,
        settingsSort,
        settingsFilter,
      }),
    ]);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    expect(mockGetChapterCount).toHaveBeenCalledTimes(1);
  });

  it('uses custom pages and selected page index when custom pages are available', async () => {
    setupDbFirstSuccess();
    mockGetCustomPages.mockReturnValue(
      [{ page: '1' }, { page: '3' }] as ReturnType<typeof getCustomPages>,
    );
    const service = createBootstrapService();

    const result = await service.bootstrapNovelAsync({
      novel: mockNovel,
      novelPath: NOVEL_PATH,
      pluginId: PLUGIN_ID,
      pageIndex: 1,
      settingsSort,
      settingsFilter,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.pages).toEqual(['1', '3']);
    expect(mockGetChapterCount).toHaveBeenCalledWith(mockNovel.id, '3');
    expect(mockGetPageChaptersBatched).toHaveBeenCalledWith(
      mockNovel.id,
      settingsSort,
      settingsFilter,
      '3',
    );
  });

  it('getNextChapterBatch loads the next batch when available', async () => {
    mockGetPageChaptersBatched.mockResolvedValue([makeChapter(10)]);
    const service = createBootstrapService();

    const result = await service.getNextChapterBatch({
      novel: mockNovel,
      pages: ['1'],
      pageIndex: 0,
      settingsSort,
      settingsFilter,
      batchInformation: { batch: 0, total: 2 },
    });

    expect(mockGetPageChaptersBatched).toHaveBeenCalledWith(
      mockNovel.id,
      settingsSort,
      settingsFilter,
      '1',
      1,
    );
    expect(result).toEqual({
      batch: 1,
      chapters: [expect.objectContaining({ id: 10 })],
    });
  });

  it('getNextChapterBatch returns undefined when at last batch', async () => {
    const service = createBootstrapService();

    const result = await service.getNextChapterBatch({
      novel: mockNovel,
      pages: ['1'],
      pageIndex: 0,
      settingsSort,
      settingsFilter,
      batchInformation: { batch: 1, total: 1 },
    });

    expect(result).toBeUndefined();
    expect(mockGetPageChaptersBatched).not.toHaveBeenCalled();
  });

  it('loadUpToBatch only loads until total batch count', async () => {
    mockGetPageChaptersBatched.mockResolvedValue([makeChapter(11)]);
    const onBatchLoaded = jest.fn();
    const service = createBootstrapService();

    await service.loadUpToBatch({
      targetBatch: 4,
      novel: mockNovel,
      pages: ['1'],
      pageIndex: 0,
      settingsSort,
      settingsFilter,
      batchInformation: { batch: 0, total: 1 },
      onBatchLoaded,
    });

    expect(mockGetPageChaptersBatched).toHaveBeenCalledTimes(1);
    expect(onBatchLoaded).toHaveBeenCalledWith(
      1,
      [expect.objectContaining({ id: 11 })],
    );
  });
});
