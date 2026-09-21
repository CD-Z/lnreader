import { SELF_HOST_BACKUP } from '@hooks/persisted/useSelfHost';
import { OLD_TRACKED_NOVEL_PREFIX } from '@hooks/persisted/migrations/trackerMigration';
import { LAST_UPDATE_TIME } from '@hooks/persisted/useUpdates';
import { MMKVStorage } from '@utils/mmkv/mmkv';
import { version } from '../../../package.json';
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
import {
  BackupCategory,
  BackupNovel,
  type RestoredNovelMapping,
} from '@database/types';
import {
  BackupEntryName,
  type BackupManifest,
  type ResolvedBackupManifest,
} from './types';
import { NOVEL_STORAGE, ROOT_STORAGE } from '@utils/Storages';
import { BACKGROUND_TASKS_STORE_KEY } from '@services/backgroundTasks/constants';
import type { TaskProgressUpdater } from '@services/backgroundTasks/contracts';
import NativeFile from '@modules/native-file';
import { getString } from '@i18n/translations';
import type { RestoreResult } from './restoreResult';
import type { BackupResult } from './backupResult';
import {
  DEFAULT_BACKUP_OPTIONS,
  resolveBackupOptions,
  type BackupOptions,
} from './options';
import { INSTALLED_PLUGINS_KEY } from '@plugins/pluginManager';
import type { PluginItem } from '@plugins/types';

const APP_STORAGE_URI = 'file://' + ROOT_STORAGE;

const BACKUP_NOVEL_BATCH_SIZE = 100;

const RESTORE_NOVEL_BATCH_SIZE = 100;

const BACKUP_FILE_CONCURRENCY = 8;

const stripUriSuffix = (uri: string) => uri.split(/[?#]/, 1)[0];

const parentDirectory = (path: string) =>
  path.slice(0, Math.max(0, path.lastIndexOf('/')));

const parsePluginList = (value: unknown): PluginItem[] => {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid installed plugin registry');
  }
  return parsed as PluginItem[];
};

export const CACHE_DIR_PATH =
  NativeFile.ExternalCachesDirectoryPath + '/BackupData';

export const clearBackupCache = async (cacheDirPath = CACHE_DIR_PATH) => {
  if (await NativeFile.exists(cacheDirPath)) {
    await NativeFile.unlink(cacheDirPath);
  }
};

const backupMMKVData = () => {
  const excludeKeys = [
    BACKGROUND_TASKS_STORE_KEY,
    OLD_TRACKED_NOVEL_PREFIX,
    SELF_HOST_BACKUP,
    LAST_UPDATE_TIME,
    INSTALLED_PLUGINS_KEY,
  ];
  const keys = MMKVStorage.getAllKeys().filter(
    key => !excludeKeys.includes(key),
  );
  const data = {} as any;
  for (const key of keys) {
    let value: number | string | boolean | undefined =
      MMKVStorage.getString(key);
    if (!value) {
      value = MMKVStorage.getBoolean(key);
    }
    if (key && value) {
      data[key] = value;
    }
  }
  return data;
};

const restoreMMKVData = (data: any) => {
  for (const key in data) {
    MMKVStorage.set(key, data[key]);
  }
};

export const prepareBackupData = async (
  cacheDirPath: string,
  requestedOptions?: BackupOptions,
  formatVersion: BackupManifest['formatVersion'] = 2,
): Promise<BackupResult> => {
  const options = resolveBackupOptions(requestedOptions);
  const novelDirPath = cacheDirPath + '/' + BackupEntryName.NOVEL_AND_CHAPTERS;
  const coversDirPath = cacheDirPath + '/' + BackupEntryName.COVERS;
  let failedNovelCount = 0;
  let failedSectionCount = 0;

  await clearBackupCache(cacheDirPath);
  await NativeFile.mkdir(cacheDirPath);

  // version
  const manifest: BackupManifest = {
    appVersion: version,
    formatVersion,
    sections: options,
  };
  await NativeFile.writeFile(
    cacheDirPath + '/' + BackupEntryName.VERSION,
    JSON.stringify(manifest),
  );

  // novels
  if (options.library) {
    await NativeFile.mkdir(novelDirPath);
    if (!options.downloadedFiles) {
      await NativeFile.mkdir(coversDirPath);
    }
    const novels = await getAllNovels();
    for (
      let start = 0;
      start < novels.length;
      start += BACKUP_NOVEL_BATCH_SIZE
    ) {
      const novelBatch = novels.slice(start, start + BACKUP_NOVEL_BATCH_SIZE);
      let chapters;
      try {
        chapters = await getAllNovelChaptersForBackup(
          novelBatch.map(novel => novel.id),
        );
      } catch {
        failedNovelCount += novelBatch.length;
        continue;
      }

      const chaptersByNovel = new Map<number, BackupNovel['chapters']>();
      for (const chapter of chapters) {
        const novelChapters = chaptersByNovel.get(chapter.novelId);
        if (novelChapters) {
          novelChapters.push(chapter);
        } else {
          chaptersByNovel.set(chapter.novelId, [chapter]);
        }
      }

      for (
        let fileStart = 0;
        fileStart < novelBatch.length;
        fileStart += BACKUP_FILE_CONCURRENCY
      ) {
        const fileBatch = novelBatch.slice(
          fileStart,
          fileStart + BACKUP_FILE_CONCURRENCY,
        );
        await Promise.all(
          fileBatch.map(async novel => {
            try {
              const novelChapters = chaptersByNovel.get(novel.id) ?? [];
              const backedUpChapters = options.downloadedFiles
                ? novelChapters
                : novelChapters.map(chapter => ({
                    ...chapter,
                    isDownloaded: false,
                  }));
              let cover = novel.cover;
              if (cover?.startsWith(APP_STORAGE_URI)) {
                if (options.downloadedFiles) {
                  cover = cover.replace(APP_STORAGE_URI, '');
                } else {
                  try {
                    await NativeFile.copyFile(
                      stripUriSuffix(cover),
                      coversDirPath + '/' + novel.id,
                    );
                    cover = cover.replace(APP_STORAGE_URI, '');
                  } catch {
                    cover = null;
                  }
                }
              }
              await NativeFile.writeFile(
                novelDirPath + '/' + novel.id + '.json',
                JSON.stringify({
                  chapters: backedUpChapters,
                  ...novel,
                  cover,
                }),
              );
            } catch {
              failedNovelCount++;
            }
          }),
        );
      }
    }

    // categories
    try {
      const categories = await getCategoriesFromDb();
      const novelCategories = await getAllNovelCategories();
      const novelIdsByCategory = new Map<number, number[]>();
      for (const novelCategory of novelCategories) {
        const novelIds = novelIdsByCategory.get(novelCategory.categoryId);
        if (novelIds) {
          novelIds.push(novelCategory.novelId);
        } else {
          novelIdsByCategory.set(novelCategory.categoryId, [
            novelCategory.novelId,
          ]);
        }
      }
      await NativeFile.writeFile(
        cacheDirPath + '/' + BackupEntryName.CATEGORY,
        JSON.stringify(
          categories.map(category => ({
            ...category,
            novelIds: novelIdsByCategory.get(category.id) ?? [],
          })),
        ),
      );
    } catch {
      failedSectionCount++;
    }
  }

  // settings
  if (options.settings) {
    try {
      await NativeFile.writeFile(
        cacheDirPath + '/' + BackupEntryName.SETTING,
        JSON.stringify(backupMMKVData()),
      );
    } catch {
      failedSectionCount++;
    }
  }

  // installed plugin registry
  if (options.plugins) {
    try {
      await NativeFile.writeFile(
        cacheDirPath + '/' + BackupEntryName.PLUGIN_METADATA,
        MMKVStorage.getString(INSTALLED_PLUGINS_KEY) ?? '[]',
      );
    } catch {
      failedSectionCount++;
    }
  }

  return {
    failedNovelCount,
    failedSectionCount,
  };
};

const getBackupManifest = async (
  cacheDirPath: string,
): Promise<ResolvedBackupManifest> => {
  try {
    const fileContent = await NativeFile.readFile(
      cacheDirPath + '/' + BackupEntryName.VERSION,
    );
    const data = JSON.parse(fileContent) as Partial<BackupManifest> & {
      version?: string;
    };
    if (
      (data.formatVersion === 2 || data.formatVersion === 3) &&
      data.sections
    ) {
      return {
        appVersion: data.appVersion ?? data.version ?? '',
        formatVersion: data.formatVersion,
        sections: resolveBackupOptions(data.sections),
      };
    }

    return {
      appVersion: data.version,
      formatVersion: 1,
      sections: DEFAULT_BACKUP_OPTIONS,
    };
  } catch {
    return {
      formatVersion: 1,
      sections: DEFAULT_BACKUP_OPTIONS,
    };
  }
};

const updateRestoreProgress = (
  setMeta: TaskProgressUpdater | undefined,
  progressText: string,
) => {
  setMeta?.(meta => ({
    ...meta,
    progressText,
  }));
};

type RestoreBenchmarkLogger = (message: string) => void;

export const restoreData = async (
  cacheDirPath: string,
  setMeta?: TaskProgressUpdater,
  benchmarkLog?: RestoreBenchmarkLogger,
): Promise<RestoreResult> => {
  const manifest = await getBackupManifest(cacheDirPath);
  benchmarkLog?.('restoreData:manifest:loaded');
  const novelDirPath = cacheDirPath + '/' + BackupEntryName.NOVEL_AND_CHAPTERS;
  const coversDirPath = cacheDirPath + '/' + BackupEntryName.COVERS;
  const pluginIds = new Set<string>();
  const novelIdMap = new Map<number, number>();
  const novelMappings: RestoredNovelMapping[] = [];
  const installedPluginsBeforeRestore = (() => {
    try {
      return parsePluginList(
        MMKVStorage.getString(INSTALLED_PLUGINS_KEY) ?? '[]',
      );
    } catch {
      return [];
    }
  })();
  let pluginsFromSettings: PluginItem[] = [];

  benchmarkLog?.('restoreData:novels:start');
  if (manifest.sections.library) {
    updateRestoreProgress(setMeta, getString('backupScreen.restoringNovels'));
  }
  let novelCount = 0;
  let failedCount = 0;
  let failedSectionCount = 0;
  let readMs = 0;
  let parseMs = 0;
  let databaseMs = 0;
  let coverMs = 0;

  if (!manifest.sections.library) {
    // Intentionally omitted from this backup.
  } else if (!(await NativeFile.exists(novelDirPath))) {
    failedSectionCount++;
  } else {
    try {
      const items = (await NativeFile.readDir(novelDirPath)).filter(
        item => !item.isDirectory,
      );
      const pendingNovels: BackupNovel[] = [];
      const restoreNovelBatchSize = RESTORE_NOVEL_BATCH_SIZE;
      const restoreNovelBatch = async () => {
        if (pendingNovels.length === 0) {
          return;
        }
        const batch = pendingNovels.splice(0, pendingNovels.length);
        let restoredNovels: {
          backupNovel: BackupNovel;
          mapping: RestoredNovelMapping;
        }[];
        const databaseStartedAt = performance.now();
        try {
          const mappings = await _restoreNovelsAndChapters(batch, {
            includeChapterMappings: manifest.sections.downloadedFiles,
          });
          if (mappings.length !== batch.length) {
            throw new Error('Restore returned incomplete novel mappings');
          }
          restoredNovels = batch.map((backupNovel, index) => ({
            backupNovel,
            mapping: mappings[index],
          }));
        } catch {
          restoredNovels = [];
          for (const backupNovel of batch) {
            try {
              restoredNovels.push({
                backupNovel,
                mapping: await _restoreNovelAndChapters(backupNovel, {
                  includeChapterMappings: manifest.sections.downloadedFiles,
                }),
              });
            } catch {
              failedCount++;
            }
          }
        } finally {
          databaseMs += performance.now() - databaseStartedAt;
        }

        const coverStartedAt = performance.now();
        for (
          let start = 0;
          start < restoredNovels.length;
          start += BACKUP_FILE_CONCURRENCY
        ) {
          const coverBatch = restoredNovels.slice(
            start,
            start + BACKUP_FILE_CONCURRENCY,
          );
          await Promise.all(
            coverBatch.map(async ({ backupNovel, mapping: novelMapping }) => {
              if (
                !manifest.sections.downloadedFiles &&
                backupNovel.cover?.startsWith(APP_STORAGE_URI)
              ) {
                const coverBackupPath = coversDirPath + '/' + backupNovel.id;
                if (await NativeFile.exists(coverBackupPath)) {
                  const coverPath = `${NOVEL_STORAGE}/${backupNovel.pluginId}/${novelMapping.restoredNovelId}/cover.png`;
                  await NativeFile.mkdir(parentDirectory(coverPath));
                  await NativeFile.copyFile(coverBackupPath, coverPath);
                }
              }
            }),
          );
        }
        coverMs += performance.now() - coverStartedAt;

        for (const { backupNovel, mapping: novelMapping } of restoredNovels) {
          novelMappings.push(novelMapping);
          novelIdMap.set(backupNovel.id, novelMapping.restoredNovelId);
          novelCount++;
        }
      };

      for (const [index, item] of items.entries()) {
        updateRestoreProgress(
          setMeta,
          getString('backupScreen.restoringNovelsProgress', {
            current: index + 1,
            total: items.length,
          }),
        );
        let fileContent: string;
        const readStartedAt = performance.now();
        try {
          fileContent = await NativeFile.readFile(item.path);
        } catch {
          failedCount++;
          continue;
        } finally {
          readMs += performance.now() - readStartedAt;
        }

        const parseStartedAt = performance.now();
        try {
          const backupNovel = JSON.parse(fileContent!) as BackupNovel;
          pluginIds.add(backupNovel.pluginId);

          if (backupNovel.cover && !backupNovel.cover.startsWith('http')) {
            backupNovel.cover = APP_STORAGE_URI + backupNovel.cover;
          }
          pendingNovels.push(backupNovel);
        } catch {
          failedCount++;
        } finally {
          parseMs += performance.now() - parseStartedAt;
        }

        if (pendingNovels.length >= restoreNovelBatchSize) {
          await restoreNovelBatch();
        }
      }
      await restoreNovelBatch();
      benchmarkLog?.(
        `restoreData:novels:done count=${novelCount} failed=${failedCount} readMs=${readMs.toFixed(
          1,
        )} parseMs=${parseMs.toFixed(1)} databaseMs=${databaseMs.toFixed(
          1,
        )} coverMs=${coverMs.toFixed(1)}`,
      );
    } catch {
      failedSectionCount++;
    }
  }

  benchmarkLog?.('restoreData:categories:start');
  if (manifest.sections.library) {
    updateRestoreProgress(
      setMeta,
      getString('backupScreen.restoringCategories'),
    );
  }
  const categoryFilePath = cacheDirPath + '/' + BackupEntryName.CATEGORY;
  let categoryCount = 0;
  let failedCategoryCount = 0;

  if (!manifest.sections.library) {
    // Intentionally omitted from this backup.
  } else if (!(await NativeFile.exists(categoryFilePath))) {
    failedSectionCount++;
  } else {
    try {
      const fileContent = await NativeFile.readFile(categoryFilePath);
      const categories: BackupCategory[] = JSON.parse(fileContent);

      for (const [index, category] of categories.entries()) {
        updateRestoreProgress(
          setMeta,
          getString('backupScreen.restoringCategoriesProgress', {
            current: index + 1,
            total: categories.length,
          }),
        );
        try {
          await _restoreCategory(
            {
              ...category,
              novelIds: category.novelIds.filter(novelId =>
                novelIdMap.has(novelId),
              ),
            },
            novelIdMap,
          );
          categoryCount++;
        } catch {
          failedCategoryCount++;
        }
      }
    } catch {
      failedSectionCount++;
    }
  }
  benchmarkLog?.(
    `restoreData:categories:done count=${categoryCount} failed=${failedCategoryCount}`,
  );

  benchmarkLog?.('restoreData:settings:start');
  if (manifest.sections.settings) {
    updateRestoreProgress(setMeta, getString('backupScreen.restoringSettings'));
  }
  const settingsFilePath = cacheDirPath + '/' + BackupEntryName.SETTING;
  let settingsRestored = !manifest.sections.settings;

  if (!manifest.sections.settings) {
    // Intentionally omitted from this backup.
  } else if (!(await NativeFile.exists(settingsFilePath))) {
    // Reported as a settings warning in the completion summary.
  } else {
    try {
      const fileContent = await NativeFile.readFile(settingsFilePath);
      const settingsData = JSON.parse(fileContent);
      if (INSTALLED_PLUGINS_KEY in settingsData) {
        pluginsFromSettings = parsePluginList(
          settingsData[INSTALLED_PLUGINS_KEY],
        );
        delete settingsData[INSTALLED_PLUGINS_KEY];
      }
      restoreMMKVData(settingsData);
      settingsRestored = true;
    } catch {
      // Included in the completion warning below.
    }
  }
  benchmarkLog?.(`restoreData:settings:done restored=${settingsRestored}`);

  benchmarkLog?.('restoreData:plugins:start');
  let restoredPlugins = pluginsFromSettings;
  if (manifest.sections.plugins) {
    if (manifest.formatVersion === 2 || manifest.formatVersion === 3) {
      const pluginMetadataPath =
        cacheDirPath + '/' + BackupEntryName.PLUGIN_METADATA;
      if (!(await NativeFile.exists(pluginMetadataPath))) {
        failedSectionCount++;
      } else {
        try {
          restoredPlugins = parsePluginList(
            await NativeFile.readFile(pluginMetadataPath),
          );
        } catch {
          failedSectionCount++;
        }
      }
    }
    const mergedPlugins = [
      ...new Map(
        [...installedPluginsBeforeRestore, ...restoredPlugins].map(plugin => [
          plugin.id,
          plugin,
        ]),
      ).values(),
    ];
    MMKVStorage.set(INSTALLED_PLUGINS_KEY, JSON.stringify(mergedPlugins));
  }
  benchmarkLog?.(`restoreData:plugins:done count=${restoredPlugins.length}`);
  benchmarkLog?.('restoreData:done');

  return {
    novelCount,
    failedNovelCount: failedCount,
    categoryCount,
    failedCategoryCount,
    settingsRestored,
    failedSectionCount,
    pluginIds: [...pluginIds],
    novelMappings,
    manifest,
  };
};
