import './mocks';
import { ChapterInfo, NovelInfo } from '@database/types';
import { createNovelStore } from '@hooks/persisted/useNovel/novelStore';
import { ChapterActionsDependencies } from '@hooks/persisted/useNovel/chapterActions';

const PLUGIN_ID = 'test-plugin';
const NOVEL_PATH = '/novels/test';

const mockNovel: NovelInfo = {
  id: 1,
  path: NOVEL_PATH,
  pluginId: PLUGIN_ID,
  name: 'Test Novel',
  inLibrary: false,
  totalPages: 2,
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

const createChapterDeps = (): jest.Mocked<ChapterActionsDependencies> => ({
  bookmarkChapter: jest.fn().mockResolvedValue(undefined),
  markChapterRead: jest.fn().mockResolvedValue(undefined),
  markChaptersRead: jest.fn().mockResolvedValue(undefined),
  markPreviuschaptersRead: jest.fn().mockResolvedValue(undefined),
  markPreviousChaptersUnread: jest.fn().mockResolvedValue(undefined),
  markChaptersUnread: jest.fn().mockResolvedValue(undefined),
  updateChapterProgress: jest.fn().mockResolvedValue(undefined),
  deleteChapter: jest.fn().mockResolvedValue(undefined),
  deleteChapters: jest.fn().mockResolvedValue(undefined),
  getPageChapters: jest.fn().mockResolvedValue([]),
  showToast: jest.fn(),
  getString: jest
    .fn<
      ReturnType<ChapterActionsDependencies['getString']>,
      Parameters<ChapterActionsDependencies['getString']>
    >()
    .mockImplementation(key => String(key)),
});

const createBootstrapDeps = () => {
  const chapters = [makeChapter(1), makeChapter(2)];
  return {
    bootstrapNovel: jest.fn().mockResolvedValue({
      ok: true as const,
      novel: mockNovel,
      pages: ['1', '2'],
      chapters,
      firstUnreadChapter: chapters[0],
      batchInformation: { batch: 0, total: 0, totalChapters: chapters.length },
    }),
    getChaptersForPage: jest.fn().mockResolvedValue({
      chapters: [makeChapter(20, { page: '2' })],
      firstUnreadChapter: makeChapter(20, { page: '2' }),
      batchInformation: { batch: 0, total: 0, totalChapters: 1 },
    }),
    getNextChapterBatch: jest.fn().mockResolvedValue(undefined),
    loadUpToBatch: jest.fn().mockResolvedValue(undefined),
  };
};

describe('createNovelStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bootstraps successfully and hydrates core state from bootstrapService', async () => {
    const bootstrapDeps = createBootstrapDeps();
    const chapterDeps = createChapterDeps();

    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
      dependencies: {
        bootstrapService: bootstrapDeps,
        chapterActionsDependencies: chapterDeps,
      },
    });

    const ok = await store.getState().bootstrapNovel();

    expect(ok).toBe(true);
    expect(bootstrapDeps.bootstrapNovel).toHaveBeenCalledTimes(1);
    expect(store.getState().loading).toBe(false);
    expect(store.getState().fetching).toBe(false);
    expect(store.getState().novel).toEqual(mockNovel);
    expect(store.getState().pages).toEqual(['1', '2']);
    expect(store.getState().chapters).toHaveLength(2);
    expect(store.getState().firstUnreadChapter?.id).toBe(1);
  });

  it('dedupes in-flight store bootstrap calls', async () => {
    const bootstrapDeps = createBootstrapDeps();
    const chapterDeps = createChapterDeps();

    let resolveBootstrap!: (value: any) => void;
    const pendingBootstrap = new Promise<any>(resolve => {
      resolveBootstrap = resolve;
    });
    bootstrapDeps.bootstrapNovel.mockReturnValue(pendingBootstrap);

    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
      dependencies: {
        bootstrapService: bootstrapDeps,
        chapterActionsDependencies: chapterDeps,
      },
    });

    const result1 = store.getState().bootstrapNovel();
    const result2 = store.getState().bootstrapNovel();

    expect(bootstrapDeps.bootstrapNovel).toHaveBeenCalledTimes(1);

    resolveBootstrap({
      ok: true,
      novel: mockNovel,
      pages: ['1'],
      chapters: [makeChapter(1)],
      firstUnreadChapter: makeChapter(1),
      batchInformation: { batch: 0, total: 0, totalChapters: 1 },
    });

    await expect(result1).resolves.toBe(true);
    await expect(result2).resolves.toBe(true);
  });

  it('openPage and setPageIndex preserve page switch semantics', async () => {
    const bootstrapDeps = createBootstrapDeps();
    const chapterDeps = createChapterDeps();

    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
      novel: mockNovel,
      dependencies: {
        bootstrapService: bootstrapDeps,
        chapterActionsDependencies: chapterDeps,
      },
    });

    store.getState().setPages(['1', '2']);
    store.getState().setPageIndex(0);

    await store.getState().openPage(1);

    expect(store.getState().pageIndex).toBe(1);
    expect(bootstrapDeps.getChaptersForPage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 1,
        pages: ['1', '2'],
      }),
    );

    store.getState().setPageIndex(0);
    expect(store.getState().pageIndex).toBe(0);
  });

  it('delegates chapter batch operations through bootstrapService composition boundary', async () => {
    const bootstrapDeps = createBootstrapDeps();
    const chapterDeps = createChapterDeps();

    bootstrapDeps.getNextChapterBatch.mockResolvedValue({
      chapters: [makeChapter(30, { page: '1' })],
      batch: 1,
    });

    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
      novel: mockNovel,
      dependencies: {
        bootstrapService: bootstrapDeps,
        chapterActionsDependencies: chapterDeps,
      },
    });

    store.getState().setPages(['1', '2']);
    await store.getState().getNextChapterBatch();
    await store.getState().loadUpToBatch(3);

    expect(bootstrapDeps.getNextChapterBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        novel: mockNovel,
        pages: ['1', '2'],
        pageIndex: 0,
      }),
    );
    expect(bootstrapDeps.loadUpToBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        targetBatch: 3,
        novel: mockNovel,
        pages: ['1', '2'],
        pageIndex: 0,
      }),
    );
  });

  it('delegates chapter actions to chapterActions helpers and keeps mutation parity', () => {
    const bootstrapDeps = createBootstrapDeps();
    const chapterDeps = createChapterDeps();

    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
      novel: mockNovel,
      dependencies: {
        bootstrapService: bootstrapDeps,
        chapterActionsDependencies: chapterDeps,
      },
    });

    store.getState().setChapters([makeChapter(1), makeChapter(2)]);
    store.getState().markChapterRead(1);

    expect(chapterDeps.markChapterRead).toHaveBeenCalledWith(1);
    expect(store.getState().chapters[0].unread).toBe(false);
    expect(store.getState().chapters[1].unread).toBe(true);
  });

  it('exposes synchronous chapterTextCache read/write/remove/clear API', () => {
    const store = createNovelStore({
      pluginId: PLUGIN_ID,
      novelPath: NOVEL_PATH,
    });

    const cache = store.getState().chapterTextCache;
    const prefetched = Promise.resolve('prefetched chapter');

    expect(cache.read(100)).toBeUndefined();

    cache.write(100, 'chapter text');
    cache.write(200, prefetched);

    expect(cache.read(100)).toBe('chapter text');
    expect(cache.read(200)).toBe(prefetched);
    expect(cache.remove(100)).toBe(true);
    expect(cache.read(100)).toBeUndefined();
    expect(cache.remove(999)).toBe(false);

    cache.clear();
    expect(cache.read(200)).toBeUndefined();
  });
});
