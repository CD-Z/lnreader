import { act, renderHook } from '@testing-library/react-native';
import { useNovelSettings } from '../../useNovelSettings';

const mockUseNovelContext = jest.fn();

jest.mock('@screens/novel/NovelContext', () => ({
  useNovelContext: () => mockUseNovelContext(),
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

  it('uses selector-backed novelSettings state and actions', async () => {
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

    mockUseNovelContext.mockReturnValue({ novelStore });

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
  });
});
