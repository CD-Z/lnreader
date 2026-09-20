import {
  getLibraryNovelsForGlobalUpdate,
  getLibraryWithCategory,
} from '../../database/queries/LibraryQueries';

import { showToast } from '../../utils/showToast';
import { updateNovel, type UpdateNovelOptions } from './LibraryUpdateQueries';
import type { DBNovelInfo } from '@database/types';
import { sleep } from '@utils/sleep';
import { MMKVStorage, getMMKVObject } from '@utils/mmkv/mmkv';
import { LAST_UPDATE_TIME } from '@hooks/persisted/useUpdates';
import dayjs from 'dayjs';
import {
  APP_SETTINGS,
  AppSettings,
  getGlobalUpdateCategoryFilters,
} from '@hooks/persisted/useSettings';
import type {
  BackgroundTask,
  BackgroundTaskEnqueuer,
  DownloadChapterTask,
  TaskProgressUpdater,
} from '@services/backgroundTasks/contracts';

const UPDATE_SOURCE_CONCURRENCY = 3;

const groupNovelsByPlugin = (novels: DBNovelInfo[]) => {
  const groupedNovels = new Map<string, DBNovelInfo[]>();

  for (const novel of novels) {
    const pluginNovels = groupedNovels.get(novel.pluginId);
    if (pluginNovels) {
      pluginNovels.push(novel);
    } else {
      groupedNovels.set(novel.pluginId, [novel]);
    }
  }

  return [...groupedNovels.values()];
};
const MAX_DOWNLOAD_CHAPTERS_PER_TASK = 100;

const createDownloadBatcher = (enqueue: BackgroundTaskEnqueuer) => {
  const batches = new Map<string, DownloadChapterTask>();

  const enqueueTask = (tasks: BackgroundTask | BackgroundTask[]) => {
    for (const task of Array.isArray(tasks) ? tasks : [tasks]) {
      if (task.name !== 'DOWNLOAD_CHAPTER') {
        enqueue(task);
        continue;
      }

      const batchKey = task.data.pluginId || 'legacy';
      const batch = batches.get(batchKey) ?? {
        name: 'DOWNLOAD_CHAPTER',
        data: {
          ...task.data,
          novelId: undefined,
          chapters: [],
        },
      };
      batch.data.chapters.push(
        ...task.data.chapters.map(chapter => ({
          ...chapter,
          novelId: chapter.novelId ?? task.data.novelId,
        })),
      );

      while (batch.data.chapters.length >= MAX_DOWNLOAD_CHAPTERS_PER_TASK) {
        enqueue({
          ...batch,
          data: {
            ...batch.data,
            chapters: batch.data.chapters.splice(
              0,
              MAX_DOWNLOAD_CHAPTERS_PER_TASK,
            ),
          },
        });
      }

      if (batch.data.chapters.length) {
        batches.set(batchKey, batch);
      } else {
        batches.delete(batchKey);
      }
    }
  };

  const flush = () => {
    for (const batch of batches.values()) {
      enqueue(batch);
    }
    batches.clear();
  };

  return { enqueueTask, flush };
};

const updateLibrary = async (
  {
    categoryId,
  }: {
    categoryId?: number;
  },
  setMeta: TaskProgressUpdater,
  enqueue: BackgroundTaskEnqueuer,
) => {
  setMeta(meta => ({
    ...meta,
    isRunning: true,
    progress: 0,
  }));

  const {
    downloadNewChapters,
    refreshNovelMetadata,
    smartUpdateSkipCompleted,
    smartUpdateSkipUnstarted,
    smartUpdateSkipWithUnread,
  } = getMMKVObject<AppSettings>(APP_SETTINGS) || {};
  const smartUpdateFilters = {
    skipCompleted: Boolean(smartUpdateSkipCompleted),
    skipUnstarted: Boolean(smartUpdateSkipUnstarted),
    skipWithUnread: Boolean(smartUpdateSkipWithUnread),
  };
  const downloadBatcher = createDownloadBatcher(enqueue);
  const options: UpdateNovelOptions = {
    downloadNewChapters: downloadNewChapters || false,
    refreshNovelMetadata: refreshNovelMetadata || false,
    enqueue: downloadBatcher.enqueueTask,
  };

  try {
    let libraryNovels: DBNovelInfo[] = [];
    if (categoryId) {
      libraryNovels = await getLibraryWithCategory(categoryId, true);
    } else {
      libraryNovels = await getLibraryNovelsForGlobalUpdate(
        getGlobalUpdateCategoryFilters(),
        smartUpdateFilters,
      );
    }

    if (libraryNovels.length > 0) {
      MMKVStorage.set(LAST_UPDATE_TIME, dayjs().format('YYYY-MM-DD HH:mm:ss'));

      const sourceQueues = groupNovelsByPlugin(libraryNovels);
      const activeNovels = new Map<string, string>();
      let completedNovels = 0;
      let nextSourceQueue = 0;

      const publishProgress = () => {
        setMeta(meta => ({
          ...meta,
          progressText: [...activeNovels.values()].join('\n') || undefined,
          progress: completedNovels / libraryNovels.length,
        }));
      };

      const updateSourceQueue = async (sourceQueue: DBNovelInfo[]) => {
        for (const novel of sourceQueue) {
          activeNovels.set(novel.pluginId, novel.name);
          publishProgress();

          try {
            await updateNovel(novel.pluginId, novel.path, novel.id, options);
            await sleep(1000);
          } catch (error: unknown) {
            showToast(
              novel.name +
                ': ' +
                (error instanceof Error ? error.message : String(error)),
            );
          } finally {
            completedNovels += 1;
            activeNovels.delete(novel.pluginId);
            publishProgress();
          }
        }
      };

      const updateNextSource = async () => {
        while (nextSourceQueue < sourceQueues.length) {
          const sourceQueue = sourceQueues[nextSourceQueue];
          nextSourceQueue += 1;
          await updateSourceQueue(sourceQueue);
        }
      };

      await Promise.all(
        Array.from(
          {
            length: Math.min(UPDATE_SOURCE_CONCURRENCY, sourceQueues.length),
          },
          updateNextSource,
        ),
      );
    } else {
      showToast("There's no novel to be updated");
    }
  } finally {
    downloadBatcher.flush();
    setMeta(meta => ({
      ...meta,
      progress: 1,
      progressText: undefined,
      isRunning: false,
    }));
  }
};

export { updateLibrary };
