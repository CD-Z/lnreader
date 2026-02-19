/**
 * Test data utilities for inserting test data into database
 */

import type { TestDb } from './testDb';
import {
  novelSchema,
  chapterSchema,
  categorySchema,
  repositorySchema,
  novelCategorySchema,
  type NovelInsert,
  type ChapterInsert,
  type CategoryInsert,
  type RepositoryInsert,
  type NovelCategoryInsert,
} from '@database/schema';

/**
 * Remove all rows from test tables used by the application.
 *
 * Specifically deletes entries from NovelCategory, Chapter, Novel, and Repository, and deletes Category rows whose `id` is greater than 2 (preserving `id` 1 and 2).
 */
export function clearAllTables(testDb: TestDb) {
  const { sqlite } = testDb;
  sqlite.exec(`
    DELETE FROM NovelCategory;
    DELETE FROM Chapter;
    DELETE FROM Novel;
    DELETE FROM Repository;
    DELETE FROM Category WHERE id > 2;
  `);
}

/**
 * Create and insert a test novel record into the database.
 *
 * @param testDb - Test database context used for the insertion
 * @param data - Optional fields to override the default novel properties
 * @returns The id of the inserted novel
 */
export async function insertTestNovel(
  testDb: TestDb,
  data: Partial<NovelInsert> = {},
): Promise<number> {
  const { drizzleDb } = testDb;

  const novelData: any = {
    path: `/test/novel/${Math.random()}`,
    pluginId: 'test-plugin',
    name: 'Test Novel',
    cover: null,
    summary: null,
    author: null,
    artist: null,
    status: 'Unknown',
    genres: null,
    inLibrary: false,
    isLocal: false,
    totalPages: 0,
    chaptersDownloaded: 0,
    chaptersUnread: 0,
    totalChapters: 0,
    lastReadAt: null,
    lastUpdatedAt: null,
    ...data,
  };

  const result = drizzleDb
    .insert(novelSchema)
    .values(novelData)
    .returning()
    .get();

  return result.id;
}

/**
 * Create and insert a chapter record linked to a novel for tests.
 *
 * @param novelId - The id of the novel to associate the chapter with
 * @param data - Optional partial chapter fields to override default test values
 * @returns The inserted chapter's id
 */
export async function insertTestChapter(
  testDb: TestDb,
  novelId: number,
  data: Partial<ChapterInsert> = {},
): Promise<number> {
  const { drizzleDb } = testDb;

  const chapterData: any = {
    path: `/test/chapter/${Math.random()}`,
    name: 'Test Chapter',
    releaseTime: null,
    bookmark: false,
    unread: true,
    readTime: null,
    isDownloaded: false,
    updatedTime: null,
    chapterNumber: null,
    page: '1',
    position: 0,
    progress: null,
    ...data,
    novelId,
  };

  const result = drizzleDb
    .insert(chapterSchema)
    .values(chapterData)
    .returning()
    .get();

  return result.id;
}

/**
 * Inserts a category row for tests, using sensible defaults for missing fields.
 *
 * @param data - Optional overrides for the category fields; if `name` is omitted a timestamped default is used
 * @returns The id of the newly inserted category
 */
export async function insertTestCategory(
  testDb: TestDb,
  data: Partial<CategoryInsert> = {},
): Promise<number> {
  const { drizzleDb } = testDb;
  const categoryData: CategoryInsert = {
    name: data.name ?? `Test Category ${Date.now()}`,
    sort: data.sort ?? null,
  };

  const result = drizzleDb
    .insert(categorySchema)
    .values(categoryData)
    .returning()
    .get();

  return result.id;
}

/**
 * Create and insert a repository record for tests.
 *
 * If `data.url` is not provided, a unique test URL is generated.
 *
 * @returns The inserted repository's id
 */
export async function insertTestRepository(
  testDb: TestDb,
  data: Partial<RepositoryInsert> = {},
): Promise<number> {
  const { drizzleDb } = testDb;
  const repoData: RepositoryInsert = {
    url: data.url ?? `https://test-repo-${Date.now()}.example.com`,
  };

  const result = drizzleDb
    .insert(repositorySchema)
    .values(repoData)
    .returning()
    .get();

  return result.id;
}

/**
 * Creates an association between a novel and a category in the test database.
 *
 * @returns The id of the created novel-category association
 */
export async function insertTestNovelCategory(
  testDb: TestDb,
  novelId: number,
  categoryId: number,
): Promise<number> {
  const { drizzleDb } = testDb;
  const data: NovelCategoryInsert = {
    novelId,
    categoryId,
  };

  const result = drizzleDb
    .insert(novelCategorySchema)
    .values(data)
    .returning()
    .get();

  return result.id;
}

/**
 * Create a test novel and optionally add chapters linked to it.
 *
 * @param novelData - Partial fields to override on the created novel
 * @param chapters - Array of partial chapter records to insert for the novel; each entry becomes a chapter linked to the created novel
 * @returns An object containing the inserted novel's `novelId` and an array of inserted `chapterIds`
 */
export async function insertTestNovelWithChapters(
  testDb: TestDb,
  novelData: Partial<NovelInsert> = {},
  chapters: Partial<ChapterInsert>[] = [],
): Promise<{ novelId: number; chapterIds: number[] }> {
  const novelId = await insertTestNovel(testDb, novelData);
  const chapterIds: number[] = [];

  for (const chapterData of chapters) {
    const chapterId = await insertTestChapter(testDb, novelId, chapterData);
    chapterIds.push(chapterId);
  }

  return { novelId, chapterIds };
}

/**
 * Bulk insert test data
 */
export interface TestFixtures {
  novels?: Partial<NovelInsert>[];
  chapters?: Array<{ novelId: number } & Partial<ChapterInsert>>;
  categories?: Partial<CategoryInsert>[];
  repositories?: Partial<RepositoryInsert>[];
  novelCategories?: Array<{ novelId: number; categoryId: number }>;
}

/**
 * Inserts provided test fixtures into the test database and returns the created record IDs.
 *
 * Processes fixtures in this order when present: novels, chapters, categories, repositories, and novel-category associations.
 *
 * @param testDb - Test database context used for performing inserts
 * @param fixtures - Collections of fixture objects to insert; fields can override default test values
 * @returns An object containing arrays of inserted IDs: `novelIds`, `chapterIds`, `categoryIds`, and `repositoryIds`
 */
export async function seedTestData(
  testDb: TestDb,
  fixtures: TestFixtures,
): Promise<{
  novelIds: number[];
  chapterIds: number[];
  categoryIds: number[];
  repositoryIds: number[];
}> {
  const novelIds: number[] = [];
  const chapterIds: number[] = [];
  const categoryIds: number[] = [];
  const repositoryIds: number[] = [];

  // Insert novels
  if (fixtures.novels) {
    for (const novelData of fixtures.novels) {
      const id = await insertTestNovel(testDb, novelData);
      novelIds.push(id);
    }
  }

  // Insert chapters (can reference novels by index or use provided novelId)
  if (fixtures.chapters) {
    for (const chapterData of fixtures.chapters) {
      const { novelId, ...rest } = chapterData;
      const id = await insertTestChapter(testDb, novelId, rest);
      chapterIds.push(id);
    }
  }

  // Insert categories
  if (fixtures.categories) {
    for (const categoryData of fixtures.categories) {
      const id = await insertTestCategory(testDb, categoryData);
      categoryIds.push(id);
    }
  }

  // Insert repositories
  if (fixtures.repositories) {
    for (const repoData of fixtures.repositories) {
      const id = await insertTestRepository(testDb, repoData);
      repositoryIds.push(id);
    }
  }

  // Insert novel-category associations
  if (fixtures.novelCategories) {
    for (const { novelId, categoryId } of fixtures.novelCategories) {
      await insertTestNovelCategory(testDb, novelId, categoryId);
    }
  }

  return { novelIds, chapterIds, categoryIds, repositoryIds };
}