import '../../../__tests__/mocks';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import {
  createBootstrapService,
  BootstrapServiceDependencies,
} from '../store-helper/bootstrapService';

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

const mockChapters: ChapterInfo[] = [
  makeChapter(1),
  makeChapter(2),
  makeChapter(3),
];

const createDeps = () => {
  const deps: jest.Mocked<BootstrapServiceDependencies> = {
    getCustomPages: jest.fn().mockResolvedValue([]),
    getNovelByPath: jest.fn().mockReturnValue(mockNovel),
    fetchNovel: jest.fn(),
    insertNovelAndChapters: jest.fn().mockResolvedValue(undefined),
    getChapterCount: jest.fn().mockResolvedValue(mockChapters.length),
    getPageChaptersBatched: jest.fn().mockResolvedValue(mockChapters),
    fetchPage: jest.fn(),
    insertChapters: jest.fn().mockResolvedValue(undefined),
    getPageChapters: jest.fn().mockResolvedValue(mockChapters),
    getFirstUnreadChapter: jest.fn().mockResolvedValue(mockChapters[0]),
  };

  return deps;
};

describe('bootstrapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success payload from db-first branch', async () => {
    const deps = createDeps();
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
    expect(deps.getNovelByPath).toHaveBeenCalledWith(NOVEL_PATH, PLUGIN_ID);
    expect(deps.getChapterCount).toHaveBeenCalledWith(mockNovel.id, '1');
  });

  it('falls back to source page and inserts chapters when db count is 0', async () => {
    const deps = createDeps();
    deps.getChapterCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(mockChapters.length);
    deps.fetchPage.mockResolvedValue({
      chapters: mockChapters.map(ch => ({ ...ch, page: null })),
    } as never);
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

    expect(deps.fetchPage).toHaveBeenCalledWith(PLUGIN_ID, NOVEL_PATH, '1');
    expect(deps.insertChapters).toHaveBeenCalled();
    expect(deps.getPageChapters).toHaveBeenCalledWith(
      mockNovel.id,
      settingsSort,
      settingsFilter,
      '1',
    );
    expect(result.batchInformation.totalChapters).toBe(mockChapters.length);
  });

  it('returns missing-novel when source insert path still resolves no novel', async () => {
    const deps = createDeps();
    deps.getNovelByPath.mockReturnValue(undefined);
    deps.fetchNovel.mockResolvedValue({ ...mockNovel, chapters: [] } as never);
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
    const deps = createDeps();
    deps.getChapterCount.mockRejectedValue(new Error('db failed'));
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
    const deps = createDeps();
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
    expect(deps.getChapterCount).toHaveBeenCalledTimes(1);
  });
});
