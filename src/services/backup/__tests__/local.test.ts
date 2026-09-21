import NativeFile from '@modules/native-file';
import NativeZipArchive from '@modules/native-zip-archive';
import { createBackup, restoreBackup } from '../local';
import { finalizeRestoredPlugins } from '../restoreResult';
import { prepareBackupData, restoreData } from '../utils';

jest.mock('../utils', () => ({
  CACHE_DIR_PATH: '/cache/BackupData',
  clearBackupCache: jest.fn(),
  prepareBackupData: jest.fn(),
  restoreData: jest.fn(),
}));

jest.mock('../restoreResult', () => ({
  finalizeRestoredPlugins: jest.fn(),
  getRestoreCompletionText: jest.fn(),
}));

jest.mock('../backupResult', () => ({
  getBackupCompletionText: jest.fn(() => 'Backup created'),
}));

jest.mock('@utils/Storages', () => ({
  NOVEL_STORAGE: '/storage/Novels',
  PLUGIN_STORAGE: '/storage/Plugins',
  ROOT_STORAGE: '/storage',
}));

jest.mock('@utils/sleep', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@i18n/translations', () => ({
  getString: (key: string) => key,
}));

describe('local selective backup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.mocked(prepareBackupData).mockReset();
    jest.mocked(restoreData).mockReset();
    jest.mocked(NativeZipArchive.zip).mockReset().mockResolvedValue(undefined);
    jest
      .mocked(NativeZipArchive.zipDirectories)
      .mockReset()
      .mockResolvedValue(undefined);
    jest
      .mocked(NativeZipArchive.unzip)
      .mockReset()
      .mockResolvedValue(undefined);
    jest.mocked(NativeFile.copyFile).mockReset().mockResolvedValue(undefined);
    jest.mocked(NativeFile.exists).mockReset().mockResolvedValue(false);
    jest.mocked(NativeFile.mkdir).mockReset().mockResolvedValue(undefined);
    jest.mocked(NativeFile.unlink).mockReset().mockResolvedValue(undefined);
    jest.mocked(NativeFile.readDir).mockReset().mockResolvedValue([]);
    jest.mocked(finalizeRestoredPlugins).mockReset().mockResolvedValue([]);
  });

  it('creates archives only for selected file sections', async () => {
    jest.mocked(prepareBackupData).mockResolvedValue({
      failedNovelCount: 0,
      failedSectionCount: 0,
    });
    jest.mocked(NativeZipArchive.zipDirectories).mockResolvedValue(undefined);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);

    await createBackup({
      destinationUri: 'content://backup.zip',
      options: {
        library: true,
        settings: true,
        plugins: true,
        downloadedFiles: false,
      },
    });

    expect(prepareBackupData).toHaveBeenCalledWith(
      '/cache/BackupData',
      {
        library: true,
        settings: true,
        plugins: true,
        downloadedFiles: false,
      },
      3,
    );
    expect(NativeZipArchive.zip).toHaveBeenCalledWith(
      '/storage/Plugins',
      '/cache/BackupData/plugins.zip',
    );
    expect(NativeZipArchive.zip).not.toHaveBeenCalledWith(
      '/storage/Novels',
      expect.any(String),
    );
    expect(NativeZipArchive.zipDirectories).toHaveBeenCalledWith(
      [{ path: '/cache/BackupData', prefix: '' }],
      '/cache/BackupData.zip',
    );
  });

  it('adds novel files to the v3 outer archive without a nested archive', async () => {
    jest.mocked(prepareBackupData).mockResolvedValue({
      failedNovelCount: 0,
      failedSectionCount: 0,
    });
    jest.mocked(NativeZipArchive.zip).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.zipDirectories).mockResolvedValue(undefined);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);

    await createBackup({
      destinationUri: 'content://backup.zip',
      options: {
        library: true,
        settings: true,
        plugins: true,
        downloadedFiles: true,
      },
    });

    expect(prepareBackupData).toHaveBeenCalledWith(
      '/cache/BackupData',
      {
        library: true,
        settings: true,
        plugins: true,
        downloadedFiles: true,
      },
      3,
    );
    expect(NativeZipArchive.zip).toHaveBeenCalledWith(
      '/storage/Plugins',
      '/cache/BackupData/plugins.zip',
    );
    expect(NativeZipArchive.zip).not.toHaveBeenCalledWith(
      '/storage/Novels',
      expect.any(String),
    );
    expect(NativeZipArchive.zipDirectories).toHaveBeenCalledWith(
      [
        { path: '/cache/BackupData', prefix: '' },
        { path: '/storage/Novels', prefix: 'NovelFiles' },
      ],
      '/cache/BackupData.zip',
    );
  });

  it('loads restored plugins after their archive is extracted', async () => {
    const restoreResult = {
      novelCount: 1,
      failedNovelCount: 0,
      categoryCount: 0,
      failedCategoryCount: 0,
      settingsRestored: true,
      failedSectionCount: 0,
      pluginIds: ['restored'],
      novelMappings: [],
      manifest: {
        appVersion: '2.1.0',
        formatVersion: 2 as const,
        sections: {
          library: true,
          settings: true,
          plugins: true,
          downloadedFiles: false,
        },
      },
    };
    jest.mocked(restoreData).mockResolvedValueOnce(restoreResult);
    jest.mocked(NativeFile.exists).mockResolvedValue(true);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.unzip).mockResolvedValue(undefined);
    jest.mocked(finalizeRestoredPlugins).mockResolvedValueOnce([]);

    await restoreBackup({ sourceUri: 'content://backup.zip' });

    expect(NativeZipArchive.unzip).toHaveBeenCalledWith(
      '/cache/BackupData/plugins.zip',
      '/storage/Plugins',
    );
    expect(finalizeRestoredPlugins).toHaveBeenCalledWith(restoreResult);
    expect(
      jest.mocked(finalizeRestoredPlugins).mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      jest.mocked(NativeZipArchive.unzip).mock.invocationCallOrder[1],
    );
  });
  it('extracts the v1 downloaded archive into the legacy staging path', async () => {
    const restoreResult = {
      novelCount: 1,
      failedNovelCount: 0,
      categoryCount: 0,
      failedCategoryCount: 0,
      settingsRestored: true,
      failedSectionCount: 0,
      pluginIds: [],
      novelMappings: [],
      manifest: {
        appVersion: '1.0.0',
        formatVersion: 1 as const,
        sections: {
          library: true,
          settings: true,
          plugins: true,
          downloadedFiles: true,
        },
      },
    };
    jest.mocked(restoreData).mockResolvedValueOnce(restoreResult);
    jest.mocked(NativeFile.exists).mockResolvedValue(true);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.unzip).mockResolvedValue(undefined);
    jest.mocked(finalizeRestoredPlugins).mockResolvedValueOnce([]);

    await restoreBackup({ sourceUri: 'content://backup.zip' });

    expect(NativeZipArchive.unzip).toHaveBeenCalledWith(
      '/cache/BackupData/download.zip',
      '/cache/BackupData/RestoredLegacyFiles',
    );
    expect(NativeZipArchive.unzip).not.toHaveBeenCalledWith(
      '/cache/BackupData/novel-files.zip',
      expect.any(String),
    );
  });

  it('extracts the v2 novel-files archive into the novel staging path', async () => {
    const restoreResult = {
      novelCount: 1,
      failedNovelCount: 0,
      categoryCount: 0,
      failedCategoryCount: 0,
      settingsRestored: true,
      failedSectionCount: 0,
      pluginIds: [],
      novelMappings: [],
      manifest: {
        appVersion: '2.0.0',
        formatVersion: 2 as const,
        sections: {
          library: true,
          settings: false,
          plugins: true,
          downloadedFiles: true,
        },
      },
    };
    jest.mocked(restoreData).mockResolvedValueOnce(restoreResult);
    jest.mocked(NativeFile.exists).mockResolvedValue(true);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.unzip).mockResolvedValue(undefined);
    jest.mocked(finalizeRestoredPlugins).mockResolvedValueOnce([]);

    await restoreBackup({ sourceUri: 'content://backup.zip' });

    expect(NativeZipArchive.unzip).toHaveBeenCalledWith(
      '/cache/BackupData/novel-files.zip',
      '/cache/BackupData/RestoredNovelFiles',
    );
  });

  it('restores v3 novel files from the outer archive without nested extraction', async () => {
    const restoreResult = {
      novelCount: 1,
      failedNovelCount: 0,
      categoryCount: 0,
      failedCategoryCount: 0,
      settingsRestored: true,
      failedSectionCount: 0,
      pluginIds: [],
      novelMappings: [],
      manifest: {
        appVersion: '2.1.3',
        formatVersion: 3 as const,
        sections: {
          library: true,
          settings: false,
          plugins: true,
          downloadedFiles: true,
        },
      },
    };
    jest.mocked(restoreData).mockResolvedValueOnce(restoreResult);
    jest.mocked(NativeFile.exists).mockResolvedValue(true);
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.unzip).mockResolvedValue(undefined);
    jest.mocked(finalizeRestoredPlugins).mockResolvedValueOnce([]);

    await restoreBackup({ sourceUri: 'content://backup.zip' });

    expect(NativeZipArchive.unzip).toHaveBeenCalledWith(
      '/cache/BackupData/plugins.zip',
      '/storage/Plugins',
    );
    expect(NativeZipArchive.unzip).not.toHaveBeenCalledWith(
      '/cache/BackupData/novel-files.zip',
      expect.any(String),
    );
  });
  it('rejects a v3 downloaded-file restore without NovelFiles', async () => {
    const restoreResult = {
      novelCount: 1,
      failedNovelCount: 0,
      categoryCount: 0,
      failedCategoryCount: 0,
      settingsRestored: true,
      failedSectionCount: 0,
      pluginIds: [],
      novelMappings: [],
      manifest: {
        appVersion: '2.1.3',
        formatVersion: 3 as const,
        sections: {
          library: true,
          settings: false,
          plugins: false,
          downloadedFiles: true,
        },
      },
    };
    jest.mocked(restoreData).mockResolvedValueOnce(restoreResult);
    jest
      .mocked(NativeFile.exists)
      .mockImplementation(
        async path => path !== '/cache/BackupData/NovelFiles',
      );
    jest.mocked(NativeFile.copyFile).mockResolvedValue(undefined);
    jest.mocked(NativeZipArchive.unzip).mockResolvedValue(undefined);

    await expect(
      restoreBackup({ sourceUri: 'content://backup.zip' }),
    ).rejects.toThrow('backupScreen.invalidBackupFolder');
    expect(finalizeRestoredPlugins).not.toHaveBeenCalled();
  });
});
