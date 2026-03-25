import { act, renderHook } from '@testing-library/react-native';
import { useNovelSettings } from '../../useNovelSettings';

const mockUseNovelContext = jest.fn();
const mockUseMMKVObject = jest.fn();

jest.mock('@screens/novel/NovelContext', () => ({
  useNovelContext: () => mockUseNovelContext(),
}));

jest.mock('react-native-mmkv', () => ({
  useMMKVObject: (...args: unknown[]) => mockUseMMKVObject(...args),
}));

jest.mock('../../useSettings', () => ({
  useAppSettings: () => ({
    defaultChapterSort: 'positionAsc',
  }),
}));

describe('useNovelSettings (task 10 settings boundary decouple)', () => {
  const baseNovel = {
    id: 1,
    path: '/novels/test',
    pluginId: 'plugin.test',
    name: 'Novel',
    inLibrary: false,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps compatibility fallback path (no novelStore) and persists chapter sort updates', async () => {
    const setNovelSettings = jest.fn();

    mockUseMMKVObject.mockReturnValue([
      {
        filter: ['downloaded'],
        showChapterTitles: false,
      },
      setNovelSettings,
    ]);
    mockUseNovelContext.mockReturnValue({ novel: baseNovel });

    const { result } = renderHook(() => useNovelSettings());

    await act(async () => {
      await result.current.setChapterSort('nameAsc');
    });

    expect(setNovelSettings).toHaveBeenCalledWith({
      showChapterTitles: false,
      sort: 'nameAsc',
      filter: ['downloaded'],
    });
    expect(setNovelSettings).toHaveBeenCalledTimes(1);
  });

  it('uses selector-backed novelSettings state and actions when novelStore is present', async () => {
    const setNovelSettings = jest.fn();
    const storeSetNovelSettings = jest.fn();
    const storeState = {
      novel: baseNovel,
      novelSettings: {
        sort: 'positionDesc',
        filter: ['read'],
        showChapterTitles: true,
      },
      setNovelSettings: storeSetNovelSettings,
    };
    const novelStore = {
      getState: () => storeState,
      subscribe: jest.fn(() => () => {}),
    };

    mockUseMMKVObject.mockReturnValue([
      {
        sort: 'nameAsc',
        filter: ['downloaded'],
        showChapterTitles: false,
      },
      setNovelSettings,
    ]);
    mockUseNovelContext.mockReturnValue({
      novel: baseNovel,
      novelStore,
    });

    const { result } = renderHook(() => useNovelSettings());

    expect(result.current.sort).toBe('positionDesc');
    expect(result.current.filter).toEqual(['read']);
    expect(result.current.showChapterTitles).toBe(true);

    await act(async () => {
      await result.current.setChapterSort('nameDesc');
    });

    expect(storeSetNovelSettings).toHaveBeenCalledWith({
      showChapterTitles: true,
      sort: 'nameDesc',
      filter: ['read'],
    });
    expect(storeSetNovelSettings).toHaveBeenCalledTimes(1);
    expect(setNovelSettings).toHaveBeenCalledWith({
      showChapterTitles: true,
      sort: 'nameDesc',
      filter: ['read'],
    });
    expect(setNovelSettings).toHaveBeenCalledTimes(1);
  });
});
