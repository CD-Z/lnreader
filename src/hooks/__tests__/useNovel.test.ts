import './mocks';
import { renderHook, act, waitFor } from '@test-utils';
import { useNovel, deleteCachedNovels } from '@hooks/persisted/useNovel';
import {
  getNovelByPath,
  insertNovelAndChapters,
  getCachedNovels as _getCachedNovels,
  deleteCachedNovels as _deleteCachedNovels,
} from '@database/queries/NovelQueries';
import {
  getChapterCount,
  getCustomPages,
  getPageChaptersBatched,
  insertChapters,
  getFirstUnreadChapter as _getFirstUnreadChapter,
  getPageChapters as _getPageChapters,
  markChapterRead as _markChapterRead,
  markChaptersRead as _markChaptersRead,
  markChaptersUnread as _markChaptersUnread,
  markPreviousChaptersUnread as _markPreviousChaptersUnread,
  markPreviuschaptersRead as _markPreviuschaptersRead,
  deleteChapter as _deleteChapter,
  deleteChapters as _deleteChapters,
  bookmarkChapter as _bookmarkChapter,
  updateChapterProgress as _updateChapterProgress,
} from '@database/queries/ChapterQueries';
import { fetchNovel, fetchPage } from '@services/plugin/fetch';
import NativeFile from '@specs/NativeFile';
import { NOVEL_STORAGE } from '@utils/Storages';
import { ChapterInfo, NovelInfo } from '@database/types';
import { MMKVStorage } from '@utils/mmkv/mmkv';

// --- fixtures ---

const PLUGIN_ID = 'test-plugin';

const mockNovel: NovelInfo = {
  id: 1,
  path: '/novel/test',
  pluginId: PLUGIN_ID,
  name: 'Test Novel',
  inLibrary: false,
  totalPages: 0,
};

const makeChapter = (id: number, overrides = {}): ChapterInfo => ({
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

const mockChapters = [makeChapter(1), makeChapter(2), makeChapter(3)];

// --- helpers ---

async function renderUseNovel(novelOrPath: string | NovelInfo = mockNovel) {
  const utils = renderHook(() => useNovel(novelOrPath, PLUGIN_ID));
  await waitFor(() => {
    expect(utils.result.current.fetching).toBe(false);
  });
  return utils;
}

// --- tests ---

describe('useNovel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MMKVStorage.clearAll();
    // Default happy-path mocks
    (getNovelByPath as jest.Mock).mockReturnValue(mockNovel);
    (getChapterCount as jest.Mock).mockResolvedValue(mockChapters.length);
    (getPageChaptersBatched as jest.Mock).mockResolvedValue(mockChapters);
    (_getFirstUnreadChapter as jest.Mock).mockResolvedValue(mockChapters[0]);
    (getCustomPages as jest.Mock).mockResolvedValue([]);
  });

  // #region initialization

  describe('initialization', () => {
    it('uses the passed NovelInfo object directly without fetching from DB', async () => {
      await renderUseNovel(mockNovel);

      await waitFor(() => {
        expect(getNovelByPath).not.toHaveBeenCalled();
      });
    });

    it('fetches novel from DB when a path string is passed', async () => {
      await renderUseNovel(mockNovel.path);

      await waitFor(() => {
        expect(getNovelByPath).toHaveBeenCalledWith(mockNovel.path, PLUGIN_ID);
      });
    });

    it('fetches from source and inserts when novel is not in DB', async () => {
      const sourceNovel = { ...mockNovel, chapters: mockChapters };
      (getNovelByPath as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockNovel);
      (fetchNovel as jest.Mock).mockResolvedValue(sourceNovel);

      await renderUseNovel(mockNovel.path);

      await waitFor(() => {
        expect(fetchNovel).toHaveBeenCalledWith(PLUGIN_ID, mockNovel.path);
        expect(insertNovelAndChapters).toHaveBeenCalledWith(
          PLUGIN_ID,
          sourceNovel,
        );
      });
    });

    it('throws when source fetch fails and novel is not in DB', async () => {
      (getNovelByPath as jest.Mock).mockReturnValue(null);
      (fetchNovel as jest.Mock).mockRejectedValue(new Error('network error'));

      const { result } = renderHook(() => useNovel(mockNovel.path, PLUGIN_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.novel).toBeUndefined();
    });

    it('sets loading to false after novel resolves', async () => {
      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets fetching to false after chapters load', async () => {
      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.fetching).toBe(false);
      });
    });

    it('populates chapters after load', async () => {
      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.chapters).toHaveLength(mockChapters.length);
      });
    });

    it('sets firstUnreadChapter', async () => {
      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.firstUnreadChapter?.id).toBe(mockChapters[0].id);
      });
    });
  });

  // #endregion
  // #region pages

  describe('pages', () => {
    it('builds numeric pages from totalPages when > 0', async () => {
      const pagedNovel = { ...mockNovel, totalPages: 3 };
      (getNovelByPath as jest.Mock).mockReturnValue(pagedNovel);

      const { result } = await renderUseNovel(pagedNovel.path);

      await waitFor(() => {
        expect(result.current.pages).toEqual(['1', '2', '3']);
      });
    });

    it('falls back to ["1"] when novel has no pages', async () => {
      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.pages).toEqual(['1']);
      });
    });

    it('reads custom pages from DB when totalPages is 0', async () => {
      (getCustomPages as jest.Mock).mockResolvedValue([
        { page: 'vol1' },
        { page: 'vol2' },
      ]);

      const { result } = await renderUseNovel();

      await waitFor(() => {
        expect(result.current.pages).toEqual(['vol1', 'vol2']);
      });
    });

    it('openPage updates pageIndex', async () => {
      const pagedNovel = { ...mockNovel, totalPages: 3 };
      (getNovelByPath as jest.Mock).mockReturnValue(pagedNovel);

      const { result } = await renderUseNovel(pagedNovel.path);

      act(() => result.current.openPage(2));
      await waitFor(() => expect(result.current.fetching).toBe(false));

      expect(result.current.pageIndex).toBe(2);

      act(() => result.current.openPage(0));
      await waitFor(() => expect(result.current.fetching).toBe(false));

      expect(result.current.pageIndex).toBe(0);
    });
  });

  // #endregion
  // #region chapter batching

  describe('chapter batching', () => {
    it('sets batchInformation.total based on chapter count', async () => {
      (getChapterCount as jest.Mock).mockResolvedValue(900);
      (getPageChaptersBatched as jest.Mock).mockResolvedValue([]);

      const { result } = await renderUseNovel();

      await waitFor(() => {
        // Math.floor(900 / 300) = 3
        expect(result.current.batchInformation.total).toBe(3);
      });
    });

    it('getNextChapterBatch appends chapters and increments batch', async () => {
      const batch1 = Array.from({ length: 2 }, (_, i) => makeChapter(i + 4));
      (getChapterCount as jest.Mock).mockResolvedValue(600);
      (getPageChaptersBatched as jest.Mock)
        .mockResolvedValueOnce(mockChapters) // initial load
        .mockResolvedValueOnce(batch1); // next batch

      const { result } = await renderUseNovel();

      expect(result.current.chapters).toHaveLength(mockChapters.length);

      await act(() => result.current.getNextChapterBatch());

      expect(result.current.chapters).toHaveLength(
        mockChapters.length + batch1.length,
      );
      expect(result.current.batchInformation.batch).toBe(1);
    });

    it('getNextChapterBatch does nothing when already at last batch', async () => {
      (getChapterCount as jest.Mock).mockResolvedValue(mockChapters.length);
      // total = Math.floor(3 / 300) = 0, so nextBatch(1) > total(0)

      const { result } = await renderUseNovel();

      const chaptersBefore = result.current.chapters.length;
      await act(() => result.current.getNextChapterBatch());

      expect(result.current.chapters).toHaveLength(chaptersBefore);
    });

    it('loadUpToBatch loads all intermediate batches sequentially', async () => {
      (getChapterCount as jest.Mock).mockResolvedValue(900);
      const batchChapter = makeChapter(99);
      (getPageChaptersBatched as jest.Mock).mockResolvedValue([batchChapter]);

      const { result } = await renderUseNovel();

      const initialChapterCount = result.current.chapters.length;

      await act(() => result.current.loadUpToBatch(3));

      expect(result.current.batchInformation.batch).toBe(3);
      // 3 batches loaded, each returning 1 chapter
      expect(result.current.chapters.length).toBe(initialChapterCount + 3);
    });
  });

  // #endregion
  // #region fetching missing page from source

  describe('fetching missing page chapters from source', () => {
    it('fetches page from source when chapter count is 0 for that page', async () => {
      const pagedNovel = { ...mockNovel, totalPages: 2 };
      (getNovelByPath as jest.Mock).mockReturnValue(pagedNovel);
      (getChapterCount as jest.Mock)
        .mockResolvedValueOnce(0) // page 1 missing
        .mockResolvedValueOnce(2); // after insert
      (fetchPage as jest.Mock).mockResolvedValue({ chapters: mockChapters });
      (_getPageChapters as jest.Mock).mockResolvedValue(mockChapters);

      const { result } = await renderUseNovel(pagedNovel.path);

      await waitFor(() => expect(result.current.fetching).toBe(false));

      expect(fetchPage).toHaveBeenCalledWith(PLUGIN_ID, pagedNovel.path, '1');
      expect(insertChapters).toHaveBeenCalled();
    });
  });

  // #endregion
  // #region mark chapters

  describe('markChapterRead', () => {
    it('marks single chapter as read in state', async () => {
      const { result } = await renderUseNovel();

      act(() => result.current.markChapterRead(1));

      expect(_markChapterRead).toHaveBeenCalledWith(1);
      const ch = result.current.chapters.find(c => c.id === 1);
      expect(ch?.unread).toBe(false);
    });

    it('markChaptersRead marks multiple chapters', async () => {
      const { result } = await renderUseNovel();

      act(() =>
        result.current.markChaptersRead([mockChapters[0], mockChapters[1]]),
      );

      expect(_markChaptersRead).toHaveBeenCalledWith([1, 2]);
      result.current.chapters
        .filter(c => [1, 2].includes(c.id))
        .forEach(c => expect(c.unread).toBe(false));
    });

    it('markChaptersUnread marks multiple chapters', async () => {
      const readChapters = mockChapters.map(c => ({ ...c, unread: false }));
      (getPageChaptersBatched as jest.Mock).mockResolvedValue(readChapters);

      const { result } = await renderUseNovel();

      act(() => result.current.markChaptersUnread([readChapters[0]]));

      expect(_markChaptersUnread).toHaveBeenCalledWith([1]);
      expect(result.current.chapters.find(c => c.id === 1)?.unread).toBe(true);
    });

    it('markPreviouschaptersRead marks chapters with id <= given id', async () => {
      const { result } = await renderUseNovel();

      act(() => result.current.markPreviouschaptersRead(2));

      expect(_markPreviuschaptersRead).toHaveBeenCalledWith(2, mockNovel.id);
      result.current.chapters
        .filter(c => c.id <= 2)
        .forEach(c => expect(c.unread).toBe(false));
      expect(result.current.chapters.find(c => c.id === 3)?.unread).toBe(true);
    });

    it('markPreviousChaptersUnread marks chapters with id <= given id as unread', async () => {
      const { result } = await renderUseNovel();

      act(() => result.current.markPreviousChaptersUnread(2));

      expect(_markPreviousChaptersUnread).toHaveBeenCalledWith(2, mockNovel.id);
      result.current.chapters
        .filter(c => c.id <= 2)
        .forEach(c => expect(c.unread).toBe(true));
    });
  });

  // #endregion
  // #region bookmark

  describe('bookmarkChapters', () => {
    it('toggles bookmark state for given chapters', async () => {
      const { result } = await renderUseNovel();

      const before = result.current.chapters.find(c => c.id === 1)?.bookmark;

      act(() => result.current.bookmarkChapters([mockChapters[0]]));

      expect(_bookmarkChapter).toHaveBeenCalledWith(1);
      expect(result.current.chapters.find(c => c.id === 1)?.bookmark).toBe(
        !before,
      );
    });
  });

  // #endregion
  // #region progress

  describe('updateChapterProgress', () => {
    it('updates progress in state and caps at 100', async () => {
      const { result } = await renderUseNovel();

      act(() => result.current.updateChapterProgress(1, 150));

      expect(_updateChapterProgress).toHaveBeenCalledWith(1, 100);
      expect(result.current.chapters.find(c => c.id === 1)?.progress).toBe(150);
    });

    it('stores the raw progress value in state', async () => {
      const { result } = await renderUseNovel();

      act(() => result.current.updateChapterProgress(1, 42));

      expect(result.current.chapters.find(c => c.id === 1)?.progress).toBe(42);
    });
  });

  // #endregion
  // #region delete

  describe('deleteChapter / deleteChapters', () => {
    it('sets isDownloaded to false after deleteChapter', async () => {
      (_deleteChapter as jest.Mock).mockResolvedValue(undefined);
      const downloaded = mockChapters.map(c => ({ ...c, isDownloaded: true }));
      (getPageChaptersBatched as jest.Mock).mockResolvedValue(downloaded);

      const { result } = await renderUseNovel();

      act(() => result.current.deleteChapter(downloaded[0]));

      expect(_deleteChapter).toHaveBeenCalledWith(PLUGIN_ID, mockNovel.id, 1);
      await waitFor(() =>
        expect(
          result.current.chapters.find(c => c.id === 1)?.isDownloaded,
        ).toBe(false),
      );
    });

    it('sets isDownloaded to false for all deleted chapters', async () => {
      (_deleteChapters as jest.Mock).mockResolvedValue(undefined);
      const downloaded = mockChapters.map(c => ({ ...c, isDownloaded: true }));
      (getPageChaptersBatched as jest.Mock).mockResolvedValue(downloaded);

      const { result } = await renderUseNovel();

      act(() => result.current.deleteChapters([downloaded[0], downloaded[1]]));

      await waitFor(() =>
        [1, 2].forEach(id => {
          expect(
            result.current.chapters.find(c => c.id === id)?.isDownloaded,
          ).toBe(false);
        }),
      );
    });
  });

  // #endregion
  // #region followNovel

  describe('followNovel', () => {
    it('toggles inLibrary on the novel', async () => {
      const { switchNovelToLibrary } =
        require('@components/Context/LibraryContext').useLibraryContext();
      (switchNovelToLibrary as jest.Mock).mockResolvedValue(undefined);

      const { result } = await renderUseNovel();

      const before = result.current.novel?.inLibrary;

      act(() => result.current.followNovel());

      await waitFor(() =>
        expect(result.current.novel?.inLibrary).toBe(!before),
      );
    });
  });

  // #endregion
});

// #region deleteCachedNovels

describe('deleteCachedNovels', () => {
  const cachedNovels: NovelInfo[] = [
    { id: 10, pluginId: 'p1', path: '/n/1', name: 'N1', inLibrary: false },
    { id: 11, pluginId: 'p2', path: '/n/2', name: 'N2', inLibrary: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (_getCachedNovels as jest.Mock).mockResolvedValue(cachedNovels);
    (NativeFile.exists as jest.Mock).mockReturnValue(false);
  });

  it('unlinks novel directory when it exists on disk', async () => {
    (NativeFile.exists as jest.Mock).mockReturnValue(true);

    await deleteCachedNovels();

    for (const novel of cachedNovels) {
      const dir = `${NOVEL_STORAGE}/${novel.pluginId}/${novel.id}`;
      expect(NativeFile.unlink).toHaveBeenCalledWith(dir);
    }
  });

  it('does not call unlink when directory does not exist', async () => {
    (NativeFile.exists as jest.Mock).mockReturnValue(false);

    await deleteCachedNovels();

    expect(NativeFile.unlink).not.toHaveBeenCalled();
  });

  it('calls _deleteCachedNovels after cleanup', async () => {
    await deleteCachedNovels();

    expect(_deleteCachedNovels).toHaveBeenCalledTimes(1);
  });
});

// #endregion
