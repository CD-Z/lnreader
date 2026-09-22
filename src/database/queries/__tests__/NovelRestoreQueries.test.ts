import './mockDb';
import { setupTestDatabase, getTestDb, teardownTestDatabase } from './setup';
import { insertTestNovel, insertTestChapter, clearAllTables } from './testData';
import { chapterSchema, novelSchema } from '@database/schema';
import { eq } from 'drizzle-orm';

import { getNovelByPath } from '../NovelQueries';
import {
  restoreLibrary,
  _restoreNovelAndChapters,
  _restoreNovelsAndChapters,
} from '../NovelRestoreQueries';

const mockGetLibraryDefaultCategoryId = jest.fn<number | undefined, []>();

jest.mock('@hooks/persisted/useSettings', () => ({
  getLibraryDefaultCategoryId: () => mockGetLibraryDefaultCategoryId(),
}));

describe('NovelRestoreQueries', () => {
  beforeEach(() => {
    const testDb = setupTestDatabase();
    clearAllTables(testDb);
    mockGetLibraryDefaultCategoryId.mockReturnValue(undefined);
  });

  afterAll(() => {
    teardownTestDatabase();
  });
  describe('restoreLibrary', () => {
    it('should restore novel from backup', async () => {
      const novel = {
        id: 999,
        path: '/test/novel',
        pluginId: 'test-plugin',
        name: 'Restored Novel',
        cover: null,
        summary: null,
        author: null,
        artist: null,
        status: 'Ongoing',
        genres: null,
        inLibrary: true,
        isLocal: false,
        totalPages: 1,
        chaptersDownloaded: 0,
        chaptersUnread: 0,
        totalChapters: 0,
        lastReadAt: null,
        lastUpdatedAt: null,
      };

      // Mock fetchNovel to return a valid SourceNovel
      const { fetchNovel } = require('@services/plugin/fetch');
      jest.mocked(fetchNovel).mockResolvedValueOnce({
        id: undefined,
        path: '/test/novel',
        name: 'Restored Novel',
        chapters: [],
      });

      await restoreLibrary(novel);

      const restored = await getNovelByPath('/test/novel', 'test-plugin');
      expect(restored?.name).toBe('Restored Novel');
    });
  });

  describe('_restoreNovelAndChapters', () => {
    it('does not replace an unrelated novel when backup IDs collide', async () => {
      const testDb = getTestDb();
      await insertTestNovel(testDb, {
        path: '/existing/novel',
        pluginId: 'existing-plugin',
        name: 'Existing Novel',
        inLibrary: true,
      });

      const mapping = await _restoreNovelAndChapters({
        id: 1,
        path: '/restored/novel',
        pluginId: 'restored-plugin',
        name: 'Restored Novel',
        cover: null,
        summary: null,
        author: null,
        artist: null,
        status: 'Ongoing',
        genres: null,
        inLibrary: true,
        isLocal: false,
        totalPages: 0,
        chapters: [
          {
            id: 10,
            novelId: 1,
            path: '/restored/chapter-1',
            name: 'Chapter 1',
            releaseTime: null,
            readTime: null,
            bookmark: false,
            unread: true,
            isDownloaded: true,
            updatedTime: null,
            chapterNumber: 1,
            page: '1',
            progress: null,
            position: 0,
            scanlator: null,
            timeSpent: 0,
          },
        ],
      });

      expect(mapping.restoredNovelId).not.toBe(1);
      expect(
        (await getNovelByPath('/existing/novel', 'existing-plugin'))?.name,
      ).toBe('Existing Novel');
      expect(
        (await getNovelByPath('/restored/novel', 'restored-plugin'))?.id,
      ).toBe(mapping.restoredNovelId);
      const restoredChapters = await testDb.drizzleDb
        .select()
        .from(chapterSchema)
        .where(eq(chapterSchema.novelId, mapping.restoredNovelId))
        .all();
      expect(mapping.chapters).toEqual([
        {
          backupChapterId: 10,
          restoredChapterId: restoredChapters[0].id,
        },
      ]);
    });
    it('restores multiple novels in one batch', async () => {
      const mappings = await _restoreNovelsAndChapters(
        [
          {
            id: 100,
            path: '/bulk/one',
            pluginId: 'bulk-plugin',
            name: 'Bulk One',
            chapters: [],
          },
          {
            id: 101,
            path: '/bulk/two',
            pluginId: 'bulk-plugin',
            name: 'Bulk Two',
            chapters: [],
          },
        ],
        { includeChapterMappings: false },
      );

      expect(mappings).toHaveLength(2);
      expect(mappings.map(mapping => mapping.pluginId)).toEqual([
        'bulk-plugin',
        'bulk-plugin',
      ]);
      expect(await getNovelByPath('/bulk/one', 'bulk-plugin')).toEqual(
        expect.objectContaining({ name: 'Bulk One' }),
      );
      expect(await getNovelByPath('/bulk/two', 'bulk-plugin')).toEqual(
        expect.objectContaining({ name: 'Bulk Two' }),
      );
    });
    it('preserves mappings and aggregate stats for multiple novels', async () => {
      const mappings = await _restoreNovelsAndChapters(
        [
          {
            id: 200,
            path: '/bulk/mapped-one',
            pluginId: 'bulk-plugin',
            name: 'Mapped One',
            chapters: [
              {
                id: 2001,
                novelId: 200,
                path: '/bulk/chapter-one',
                name: 'Chapter One',
                releaseTime: null,
                readTime: '2024-01-01T00:00:00.000Z',
                bookmark: false,
                unread: true,
                isDownloaded: true,
                updatedTime: '2024-01-01T00:00:00.000Z',
                chapterNumber: 1,
                page: '1',
                progress: null,
                position: 0,
                scanlator: null,
                timeSpent: 0,
              },
              {
                id: 2002,
                novelId: 200,
                path: '/bulk/chapter-two',
                name: 'Chapter Two',
                releaseTime: null,
                readTime: '2025-01-01T00:00:00.000Z',
                bookmark: false,
                unread: false,
                isDownloaded: false,
                updatedTime: '2023-01-01T00:00:00.000Z',
                chapterNumber: 2,
                page: '1',
                progress: null,
                position: 1,
                scanlator: null,
                timeSpent: 0,
              },
            ],
          },
          {
            id: 201,
            path: '/bulk/mapped-two',
            pluginId: 'bulk-plugin',
            name: 'Mapped Two',
            chapters: [
              {
                id: 2011,
                novelId: 201,
                path: '/bulk/chapter-three',
                name: 'Chapter Three',
                releaseTime: null,
                readTime: null,
                bookmark: false,
                unread: true,
                isDownloaded: true,
                updatedTime: '2026-01-01T00:00:00.000Z',
                chapterNumber: 1,
                page: '1',
                progress: null,
                position: 0,
                scanlator: null,
                timeSpent: 0,
              },
            ],
          },
        ],
        { includeChapterMappings: true },
      );

      expect(mappings).toHaveLength(2);
      expect(
        mappings.map(mapping =>
          mapping.chapters.map(chapter => chapter.backupChapterId),
        ),
      ).toEqual([[2001, 2002], [2011]]);
      expect(mappings[0].chapters).toHaveLength(2);
      expect(mappings[1].chapters).toHaveLength(1);
      expect(
        new Set(
          mappings
            .flatMap(mapping => mapping.chapters)
            .map(chapter => chapter.restoredChapterId),
        ).size,
      ).toBe(3);
      expect(await getNovelByPath('/bulk/mapped-one', 'bulk-plugin')).toEqual(
        expect.objectContaining({
          totalChapters: 2,
          chaptersDownloaded: 1,
          chaptersUnread: 1,
          lastReadAt: '2025-01-01T00:00:00.000Z',
          lastUpdatedAt: '2024-01-01T00:00:00.000Z',
        }),
      );
      expect(await getNovelByPath('/bulk/mapped-two', 'bulk-plugin')).toEqual(
        expect.objectContaining({
          totalChapters: 1,
          chaptersDownloaded: 1,
          chaptersUnread: 1,
          lastReadAt: null,
          lastUpdatedAt: '2026-01-01T00:00:00.000Z',
        }),
      );
    });
    it('restores chapters without allocating ID mappings when requested', async () => {
      const mapping = await _restoreNovelAndChapters(
        {
          id: 2,
          path: '/restored/without-mappings',
          pluginId: 'restored-plugin',
          name: 'Restored Without Mappings',
          cover: null,
          summary: null,
          author: null,
          artist: null,
          status: 'Ongoing',
          genres: null,
          inLibrary: true,
          isLocal: false,
          totalPages: 0,
          chapters: [
            {
              id: 20,
              novelId: 2,
              path: '/restored/chapter-2',
              name: 'Chapter 2',
              releaseTime: null,
              readTime: null,
              bookmark: false,
              unread: true,
              isDownloaded: false,
              updatedTime: null,
              chapterNumber: 2,
              page: '1',
              progress: null,
              position: 0,
              scanlator: null,
              timeSpent: 0,
            },
          ],
        },
        { includeChapterMappings: false },
      );

      expect(mapping.chapters).toEqual([]);
      const restoredChapters = await getTestDb()
        .drizzleDb.select()
        .from(chapterSchema)
        .where(eq(chapterSchema.novelId, mapping.restoredNovelId))
        .all();
      expect(restoredChapters).toHaveLength(1);
      expect(restoredChapters[0].path).toBe('/restored/chapter-2');
    });
    it('rebuilds aggregate timestamps after replacing existing chapters', async () => {
      const testDb = getTestDb();
      const novelId = await insertTestNovel(testDb, {
        path: '/restore/stats',
        pluginId: 'stats-plugin',
      });
      await insertTestChapter(testDb, novelId, {
        path: '/restore/old-chapter',
        readTime: '2020-01-01T00:00:00.000Z',
        updatedTime: '2020-01-01T00:00:00.000Z',
      });
      await testDb.drizzleDb
        .update(novelSchema)
        .set({
          lastReadAt: 'stale-read-time',
          lastUpdatedAt: 'stale-update-time',
        })
        .where(eq(novelSchema.id, novelId))
        .run();

      await _restoreNovelAndChapters(
        {
          id: 3,
          path: '/restore/stats',
          pluginId: 'stats-plugin',
          name: 'Restored Stats',
          cover: null,
          summary: null,
          author: null,
          artist: null,
          status: 'Ongoing',
          genres: null,
          inLibrary: true,
          isLocal: false,
          totalPages: 0,
          chapters: [
            {
              id: 30,
              novelId: 3,
              path: '/restore/new-chapter',
              name: 'New Chapter',
              releaseTime: null,
              readTime: '2024-01-01T00:00:00.000Z',
              bookmark: false,
              unread: false,
              isDownloaded: true,
              updatedTime: '2025-01-01T00:00:00.000Z',
              chapterNumber: 1,
              page: '1',
              progress: null,
              position: 0,
              scanlator: null,
              timeSpent: 0,
            },
          ],
        },
        { includeChapterMappings: false },
      );

      const restored = await getNovelByPath('/restore/stats', 'stats-plugin');
      expect(restored).toEqual(
        expect.objectContaining({
          totalChapters: 1,
          chaptersDownloaded: 1,
          chaptersUnread: 0,
          lastReadAt: '2024-01-01T00:00:00.000Z',
          lastUpdatedAt: '2025-01-01T00:00:00.000Z',
        }),
      );
    });
  });
});
