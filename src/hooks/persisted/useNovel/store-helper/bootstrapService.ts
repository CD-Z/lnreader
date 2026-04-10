import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import {
  getChapterCount,
  getCustomPages,
  getFirstUnreadChapter,
  getNovelChaptersSync,
  getPageChapters,
  getPageChaptersBatched,
  insertChapters,
} from '@database/queries/ChapterQueries';
import {
  getNovelById,
  getNovelByPath,
  insertNovelAndChapters,
} from '@database/queries/NovelQueries';
import { ChapterInfo, NovelInfo } from '@database/types';
import { fetchNovel, fetchPage } from '@services/plugin/fetch';
import { getString } from '@strings/translations';
import { BatchInfo } from '../types';

export interface ChapterLoadResult {
  chapters: ChapterInfo[];
  batchInformation: BatchInfo;
  firstUnreadChapter: ChapterInfo | undefined;
}

export interface BootstrapSuccessResult extends ChapterLoadResult {
  ok: true;
  novel: NovelInfo;
  pages: string[];
}

export interface BootstrapFailureResult {
  ok: false;
  reason: 'missing-novel' | 'missing-chapters' | 'error';
  error?: unknown;
}

export type BootstrapResult = BootstrapSuccessResult | BootstrapFailureResult;

export interface BootstrapServiceDependencies {
  getCustomPages: typeof getCustomPages;
  getNovelByPath: typeof getNovelByPath;
  fetchNovel: typeof fetchNovel;
  insertNovelAndChapters: typeof insertNovelAndChapters;
  getChapterCount: typeof getChapterCount;
  getPageChaptersBatched: typeof getPageChaptersBatched;
  fetchPage: typeof fetchPage;
  insertChapters: typeof insertChapters;
  getPageChapters: typeof getPageChapters;
  getFirstUnreadChapter: typeof getFirstUnreadChapter;
}

const inflightBootstraps = new Map<string, Promise<BootstrapResult>>();

const getBootstrapKey = (pluginId: string, novelPath: string) =>
  `${pluginId}_${novelPath}`;

export const createBootstrapService = () => {
  const calculatePages = (tmpNovel: NovelInfo): string[] => {
    let tmpPages: string[];
    if ((tmpNovel.totalPages ?? 0) > 0) {
      tmpPages = Array(tmpNovel.totalPages)
        .fill(0)
        .map((_, idx) => String(idx + 1));
    } else {
      tmpPages = getCustomPages(tmpNovel.id)
        .map(c => c.page)
        .filter((page): page is string => page !== null);
    }

    return tmpPages.length > 1 ? tmpPages : ['1'];
  };

  const resolveNovel = async (
    novelPath: string,
    pluginId: string,
  ): Promise<NovelInfo | undefined> => {
    let tmpNovel = getNovelByPath(novelPath, pluginId);
    if (!tmpNovel) {
      const sourceNovel = await fetchNovel(pluginId, novelPath).catch(() => {
        throw new Error(getString('updatesScreen.unableToGetNovel'));
      });
      await insertNovelAndChapters(pluginId, sourceNovel);
      tmpNovel = getNovelByPath(novelPath, pluginId);

      if (!tmpNovel) {
        return;
      }
    }

    return tmpNovel;
  };

  const getChaptersForPage = async ({
    novel,
    novelPath,
    pluginId,
    pages,
    pageIndex,
    settingsSort,
    settingsFilter,
  }: {
    novel: NovelInfo;
    novelPath: string;
    pluginId: string;
    pages: string[];
    pageIndex: number;
    settingsSort: ChapterOrderKey;
    settingsFilter: ChapterFilterKey[];
  }): Promise<ChapterLoadResult> => {
    console.time('getChaptersForPage');
    const page = pages[pageIndex] ?? '1';
    let newChapters: ChapterInfo[] = [];
    const config = [novel.id, settingsSort, settingsFilter, page] as const;

    let chapterCount = await getChapterCount(novel.id, page);
    if (chapterCount) {
      try {
        newChapters = (await getPageChaptersBatched(...config)) || [];
      } catch (error) {
        console.error('Error fetching chapters:', error);
      }
    } else if (Number(page)) {
      const sourcePage = await fetchPage(pluginId, novelPath, page);
      const sourceChapters = sourcePage.chapters.map(ch => {
        return {
          ...ch,
          page,
        };
      });
      await insertChapters(novel.id, sourceChapters);
      newChapters = await getPageChapters(...config);
      chapterCount = await getChapterCount(novel.id, page);
    }

    const batchInformation: BatchInfo = {
      batch: 0,
      total: Math.floor(chapterCount / 1000),
      totalChapters: chapterCount,
    };
    const unread = getFirstUnreadChapter(novel.id, settingsFilter, page);
    console.timeEnd('getChaptersForPage');
    return {
      chapters: newChapters,
      batchInformation,
      firstUnreadChapter: unread ?? undefined,
    };
  };

  const getNextChapterBatch = async ({
    novel,
    pages,
    pageIndex,
    settingsSort,
    settingsFilter,
    batchInformation,
  }: {
    novel: NovelInfo | undefined;
    pages: string[];
    pageIndex: number;
    settingsSort: ChapterOrderKey;
    settingsFilter: ChapterFilterKey[];
    batchInformation: BatchInfo;
  }) => {
    const page = pages[pageIndex];
    const nextBatch = batchInformation.batch + 1;
    if (!novel || !page || nextBatch > batchInformation.total) {
      return;
    }

    let newChapters: ChapterInfo[] = [];
    try {
      newChapters =
        (await getPageChaptersBatched(
          novel.id,
          settingsSort,
          settingsFilter,
          page,
          nextBatch,
        )) || [];
    } catch (error) {
      console.error('teaser', error);
    }

    return {
      batch: nextBatch,
      chapters: newChapters,
    };
  };

  const loadUpToBatch = async ({
    targetBatch,
    novel,
    pages,
    pageIndex,
    settingsSort,
    settingsFilter,
    batchInformation,
    onBatchLoaded,
  }: {
    targetBatch: number;
    novel: NovelInfo | undefined;
    pages: string[];
    pageIndex: number;
    settingsSort: ChapterOrderKey;
    settingsFilter: ChapterFilterKey[];
    batchInformation: BatchInfo;
    onBatchLoaded: (batch: number, chapters: ChapterInfo[]) => void;
  }) => {
    const page = pages[pageIndex] ?? '1';
    if (!novel || !page || targetBatch <= batchInformation.batch) {
      return;
    }

    for (
      let batch = batchInformation.batch + 1;
      batch <= targetBatch;
      batch++
    ) {
      if (batch > batchInformation.total) break;

      let newChapters: ChapterInfo[] = [];
      try {
        newChapters =
          (await getPageChaptersBatched(
            novel.id,
            settingsSort,
            settingsFilter,
            page,
            batch,
          )) || [];
      } catch (error) {
        console.error('Error loading batch', batch, error);
      }

      onBatchLoaded(batch, newChapters);
    }
  };

  const bootstrapNovelAsync = async ({
    novel,
    novelPath,
    pluginId,
    pageIndex,
    settingsSort,
    settingsFilter,
  }: {
    novel: NovelInfo | undefined;
    novelPath: string;
    pluginId: string;
    pageIndex: number;
    settingsSort: ChapterOrderKey;
    settingsFilter: ChapterFilterKey[];
  }): Promise<BootstrapResult> => {
    console.time(`bootstrap_${pluginId}_${novelPath}`);
    const key = getBootstrapKey(pluginId, novelPath);
    const existing = inflightBootstraps.get(key);
    if (existing) {
      return existing;
    }

    const bootstrapPromise = (async () => {
      try {
        const resolvedNovel =
          novel ?? (await resolveNovel(novelPath, pluginId));
        if (!resolvedNovel) {
          return {
            ok: false,
            reason: 'missing-novel',
          } satisfies BootstrapFailureResult;
        }

        const pages = calculatePages(resolvedNovel);
        const chapterState = await getChaptersForPage({
          novel: resolvedNovel,
          novelPath,
          pluginId,
          pages,
          pageIndex,
          settingsSort,
          settingsFilter,
        });

        return {
          ok: true,
          novel: resolvedNovel,
          pages,
          ...chapterState,
        } satisfies BootstrapSuccessResult;
      } catch (error) {
        return {
          ok: false,
          reason: 'error',
          error,
        } satisfies BootstrapFailureResult;
      } finally {
        inflightBootstraps.delete(key);
      }
    })();

    inflightBootstraps.set(key, bootstrapPromise);
    await bootstrapPromise;
    console.timeEnd(`bootstrap_${pluginId}_${novelPath}`);
    return bootstrapPromise;
  };
  const bootstrapNovelSync = ({
    novel: _novel,
    novelPath,
    pluginId,
    pageIndex,
    settingsSort,
    settingsFilter,
  }: {
    novel: NovelInfo | undefined;
    novelPath: string;
    pluginId: string;
    pageIndex: number;
    settingsSort: ChapterOrderKey;
    settingsFilter: ChapterFilterKey[];
  }): BootstrapResult => {
    try {
      const novel = !_novel?.id
        ? getNovelByPath(novelPath, pluginId)
        : getNovelById(_novel.id);
      if (!novel) {
        return {
          ok: false,
          reason: 'missing-novel',
        } satisfies BootstrapFailureResult;
      } else if (!novel.totalChapters) {
        return {
          ok: false,
          reason: 'missing-chapters',
        } satisfies BootstrapFailureResult;
      }

      const pages = calculatePages(novel);
      const page = pages[pageIndex] ?? '1';
      const config = [
        novel.id,
        settingsSort,
        settingsFilter,
        page,
        1000,
      ] as const;

      const chapterCount = novel.totalChapters;
      const newChapters = getNovelChaptersSync(...config);

      const batchInformation: BatchInfo = {
        batch: 0,
        total: Math.floor(chapterCount / 1000),
        totalChapters: chapterCount,
      };
      const unread = getFirstUnreadChapter(novel.id, settingsFilter, page);

      return {
        ok: true,
        novel,
        pages,
        chapters: newChapters,
        batchInformation,
        firstUnreadChapter: unread ?? undefined,
      } satisfies BootstrapSuccessResult;
    } catch (error) {
      return {
        ok: false,
        reason: 'error',
        error,
      } satisfies BootstrapFailureResult;
    }
  };

  return {
    getChaptersForPage,
    getNextChapterBatch,
    loadUpToBatch,
    bootstrapNovelAsync,
    bootstrapNovelSync,
  };
};

export const bootstrapService = createBootstrapService();
