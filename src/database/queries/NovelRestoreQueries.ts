import { eq, inArray, sql } from 'drizzle-orm';

import { fetchNovel } from '@services/plugin/fetch';
import { insertChapters } from './ChapterQueries';
import { getCategoryForNewNovel } from './NovelQueries';

import { dbManager } from '@database/db';
import {
  createNovelTriggerQueryDelete,
  createNovelTriggerQueryInsert,
  createNovelTriggerQueryUpdate,
} from '@database/queryStrings/triggers';
import {
  chapterSchema,
  novelCategorySchema,
  novelSchema,
} from '@database/schema';
import type { TransactionParameter } from '@database/manager/manager.d';
import { NOVEL_STORAGE } from '@utils/Storages';
import type { BackupNovel, NovelInfo, RestoredNovelMapping } from '../types';

/**
 * Restore a novel from backup using Drizzle ORM.
 */
export const restoreLibrary = async (novel: NovelInfo) => {
  const sourceNovel = await fetchNovel(novel.pluginId, novel.path).catch(e => {
    throw e;
  });

  const novelId = await dbManager.write(async tx => {
    const row = await tx
      .insert(novelSchema)
      .values({
        path: sourceNovel.path,
        name: novel.name,
        pluginId: novel.pluginId,
        cover: novel.cover || '',
        summary: novel.summary || '',
        author: novel.author || '',
        artist: novel.artist || '',
        status: novel.status || '',
        genres: novel.genres || '',
        totalPages: sourceNovel.totalPages || 0,
        inLibrary: true,
      })
      .onConflictDoUpdate({
        target: [novelSchema.path, novelSchema.pluginId],
        set: {
          name: novel.name,
          cover: novel.cover || '',
          summary: novel.summary || '',
          author: novel.author || '',
          artist: novel.artist || '',
          status: novel.status || '',
          genres: novel.genres || '',
          totalPages: sourceNovel.totalPages || 0,
          inLibrary: true,
        },
      })
      .returning()
      .get();

    if (row) {
      const defaultCategory = await getCategoryForNewNovel(tx);

      if (defaultCategory) {
        await tx
          .insert(novelCategorySchema)
          .values({
            novelId: row.id,
            categoryId: defaultCategory.id,
          })
          .onConflictDoNothing()
          .run();
      }
    }
    return row?.id;
  });

  if (novelId && sourceNovel.chapters) {
    await insertChapters(novelId, sourceNovel.chapters);
  }
};

const disableNovelStatsTriggers = async (tx: TransactionParameter) => {
  await tx.run(sql.raw('DROP TRIGGER IF EXISTS update_novel_stats'));
  await tx.run(sql.raw('DROP TRIGGER IF EXISTS update_novel_stats_on_update'));
  await tx.run(sql.raw('DROP TRIGGER IF EXISTS update_novel_stats_on_delete'));
};

const restoreNovelStatsTriggers = async (tx: TransactionParameter) => {
  await tx.run(sql.raw(createNovelTriggerQueryInsert));
  await tx.run(sql.raw(createNovelTriggerQueryDelete));
  await tx.run(sql.raw(createNovelTriggerQueryUpdate));
};

const restoreNovelRecord = async (
  tx: TransactionParameter,
  novel: Omit<BackupNovel, 'id' | 'chapters'>,
) => {
  const resetState = {
    totalChapters: 0,
    chaptersDownloaded: 0,
    chaptersUnread: 0,
    lastReadAt: null,
    lastUpdatedAt: null,
  };

  // The order here makes resetState authoritative.
  const values = {
    ...resetState,
    ...novel,
  };

  const localCover = values.cover?.startsWith(`file://${NOVEL_STORAGE}/`)
    ? values.cover
    : undefined;

  const cacheSuffix = localCover?.match(/[?#].*$/)?.[0] ?? '';

  const restoredNovel = await tx
    .insert(novelSchema)
    .values(values)
    .onConflictDoUpdate({
      target: [novelSchema.path, novelSchema.pluginId],
      set: values,
    })
    .returning({ id: novelSchema.id })
    .get();

  await tx
    .delete(chapterSchema)
    .where(eq(chapterSchema.novelId, restoredNovel.id))
    .run();

  if (localCover !== undefined) {
    await tx
      .update(novelSchema)
      .set({
        cover:
          `file://${NOVEL_STORAGE}/` +
          `${values.pluginId}/${restoredNovel.id}/cover.png` +
          cacheSuffix,
      })
      .where(eq(novelSchema.id, restoredNovel.id))
      .run();
  }

  return restoredNovel;
};

const restoreChapterValues = (
  chapters: BackupNovel['chapters'],
  novelId: number,
) =>
  chapters.map(({ id: _chapterId, novelId: _novelId, ...chapter }) => ({
    ...chapter,
    novelId,
  }));

const refreshRestoredNovelStats = async (
  tx: TransactionParameter,
  novelIds: number[],
) => {
  if (novelIds.length === 0) {
    return;
  }

  const stats = await tx
    .select({
      novelId: chapterSchema.novelId,
      totalChapters: sql<number>`COUNT(*)`,
      chaptersDownloaded: sql<number>`SUM(CASE WHEN ${chapterSchema.isDownloaded} = 1 THEN 1 ELSE 0 END)`,
      chaptersUnread: sql<number>`SUM(CASE WHEN ${chapterSchema.unread} = 1 THEN 1 ELSE 0 END)`,
      lastReadAt: sql<string | null>`MAX(${chapterSchema.readTime})`,
      lastUpdatedAt: sql<string | null>`(
        SELECT updatedChapter.updatedTime
        FROM Chapter AS updatedChapter
        WHERE updatedChapter.novelId = Chapter.novelId
          AND updatedChapter.updatedTime IS NOT NULL
        ORDER BY julianday(updatedChapter.updatedTime) DESC
        LIMIT 1
      )`,
    })
    .from(chapterSchema)
    .where(inArray(chapterSchema.novelId, novelIds))
    .groupBy(chapterSchema.novelId)
    .all();

  if (stats.length === 0) {
    return;
  }

  const ids = sql.join(
    novelIds.map(id => sql`${id}`),
    sql`, `,
  );
  const cases = <T extends keyof (typeof stats)[number]>(
    field: T,
    fallback: unknown,
  ) =>
    sql`CASE ${novelSchema.id} ${sql.join(
      stats.map(
        (stat: (typeof stats)[number]) =>
          sql`WHEN ${stat.novelId} THEN ${stat[field]}`,
      ),
      sql` `,
    )} ELSE ${fallback} END`;

  await tx.run(sql`
    UPDATE Novel
    SET totalChapters = ${cases('totalChapters', novelSchema.totalChapters)},
        chaptersDownloaded = ${cases(
          'chaptersDownloaded',
          novelSchema.chaptersDownloaded,
        )},
        chaptersUnread = ${cases('chaptersUnread', novelSchema.chaptersUnread)},
        lastReadAt = ${cases('lastReadAt', novelSchema.lastReadAt)},
        lastUpdatedAt = ${cases('lastUpdatedAt', novelSchema.lastUpdatedAt)}
    WHERE id IN (${ids})
  `);
};

const RESTORE_CHAPTER_BATCH_SIZE = 500;

type RestoreNovelOptions = {
  includeChapterMappings?: boolean;
};

const restoreNovelsAndChaptersInTransaction = async (
  tx: TransactionParameter,
  backupNovels: BackupNovel[],
  includeChapterMappings: boolean,
): Promise<RestoredNovelMapping[]> => {
  await disableNovelStatsTriggers(tx);

  try {
    const restoredNovels: {
      backupNovelId: number;
      chapters: BackupNovel['chapters'];
      novel: Omit<BackupNovel, 'id' | 'chapters'>;
      restoredNovelId: number;
    }[] = [];
    for (const backupNovel of backupNovels) {
      const { chapters, id: backupNovelId, ...novel } = backupNovel;
      const restoredNovel = await restoreNovelRecord(tx, novel);
      restoredNovels.push({
        backupNovelId,
        chapters,
        novel,
        restoredNovelId: restoredNovel.id,
      });
    }

    const mappings: RestoredNovelMapping[] = [];
    for (const restoredNovel of restoredNovels) {
      const chapterMappings: RestoredNovelMapping['chapters'] = [];
      for (
        let i = 0;
        i < restoredNovel.chapters.length;
        i += RESTORE_CHAPTER_BATCH_SIZE
      ) {
        const batch = restoredNovel.chapters.slice(
          i,
          i + RESTORE_CHAPTER_BATCH_SIZE,
        );
        if (includeChapterMappings) {
          const restoredChapters = (await tx
            .insert(chapterSchema)
            .values(restoreChapterValues(batch, restoredNovel.restoredNovelId))
            .returning({ id: chapterSchema.id, path: chapterSchema.path })
            .all()) as { id: number; path: string }[];
          const restoredIdsByPath = new Map(
            restoredChapters.map(chapter => [chapter.path, chapter.id]),
          );
          for (const chapter of batch) {
            const restoredChapterId = restoredIdsByPath.get(chapter.path);
            if (restoredChapterId !== undefined) {
              chapterMappings.push({
                backupChapterId: chapter.id,
                restoredChapterId,
              });
            }
          }
        } else {
          await tx
            .insert(chapterSchema)
            .values(restoreChapterValues(batch, restoredNovel.restoredNovelId))
            .run();
        }
      }
      mappings.push({
        pluginId: restoredNovel.novel.pluginId,
        backupNovelId: restoredNovel.backupNovelId,
        restoredNovelId: restoredNovel.restoredNovelId,
        chapters: chapterMappings,
      });
    }
    await refreshRestoredNovelStats(
      tx,
      restoredNovels.map(restoredNovel => restoredNovel.restoredNovelId),
    );
    return mappings;
  } finally {
    await restoreNovelStatsTriggers(tx);
  }
};

export const _restoreNovelsAndChapters = async (
  backupNovels: BackupNovel[],
  options: RestoreNovelOptions = {},
): Promise<RestoredNovelMapping[]> => {
  if (backupNovels.length === 0) {
    return [];
  }
  return dbManager.write(tx =>
    restoreNovelsAndChaptersInTransaction(
      tx,
      backupNovels,
      options.includeChapterMappings ?? true,
    ),
  );
};

/**
 * Restores novel and chapters from a backup object.
 */
export const _restoreNovelAndChapters = async (
  backupNovel: BackupNovel,
  options: RestoreNovelOptions = {},
): Promise<RestoredNovelMapping> => {
  const [mapping] = await _restoreNovelsAndChapters([backupNovel], options);
  if (!mapping) {
    throw new Error('Failed to restore novel');
  }
  return mapping;
};
