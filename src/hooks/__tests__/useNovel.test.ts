import './mocks';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { fetchNovel } from '@services/plugin/fetch';
import {
  getNovelByPath,
  insertNovelAndChapters,
} from '@database/queries/NovelQueries';
import {
  getChapterCount,
  getPageChaptersBatched,
  getFirstUnreadChapter,
  bookmarkChapter as mockBookmarkChapter,
  markChapterRead as mockMarkChapterRead,
  markChaptersRead as mockMarkChaptersRead,
  markPreviuschaptersRead as mockMarkPreviuschaptersRead,
  markPreviousChaptersUnread as mockMarkPreviousChaptersUnread,
  markChaptersUnread as mockMarkChaptersUnread,
  deleteChapter as mockDeleteChapter,
  deleteChapters as mockDeleteChapters,
  insertChapters,
  getCustomPages,
} from '@database/queries/ChapterQueries';
import { useLibraryContext } from '@components/Context/LibraryContext';
import { useNovel } from '@hooks/persisted';
import { showToast } from '@utils/showToast';
import { ChapterInfo } from '@database/types';

const pluginId = 'mock-plugin';

const mockNovel = {
  id: 1,
  pluginId,
  path: '/mock/novel',
  name: 'Mock Novel',
  totalPages: 3,
  inLibrary: false,
  cover: null,
  summary: null,
  inLibrarySort: 0,
} as const;

const mockChapter: ChapterInfo = {
  id: 1,
  novelId: 1,
  name: 'Chapter 1',
  chapterNumber: 1,
  path: '/mock/chapter/1',
  page: '1',
  releaseTime: '2024-01-01',
  readTime: null,
  updatedTime: null,
  unread: true,
  bookmark: false,
  isDownloaded: false,
  progress: 0,
};

const createLibraryContextMock = (overrides = {}) => ({
  switchNovelToLibrary: jest.fn().mockResolvedValue(undefined),
  library: [],
  categories: [],
  isLoading: false,
  refetchLibrary: jest.fn(),
  setLibrary: jest.fn(),
  setCategories: jest.fn(),
  novelInLibrary: jest.fn(() => false),
  settings: {},
  ...overrides,
});

describe('useNovel hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLibraryContext as jest.Mock).mockImplementation(() =>
      createLibraryContextMock(),
    );
    (getChapterCount as jest.Mock).mockResolvedValue(10);
    (getPageChaptersBatched as jest.Mock).mockResolvedValue([mockChapter]);
    (getFirstUnreadChapter as jest.Mock).mockResolvedValue(mockChapter);
    (getCustomPages as jest.Mock).mockResolvedValue([]);
    (insertChapters as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('uses the provided NovelInfo immediately without fetching', () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      expect(result.current.novel).toEqual(mockNovel);
      expect(result.current.pages).toEqual(['1', '2', '3']);
    });

    it('initializes with empty chapters array', () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      expect(result.current.chapters).toEqual([]);
    });

    it('initializes with default batchInformation', () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      expect(result.current.batchInformation).toEqual({
        batch: 0,
        total: 0,
      });
    });

    it('generates pages from totalPages', () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      expect(result.current.pages.length).toBe(3);
      expect(result.current.pages).toContain('1');
      expect(result.current.pages).toContain('2');
      expect(result.current.pages).toContain('3');
    });
  });

  describe('getNovel', () => {
    it('fetches novel data via plugin when the novel is missing locally', async () => {
      (getNovelByPath as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockNovel);
      (fetchNovel as jest.Mock).mockResolvedValue(mockNovel);

      const { result } = renderHook(() => useNovel('/remote', pluginId));

      await act(async () => {
        await result.current.getNovel();
      });

      expect(fetchNovel).toHaveBeenCalledWith(pluginId, '/remote');
      expect(result.current.novel).toEqual(mockNovel);
      expect(result.current.pages).toEqual(['1', '2', '3']);
    });

    it('uses local novel data when available', async () => {
      (getNovelByPath as jest.Mock).mockResolvedValue(mockNovel);

      const { result } = renderHook(() => useNovel('/local', pluginId));

      await act(async () => {
        await result.current.getNovel();
      });

      expect(fetchNovel).not.toHaveBeenCalled();
      expect(result.current.novel).toEqual(mockNovel);
    });

    it('calls insertNovelAndChapters when fetching from source', async () => {
      (getNovelByPath as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockNovel);
      (fetchNovel as jest.Mock).mockResolvedValue(mockNovel);

      const { result } = renderHook(() => useNovel('/remote', pluginId));

      await act(async () => {
        await result.current.getNovel();
      });

      expect(insertNovelAndChapters).toHaveBeenCalledWith(pluginId, mockNovel);
    });

    it('returns undefined when novel not found after fetch', async () => {
      (getNovelByPath as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      (fetchNovel as jest.Mock).mockResolvedValue(mockNovel);

      const { result } = renderHook(() => useNovel('/not-found', pluginId));

      await act(async () => {
        const novel = await result.current.getNovel();
        expect(novel).toBeUndefined();
      });
    });
  });

  describe('getNextChapterBatch', () => {
    it('fetches next batch of chapters', async () => {
      (getChapterCount as jest.Mock).mockResolvedValue(600);

      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      (getPageChaptersBatched as jest.Mock).mockResolvedValue([
        { ...mockChapter, id: 2 },
      ]);

      await act(async () => {
        await result.current.getNextChapterBatch();
      });

      expect(getPageChaptersBatched).toHaveBeenCalled();
    });
  });

  describe('loadUpToBatch', () => {
    it('loads chapters up to target batch', async () => {
      (getChapterCount as jest.Mock).mockResolvedValue(900);

      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadUpToBatch(2);
      });

      expect(getPageChaptersBatched).toHaveBeenCalled();
    });
  });

  describe('followNovel', () => {
    it('invokes library context helper', async () => {
      const switchMock = jest.fn().mockResolvedValue(undefined);
      (useLibraryContext as jest.Mock).mockImplementation(() =>
        createLibraryContextMock({ switchNovelToLibrary: switchMock }),
      );

      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await act(async () => {
        await result.current.followNovel();
      });

      expect(switchMock).toHaveBeenCalledWith(mockNovel.path, pluginId);
    });

    it('toggles inLibrary status after follow', async () => {
      const switchMock = jest.fn().mockResolvedValue(undefined);
      (useLibraryContext as jest.Mock).mockImplementation(() =>
        createLibraryContextMock({ switchNovelToLibrary: switchMock }),
      );

      const novelNotInLibrary = { ...mockNovel, inLibrary: false };
      const { result } = renderHook(() =>
        useNovel(novelNotInLibrary, pluginId),
      );

      await act(async () => {
        await result.current.followNovel();
      });

      expect(result.current.novel?.inLibrary).toBe(true);
    });
  });

  describe('markChapterRead', () => {
    it('calls the database function', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markChapterRead(1);
      });

      expect(mockMarkChapterRead).toHaveBeenCalledWith(1);
    });

    it('updates chapter unread status in state', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markChapterRead(1);
      });

      const chapter = result.current.chapters.find(c => c.id === 1);
      expect(chapter?.unread).toBe(false);
    });
  });

  describe('markChaptersRead', () => {
    it('updates multiple chapters', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const chapters = [
        { ...mockChapter, id: 1 },
        { ...mockChapter, id: 2 },
      ];

      act(() => {
        result.current.markChaptersRead(chapters);
      });

      expect(mockMarkChaptersRead).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('markPreviouschaptersRead', () => {
    it('calls database function with chapterId and novelId', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markPreviouschaptersRead(5);
      });

      expect(mockMarkPreviuschaptersRead).toHaveBeenCalledWith(5, mockNovel.id);
    });
  });

  describe('markPreviousChaptersUnread', () => {
    it('calls database function with chapterId and novelId', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markPreviousChaptersUnread(5);
      });

      expect(mockMarkPreviousChaptersUnread).toHaveBeenCalledWith(
        5,
        mockNovel.id,
      );
    });
  });

  describe('markChaptersUnread', () => {
    it('updates multiple chapters', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const chapters = [
        { ...mockChapter, id: 1 },
        { ...mockChapter, id: 2 },
      ];

      act(() => {
        result.current.markChaptersUnread(chapters);
      });

      expect(mockMarkChaptersUnread).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('bookmarkChapters', () => {
    it('calls bookmarkChapter for each chapter', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.bookmarkChapters([mockChapter]);
      });

      expect(mockBookmarkChapter).toHaveBeenCalledWith(mockChapter.id);
    });

    it('toggles bookmark status in state', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.bookmarkChapters([mockChapter]);
      });

      const chapter = result.current.chapters.find(
        c => c.id === mockChapter.id,
      );
      expect(chapter?.bookmark).toBe(true);
    });
  });

  describe('updateChapter', () => {
    it('updates specific chapter in state', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateChapter(0, { name: 'Updated Chapter' });
      });

      expect(result.current.chapters[0]?.name).toBe('Updated Chapter');
    });

    it('does not update chapter when novel is not defined', () => {
      const { result } = renderHook(() => useNovel('/path', pluginId));

      act(() => {
        result.current.updateChapter(0, { name: 'Updated' });
      });

      expect(result.current.chapters).toEqual([]);
    });
  });

  describe('updateChapterProgress', () => {
    it('updates chapter progress in state', async () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateChapterProgress(1, 50);
      });

      const chapter = result.current.chapters.find(c => c.id === 1);
      expect(chapter?.progress).toBe(50);
    });
  });

  describe('deleteChapter', () => {
    it('calls database function and shows toast', async () => {
      (mockDeleteChapter as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteChapter(mockChapter);
      });

      await waitFor(() => {
        expect(mockDeleteChapter).toHaveBeenCalledWith(
          pluginId,
          mockNovel.id,
          mockChapter.id,
        );
      });

      expect(showToast).toHaveBeenCalled();
    });

    it('does not delete chapter when novel is not defined', () => {
      const { result } = renderHook(() => useNovel('/path', pluginId));

      act(() => {
        result.current.deleteChapter(mockChapter);
      });

      expect(mockDeleteChapter).not.toHaveBeenCalled();
    });
  });

  describe('deleteChapters', () => {
    it('shows toast with count', async () => {
      (mockDeleteChapters as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const chapters = [mockChapter, { ...mockChapter, id: 2 }];

      act(() => {
        result.current.deleteChapters(chapters);
      });

      expect(mockDeleteChapters).toHaveBeenCalledWith(
        pluginId,
        mockNovel.id,
        chapters,
      );
    });
  });

  describe('setNovel', () => {
    it('updates novel data', () => {
      const { result } = renderHook(() => useNovel(mockNovel, pluginId));

      const updatedNovel = { ...mockNovel, name: 'Updated Name' };

      act(() => {
        result.current.setNovel(updatedNovel);
      });

      expect(result.current.novel?.name).toBe('Updated Name');
    });
  });

  describe('loading states', () => {
    it('sets fetching to false after data is loaded', async () => {
      (getNovelByPath as jest.Mock).mockResolvedValue(mockNovel);

      const { result } = renderHook(() => useNovel('/path', pluginId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.fetching).toBe(false);
    });
  });
});
