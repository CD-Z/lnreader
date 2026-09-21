import {
  _restoreNovelAndChapters,
  _restoreNovelsAndChapters,
  getAllNovels,
} from '@database/queries/NovelQueries';
import { getAllNovelChaptersForBackup } from '@database/queries/ChapterQueries';
import {
  _restoreCategory,
  getAllNovelCategories,
  getCategoriesFromDb,
} from '@database/queries/CategoryQueries';
import NativeFile from '@modules/native-file';
import { MMKVStorage } from '@utils/mmkv/mmkv';
import { prepareBackupData, restoreData } from '../utils';
import type { BackupNovel, RestoredNovelMapping } from '@database/types';
import type { BackupOptions } from '../options';

jest.mock('@database/queries/NovelQueries', () => ({
  _restoreNovelAndChapters: jest.fn(),
  _restoreNovelsAndChapters: jest.fn(),
  getAllNovels: jest.fn(),
}));

jest.mock('@database/queries/ChapterQueries', () => ({
  getAllNovelChaptersForBackup: jest.fn(),
}));

jest.mock('@database/queries/CategoryQueries', () => ({
  _restoreCategory: jest.fn(),
  getAllNovelCategories: jest.fn(),
  getCategoriesFromDb: jest.fn(),
}));

jest.mock('@hooks/persisted/useSelfHost', () => ({
  SELF_HOST_BACKUP: 'SELF_HOST_BACKUP',
}));

jest.mock('@hooks/persisted/migrations/trackerMigration', () => ({
  OLD_TRACKED_NOVEL_PREFIX: 'OLD_TRACKED_NOVEL_PREFIX',
}));

jest.mock('@hooks/persisted/useUpdates', () => ({
  LAST_UPDATE_TIME: 'LAST_UPDATE_TIME',
}));

jest.mock('@utils/mmkv/mmkv', () => ({
  MMKVStorage: {
    getAllKeys: jest.fn(() => []),
    getBoolean: jest.fn(),
    getString: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@i18n/translations', () => ({
  getString: (key: string) => key,
}));

jest.mock('@plugins/pluginManager', () => ({
  INSTALLED_PLUGINS_KEY: 'INSTALL_PLUGINS',
}));

jest.mock('@utils/Storages', () => ({
  NOVEL_STORAGE: '/storage/Novels',
  ROOT_STORAGE: '/storage',
}));

const pluginOnlyOptions: BackupOptions = {
  library: false,
  settings: false,
  plugins: true,
  downloadedFiles: false,
};

describe('selective backup data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NativeFile.exists).mockResolvedValue(false);
    jest.mocked(NativeFile.mkdir).mockResolvedValue(undefined);
    jest.mocked(NativeFile.writeFile).mockResolvedValue(undefined);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(getAllNovels).mockResolvedValue([]);
    jest.mocked(getAllNovelChaptersForBackup).mockResolvedValue([]);
    jest.mocked(getCategoriesFromDb).mockResolvedValue([]);
    jest.mocked(getAllNovelCategories).mockResolvedValue([]);
    const restoreNovel = async (
      novel: BackupNovel,
    ): Promise<RestoredNovelMapping> => ({
      pluginId: novel.pluginId,
      backupNovelId: novel.id,
      restoredNovelId: novel.id,
      chapters: novel.chapters.map(chapter => ({
        backupChapterId: chapter.id,
        restoredChapterId: chapter.id,
      })),
    });
    jest.mocked(_restoreNovelAndChapters).mockImplementation(restoreNovel);
    jest
      .mocked(_restoreNovelsAndChapters)
      .mockImplementation(async (novels: BackupNovel[]) =>
        Promise.all(novels.map(restoreNovel)),
      );
  });

  it('writes the selected sections to the v2 manifest', async () => {
    await prepareBackupData('/cache', pluginOnlyOptions);

    expect(NativeFile.writeFile).toHaveBeenCalledTimes(2);
    expect(NativeFile.writeFile).toHaveBeenCalledWith(
      '/cache/Version.json',
      expect.stringContaining(
        '"sections":{"library":false,"settings":false,"plugins":true,"downloadedFiles":false}',
      ),
    );
    expect(getAllNovels).not.toHaveBeenCalled();
    expect(getCategoriesFromDb).not.toHaveBeenCalled();
    expect(NativeFile.writeFile).toHaveBeenCalledWith(
      '/cache/Plugins.json',
      '[]',
    );
  });

  it('accepts v3 section manifests', async () => {
    const options: BackupOptions = {
      library: false,
      settings: false,
      plugins: false,
      downloadedFiles: false,
    };
    jest.mocked(NativeFile.readFile).mockResolvedValueOnce(
      JSON.stringify({
        appVersion: '2.1.3',
        formatVersion: 3,
        sections: options,
      }),
    );

    const result = await restoreData('/cache');

    expect(result.manifest).toEqual({
      appVersion: '2.1.3',
      formatVersion: 3,
      sections: options,
    });
  });

  it('does not warn about sections intentionally omitted by the manifest', async () => {
    jest
      .mocked(NativeFile.readFile)
      .mockResolvedValueOnce(
        JSON.stringify({
          appVersion: '2.1.0',
          formatVersion: 2,
          sections: pluginOnlyOptions,
        }),
      )
      .mockResolvedValueOnce('[]');
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(async path => path.endsWith('/Plugins.json'));

    const result = await restoreData('/cache');

    expect(result).toMatchObject({
      failedNovelCount: 0,
      failedCategoryCount: 0,
      failedSectionCount: 0,
      settingsRestored: true,
      manifest: {
        formatVersion: 2,
        sections: pluginOnlyOptions,
      },
    });
    expect(_restoreNovelAndChapters).not.toHaveBeenCalled();
    expect(_restoreCategory).not.toHaveBeenCalled();
    expect(MMKVStorage.set).toHaveBeenCalledWith('INSTALL_PLUGINS', '[]');
  });

  it('merges restored plugins with the existing registry', async () => {
    const options: BackupOptions = {
      library: false,
      settings: true,
      plugins: true,
      downloadedFiles: false,
    };
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(
        async path =>
          path.endsWith('/Version.json') ||
          path.endsWith('/Setting.json') ||
          path.endsWith('/Plugins.json'),
      );
    jest.mocked(NativeFile.readFile).mockImplementation(async path => {
      if (path.endsWith('/Version.json')) {
        return JSON.stringify({
          appVersion: '2.1.0',
          formatVersion: 2,
          sections: options,
        });
      }
      if (path.endsWith('/Setting.json')) {
        return JSON.stringify({
          INSTALL_PLUGINS: JSON.stringify([
            { id: 'restored', name: 'Restored' },
          ]),
          THEME: 'dark',
        });
      }
      return JSON.stringify([{ id: 'restored', name: 'Restored' }]);
    });
    jest
      .mocked(MMKVStorage.getString)
      .mockReturnValueOnce(
        JSON.stringify([{ id: 'existing', name: 'Existing' }]),
      );

    await restoreData('/cache');

    expect(MMKVStorage.set).toHaveBeenCalledWith('THEME', 'dark');
    expect(MMKVStorage.set).toHaveBeenCalledWith(
      'INSTALL_PLUGINS',
      JSON.stringify([
        { id: 'existing', name: 'Existing' },
        { id: 'restored', name: 'Restored' },
      ]),
    );
  });

  it('merges the plugin registry from legacy settings', async () => {
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(async path => path.endsWith('/Setting.json'));
    jest.mocked(NativeFile.readFile).mockImplementation(async path => {
      if (path.endsWith('/Version.json')) {
        return JSON.stringify({ version: '2.0.0' });
      }
      return JSON.stringify({
        INSTALL_PLUGINS: JSON.stringify([{ id: 'legacy', name: 'Legacy' }]),
      });
    });
    jest
      .mocked(MMKVStorage.getString)
      .mockReturnValueOnce(
        JSON.stringify([{ id: 'existing', name: 'Existing' }]),
      );

    await restoreData('/cache');

    expect(MMKVStorage.set).toHaveBeenCalledWith(
      'INSTALL_PLUGINS',
      JSON.stringify([
        { id: 'existing', name: 'Existing' },
        { id: 'legacy', name: 'Legacy' },
      ]),
    );
  });

  it('includes stored covers with library data when downloads are omitted', async () => {
    jest.mocked(getAllNovels).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Example',
        path: '/example',
        pluginId: 'source',
        cover: 'file:///storage/Novels/source/1/cover.png?123',
      },
    ]);
    jest.mocked(getAllNovelChaptersForBackup).mockResolvedValueOnce([
      {
        id: 10,
        novelId: 1,
        path: '/chapter-1',
        name: 'Chapter 1',
        isDownloaded: true,
      },
    ] as Awaited<ReturnType<typeof getAllNovelChaptersForBackup>>);

    await prepareBackupData('/cache', {
      library: true,
      settings: false,
      plugins: false,
      downloadedFiles: false,
    });

    const novelWrite = jest
      .mocked(NativeFile.writeFile)
      .mock.calls.find(([path]) => path.endsWith('/1.json'));
    expect(JSON.parse(novelWrite?.[1] ?? '{}')).toMatchObject({
      cover: '/Novels/source/1/cover.png?123',
      chapters: [{ id: 10, isDownloaded: false }],
    });
    expect(NativeFile.copyFile).toHaveBeenCalledWith(
      'file:///storage/Novels/source/1/cover.png',
      '/cache/Covers/1',
    );
  });

  it('does not duplicate covers when downloaded files are included', async () => {
    jest.mocked(getAllNovels).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Example',
        path: '/example',
        pluginId: 'source',
        cover: 'file:///storage/Novels/source/1/cover.png?123',
      },
    ]);

    jest.mocked(NativeFile.copyFile).mockClear();
    jest.mocked(NativeFile.mkdir).mockClear();

    await prepareBackupData('/cache', {
      library: true,
      settings: false,
      plugins: false,
      downloadedFiles: true,
    });

    const novelWrite = jest
      .mocked(NativeFile.writeFile)
      .mock.calls.find(([path]) => path.endsWith('/1.json'));
    expect(JSON.parse(novelWrite?.[1] ?? '{}')).toMatchObject({
      cover: '/Novels/source/1/cover.png?123',
    });
    expect(NativeFile.copyFile).not.toHaveBeenCalledWith(
      'file:///storage/Novels/source/1/cover.png',
      '/cache/Covers/1',
    );
    expect(NativeFile.mkdir).not.toHaveBeenCalledWith('/cache/Covers');
  });

  it('restores stored covers from library data and preserves missing covers', async () => {
    const options: BackupOptions = {
      library: true,
      settings: false,
      plugins: false,
      downloadedFiles: false,
    };
    jest.mocked(NativeFile.readFile).mockImplementation(async path => {
      if (path.endsWith('/Version.json')) {
        return JSON.stringify({
          appVersion: '2.1.2',
          formatVersion: 2,
          sections: options,
        });
      }
      if (path.endsWith('/1.json')) {
        return JSON.stringify({
          id: 1,
          name: 'Stored cover',
          path: '/stored-cover',
          pluginId: 'source',
          cover: '/Novels/source/1/cover.png?123',
          chapters: [],
        });
      }
      if (path.endsWith('/2.json')) {
        return JSON.stringify({
          id: 2,
          name: 'Missing cover',
          path: '/missing-cover',
          pluginId: 'source',
          cover: null,
          chapters: [],
        });
      }
      return '[]';
    });
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(async path =>
        [
          '/cache/NovelAndChapters',
          '/cache/Covers/1',
          '/cache/Category.json',
        ].includes(path),
      );
    jest.mocked(NativeFile.readDir).mockResolvedValue([
      {
        name: '1.json',
        path: '/cache/NovelAndChapters/1.json',
        isDirectory: false,
      },
      {
        name: '2.json',
        path: '/cache/NovelAndChapters/2.json',
        isDirectory: false,
      },
    ]);

    await restoreData('/cache');

    expect(NativeFile.copyFile).toHaveBeenCalledWith(
      '/cache/Covers/1',
      '/storage/Novels/source/1/cover.png',
    );
    expect(_restoreNovelsAndChapters).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 1,
          cover: 'file:///storage/Novels/source/1/cover.png?123',
        }),
        expect.objectContaining({ id: 2, cover: null }),
      ],
      { includeChapterMappings: false },
    );
    expect(_restoreNovelAndChapters).not.toHaveBeenCalled();
  });

  it('omits the installed-plugin registry when plugin files are excluded', async () => {
    jest
      .mocked(MMKVStorage.getAllKeys)
      .mockReturnValueOnce(['INSTALL_PLUGINS', 'OTHER_SETTING']);
    jest
      .mocked(MMKVStorage.getString)
      .mockImplementation(key =>
        key === 'INSTALL_PLUGINS'
          ? '[{"id":"source"}]'
          : key === 'OTHER_SETTING'
          ? 'kept'
          : undefined,
      );

    await prepareBackupData('/cache', {
      library: false,
      settings: true,
      plugins: false,
      downloadedFiles: false,
    });

    const settingsWrite = jest
      .mocked(NativeFile.writeFile)
      .mock.calls.find(([path]) => path.endsWith('/Setting.json'));
    expect(JSON.parse(settingsWrite?.[1] ?? '{}')).toEqual({
      OTHER_SETTING: 'kept',
    });
  });

  it('restores downloaded-file novels in one mapping-aware batch', async () => {
    const options: BackupOptions = {
      library: true,
      settings: false,
      plugins: false,
      downloadedFiles: true,
    };
    const novels: BackupNovel[] = [
      {
        id: 11,
        name: 'First',
        path: '/first',
        pluginId: 'source',
        chapters: [
          {
            id: 101,
            novelId: 11,
            name: 'First chapter',
            path: '/first/1',
            readTime: null,
            bookmark: null,
            unread: null,
            isDownloaded: true,
            updatedTime: null,
            page: null,
            progress: null,
            timeSpent: 0,
          },
        ],
      },
      {
        id: 22,
        name: 'Second',
        path: '/second',
        pluginId: 'source',
        chapters: [
          {
            id: 202,
            novelId: 22,
            name: 'Second chapter',
            path: '/second/1',
            readTime: null,
            bookmark: null,
            unread: null,
            isDownloaded: true,
            updatedTime: null,
            page: null,
            progress: null,
            timeSpent: 0,
          },
        ],
      },
    ];
    const mappings: RestoredNovelMapping[] = [
      {
        pluginId: 'source',
        backupNovelId: 11,
        restoredNovelId: 111,
        chapters: [{ backupChapterId: 101, restoredChapterId: 1001 }],
      },
      {
        pluginId: 'source',
        backupNovelId: 22,
        restoredNovelId: 222,
        chapters: [{ backupChapterId: 202, restoredChapterId: 2002 }],
      },
    ];
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(async path => path === '/cache/NovelAndChapters');
    jest.mocked(NativeFile.readDir).mockResolvedValue(
      novels.map(novel => ({
        name: `${novel.id}.json`,
        path: `/cache/NovelAndChapters/${novel.id}.json`,
        isDirectory: false,
      })),
    );
    jest.mocked(NativeFile.readFile).mockImplementation(async path => {
      if (path.endsWith('/Version.json')) {
        return JSON.stringify({
          appVersion: '2.1.3',
          formatVersion: 2,
          sections: options,
        });
      }
      const novel = novels.find(item => path.endsWith(`/${item.id}.json`));
      return JSON.stringify(novel ?? {});
    });
    jest.mocked(_restoreNovelsAndChapters).mockResolvedValueOnce(mappings);

    const result = await restoreData('/cache');

    expect(_restoreNovelsAndChapters).toHaveBeenCalledTimes(1);
    expect(_restoreNovelsAndChapters).toHaveBeenCalledWith(novels, {
      includeChapterMappings: true,
    });
    expect(_restoreNovelAndChapters).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      novelCount: 2,
      failedNovelCount: 0,
      novelMappings: mappings,
    });
  });

  it('retries each downloaded-file novel when its batch restore fails', async () => {
    const options: BackupOptions = {
      library: true,
      settings: false,
      plugins: false,
      downloadedFiles: true,
    };
    const novels: BackupNovel[] = [
      {
        id: 31,
        name: 'First',
        path: '/first',
        pluginId: 'source',
        chapters: [],
      },
      {
        id: 32,
        name: 'Second',
        path: '/second',
        pluginId: 'source',
        chapters: [],
      },
    ];
    const mappings: RestoredNovelMapping[] = novels.map((novel, index) => ({
      pluginId: novel.pluginId,
      backupNovelId: novel.id,
      restoredNovelId: novel.id + 100,
      chapters: [
        { backupChapterId: index + 1, restoredChapterId: index + 101 },
      ],
    }));
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(async path => path === '/cache/NovelAndChapters');
    jest.mocked(NativeFile.readDir).mockResolvedValue(
      novels.map(novel => ({
        name: `${novel.id}.json`,
        path: `/cache/NovelAndChapters/${novel.id}.json`,
        isDirectory: false,
      })),
    );
    jest.mocked(NativeFile.readFile).mockImplementation(async path => {
      if (path.endsWith('/Version.json')) {
        return JSON.stringify({
          appVersion: '2.1.3',
          formatVersion: 2,
          sections: options,
        });
      }
      const novel = novels.find(item => path.endsWith(`/${item.id}.json`));
      return JSON.stringify(novel ?? {});
    });
    jest
      .mocked(_restoreNovelsAndChapters)
      .mockRejectedValueOnce(new Error('batch failed'));
    jest
      .mocked(_restoreNovelAndChapters)
      .mockImplementation(
        async novel =>
          mappings.find(mapping => mapping.backupNovelId === novel.id)!,
      );

    const result = await restoreData('/cache');

    expect(_restoreNovelsAndChapters).toHaveBeenCalledWith(novels, {
      includeChapterMappings: true,
    });
    expect(_restoreNovelAndChapters).toHaveBeenNthCalledWith(1, novels[0], {
      includeChapterMappings: true,
    });
    expect(_restoreNovelAndChapters).toHaveBeenNthCalledWith(2, novels[1], {
      includeChapterMappings: true,
    });
    expect(result).toMatchObject({
      novelCount: 2,
      failedNovelCount: 0,
      novelMappings: mappings,
    });
  });

  it('treats backups without a section manifest as legacy full backups', async () => {
    jest
      .mocked(NativeFile.readFile)
      .mockResolvedValueOnce(JSON.stringify({ version: '2.0.0' }));

    const result = await restoreData('/cache');

    expect(result.manifest).toMatchObject({
      appVersion: '2.0.0',
      formatVersion: 1,
      sections: {
        library: true,
        settings: true,
        plugins: true,
        downloadedFiles: true,
      },
    });
  });
});
