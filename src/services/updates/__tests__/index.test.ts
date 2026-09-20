import {
  getLibraryNovelsForGlobalUpdate,
  getLibraryWithCategory,
} from '@database/queries/LibraryQueries';
import type { BackgroundTaskMetadata } from '@services/backgroundTasks/contracts';
import { getMMKVObject } from '@utils/mmkv/mmkv';
import { updateNovel } from '../LibraryUpdateQueries';
import { updateLibrary } from '../index';

jest.mock('@database/queries/LibraryQueries', () => ({
  getLibraryNovelsForGlobalUpdate: jest.fn(),
  getLibraryWithCategory: jest.fn(),
}));
jest.mock('../LibraryUpdateQueries', () => ({
  updateNovel: jest.fn(),
}));
jest.mock('@utils/sleep', () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));
jest.mock('@utils/showToast', () => ({
  showToast: jest.fn(),
}));
jest.mock('@utils/mmkv/mmkv', () => ({
  MMKVStorage: { set: jest.fn() },
  getMMKVObject: jest.fn(() => ({})),
}));
jest.mock('@hooks/persisted/useUpdates', () => ({
  LAST_UPDATE_TIME: 'LAST_UPDATE_TIME',
}));
jest.mock('@hooks/persisted/useSettings', () => ({
  APP_SETTINGS: 'APP_SETTINGS',
  getGlobalUpdateCategoryFilters: jest.fn(() => ({
    excludedCategoryIds: [],
    includedCategoryIds: [],
  })),
}));

const mockedGetLibraryNovels = jest.mocked(getLibraryNovelsForGlobalUpdate);
const mockedGetLibraryWithCategory = jest.mocked(getLibraryWithCategory);
const mockedUpdateNovel = jest.mocked(updateNovel);
const mockedGetMMKVObject = jest.mocked(getMMKVObject);

type LibraryNovel = Awaited<
  ReturnType<typeof getLibraryNovelsForGlobalUpdate>
>[number];

const novel = (id: number, pluginId: string, name: string): LibraryNovel =>
  ({
    id,
    pluginId,
    name,
    path: `/${name}`,
  } as LibraryNovel);

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('updateLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMMKVObject.mockReturnValue({});
  });

  it('updates at most three different sources while keeping each source sequential', async () => {
    const novels = [
      novel(1, 'source-a', 'A One'),
      novel(2, 'source-a', 'A Two'),
      novel(3, 'source-b', 'B One'),
      novel(4, 'source-c', 'C One'),
      novel(5, 'source-d', 'D One'),
    ];
    mockedGetLibraryNovels.mockResolvedValue(novels);

    const completions = new Map<number, () => void>();
    mockedUpdateNovel.mockImplementation(
      (_pluginId, _path, novelId) =>
        new Promise<void>(resolve => completions.set(novelId, resolve)),
    );

    let metadata: BackgroundTaskMetadata = {
      name: 'Update library',
      isRunning: false,
      progress: undefined,
      progressText: undefined,
    };
    const progressSnapshots: BackgroundTaskMetadata[] = [];
    const setMeta = (
      transform: (meta: BackgroundTaskMetadata) => BackgroundTaskMetadata,
    ) => {
      metadata = transform(metadata);
      progressSnapshots.push(metadata);
    };

    const updatePromise = updateLibrary({}, setMeta, jest.fn());
    await flushPromises();

    expect(mockedUpdateNovel.mock.calls.map(([pluginId]) => pluginId)).toEqual([
      'source-a',
      'source-b',
      'source-c',
    ]);
    expect(progressSnapshots.at(-1)?.progressText).toBe(
      ['A One', 'B One', 'C One'].join('\n'),
    );

    completions.get(3)?.();
    await flushPromises();
    expect(mockedUpdateNovel).toHaveBeenCalledTimes(4);
    expect(mockedUpdateNovel.mock.calls[3][0]).toBe('source-d');

    completions.get(1)?.();
    await flushPromises();
    expect(mockedUpdateNovel).toHaveBeenCalledTimes(5);
    expect(mockedUpdateNovel.mock.calls[4][0]).toBe('source-a');

    completions.get(2)?.();
    completions.get(4)?.();
    completions.get(5)?.();
    await updatePromise;

    expect(metadata).toMatchObject({
      isRunning: false,
      progress: 1,
      progressText: undefined,
    });
  });

  it('uses the category query when an update is category-scoped', async () => {
    mockedGetLibraryWithCategory.mockResolvedValue([]);

    await updateLibrary({ categoryId: 4 }, jest.fn(), jest.fn());

    expect(mockedGetLibraryWithCategory).toHaveBeenCalledWith(4, true);
    expect(mockedGetLibraryNovels).not.toHaveBeenCalled();
  });

  it('passes smart update preferences to the global update query', async () => {
    mockedGetMMKVObject.mockReturnValue({
      smartUpdateSkipCompleted: true,
      smartUpdateSkipUnstarted: true,
      smartUpdateSkipWithUnread: true,
    });
    mockedGetLibraryNovels.mockResolvedValue([]);

    await updateLibrary({}, jest.fn(), jest.fn());

    expect(mockedGetLibraryNovels).toHaveBeenCalledWith(
      {
        excludedCategoryIds: [],
        includedCategoryIds: [],
      },
      {
        skipCompleted: true,
        skipUnstarted: true,
        skipWithUnread: true,
      },
    );
  });
  it('batches library download tasks per source', async () => {
    mockedGetMMKVObject.mockReturnValue({ downloadNewChapters: true });
    const novels = Array.from({ length: 101 }, (_, index) =>
      novel(index + 1, 'source-a', `Novel ${index + 1}`),
    );
    mockedGetLibraryNovels.mockResolvedValue(novels);
    mockedUpdateNovel.mockImplementation(
      async (_pluginId, _path, novelId, options) => {
        options.enqueue?.({
          name: 'DOWNLOAD_CHAPTER',
          data: {
            novelName: `Novel ${novelId}`,
            novelId,
            pluginId: 'source-a',
            chapters: [
              {
                chapterId: novelId,
                chapterName: `Chapter ${novelId}`,
              },
            ],
          },
        });
      },
    );
    const enqueue = jest.fn();

    await updateLibrary({}, jest.fn(), enqueue);

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue.mock.calls[0][0]).toMatchObject({
      name: 'DOWNLOAD_CHAPTER',
      data: {
        pluginId: 'source-a',
        novelId: undefined,
        chapters: expect.arrayContaining([
          { chapterId: 1, chapterName: 'Chapter 1', novelId: 1 },
          { chapterId: 100, chapterName: 'Chapter 100', novelId: 100 },
        ]),
      },
    });
    expect(enqueue.mock.calls[0][0].data.chapters).toHaveLength(100);
    expect(enqueue.mock.calls[1][0].data.chapters).toEqual([
      { chapterId: 101, chapterName: 'Chapter 101', novelId: 101 },
    ]);
  });
});
