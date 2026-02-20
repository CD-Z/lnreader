import './mocks';
import { act, renderHook } from '@testing-library/react-native';
import { fetchNovel } from '@services/plugin/fetch';
import { getNovelByPath } from '@database/queries/NovelQueries';
import { useLibraryContext } from '@components/Context/LibraryContext';
import { useNovel } from '@hooks/persisted';

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

describe('useNovel hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLibraryContext as jest.Mock).mockReturnValue({
      switchNovelToLibrary: jest.fn().mockResolvedValue(undefined),
      library: [],
      categories: [],
      isLoading: false,
      refetchLibrary: jest.fn(),
      setLibrary: jest.fn(),
      setCategories: jest.fn(),
      novelInLibrary: jest.fn(() => false),
      settings: {},
    });
  });

  it('starts loading/fetching when given only a path', () => {
    const { result } = renderHook(() => useNovel('/missing-path', pluginId));

    expect(result.current.loading).toBe(true);
    expect(result.current.fetching).toBe(true);
    expect(result.current.novel).toBeUndefined();
    expect(result.current.pages).toEqual([]);
    expect(result.current.pageIndex).toBe(0);
  });

  it('uses the provided NovelInfo immediately', () => {
    const { result } = renderHook(() => useNovel(mockNovel, pluginId));

    expect(result.current.novel).toEqual(mockNovel);
    expect(result.current.pages).toEqual(['1', '2', '3']);
    expect(result.current.loading).toBe(true);
    expect(result.current.fetching).toBe(true);
  });

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

  it('followNovel invokes library context helper', async () => {
    const switchMock = jest.fn().mockResolvedValue(undefined);
    (useLibraryContext as jest.Mock).mockReturnValueOnce({
      switchNovelToLibrary: switchMock,
      library: [],
      categories: [],
      isLoading: false,
      refetchLibrary: jest.fn(),
      setLibrary: jest.fn(),
      setCategories: jest.fn(),
      novelInLibrary: jest.fn(() => false),
      settings: {},
    });

    const { result } = renderHook(() => useNovel(mockNovel, pluginId));

    await act(async () => {
      await result.current.followNovel();
    });

    expect(switchMock).toHaveBeenCalledWith(mockNovel.path, pluginId);
  });

  it('openPage updates the pageIndex and currentPage accordingly', () => {
    const { result } = renderHook(() => useNovel(mockNovel, pluginId));

    act(() => {
      result.current.openPage(2);
    });

    expect(result.current.pageIndex).toBe(2);
    expect(result.current.currentPage).toBe('3');
  });
});
