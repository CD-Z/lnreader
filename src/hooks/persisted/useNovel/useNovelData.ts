import { useCallback } from 'react';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import {
  getChapterCount,
  getCustomPages,
  getFirstUnreadChapter as _getFirstUnreadChapter,
  getPageChapters as _getPageChapters,
  getPageChaptersBatched,
  insertChapters,
} from '@database/queries/ChapterQueries';
import {
  getNovelByPath,
  insertNovelAndChapters,
} from '@database/queries/NovelQueries';
import { ChapterInfo, NovelInfo } from '@database/types';
import { fetchNovel, fetchPage } from '@services/plugin/fetch';
import { getString } from '@strings/translations';
import { BatchInfo } from './types';

export interface UseNovelDataParams {
  novel: NovelInfo | undefined;
  novelPath: string;
  pluginId: string;
  pages: string[];
  pageIndex: number;
  settingsSort: ChapterOrderKey;
  settingsFilter: ChapterFilterKey[];
  batchInformation: BatchInfo;
  setPages: (pages: string[]) => void;
  setNovel: (novel: NovelInfo | undefined) => void;
  setFirstUnreadChapter: (chapter: ChapterInfo | undefined) => void;
  setBatchInformation: React.Dispatch<React.SetStateAction<BatchInfo>>;
  setChapters: (chs: ChapterInfo[]) => void;
  extendChapters: (chs: ChapterInfo[]) => void;
}

export const useNovelData = ({
  novel,
  novelPath,
  pluginId,
  pages,
  pageIndex,
  settingsSort,
  settingsFilter,
  batchInformation,
  setPages,
  setNovel,
  setFirstUnreadChapter,
  setBatchInformation,
  setChapters,
  extendChapters,
}: UseNovelDataParams) => {
  const calculatePages = useCallback(async (tmpNovel: NovelInfo) => {
    let tmpPages: string[];
    if ((tmpNovel.totalPages ?? 0) > 0) {
      tmpPages = Array(tmpNovel.totalPages)
        .fill(0)
        .map((_, idx) => String(idx + 1));
    } else {
      tmpPages = (await getCustomPages(tmpNovel.id))
        .map(c => c.page)
        .filter((page): page is string => page !== null);
    }

    return tmpPages.length > 1 ? tmpPages : ['1'];
  }, []);

  const getNovel = useCallback(async () => {
    let tmpNovel = getNovelByPath(novelPath, pluginId);
    if (!tmpNovel) {
      const sourceNovel = await fetchNovel(pluginId, novelPath).catch(() => {
        throw new Error(getString('updatesScreen.unableToGetNovel'));
      });
      console.log('getNovel', sourceNovel);
      await insertNovelAndChapters(pluginId, sourceNovel);
      tmpNovel = getNovelByPath(novelPath, pluginId);

      if (!tmpNovel) {
        return;
      }
    }

    setPages(await calculatePages(tmpNovel));

    setNovel(tmpNovel);
  }, [novelPath, pluginId, calculatePages, setPages, setNovel]);

  const getChapters = useCallback(async () => {
    const page = pages[pageIndex] ?? '1';

    if (novel && page) {
      let newChapters: ChapterInfo[] = [];

      const config = [novel.id, settingsSort, settingsFilter, page] as const;

      let chapterCount = await getChapterCount(novel.id, page);
      console.log(chapterCount);
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
        newChapters = await _getPageChapters(...config);
        chapterCount = await getChapterCount(novel.id, page);
      }

      setBatchInformation({
        batch: 0,
        total: Math.floor(chapterCount / 300),
        totalChapters: chapterCount,
      });
      setChapters(newChapters);

      const unread = await _getFirstUnreadChapter(
        novel.id,
        settingsFilter,
        page,
      );
      setFirstUnreadChapter(unread ?? undefined);
    }
  }, [
    novel,
    novelPath,
    settingsFilter,
    pageIndex,
    pages,
    pluginId,
    settingsSort,
    setChapters,
    setBatchInformation,
    setFirstUnreadChapter,
  ]);

  const getNextChapterBatch = useCallback(async () => {
    const page = pages[pageIndex];
    const nextBatch = batchInformation.batch + 1;
    if (novel && page && nextBatch <= batchInformation.total) {
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
      setBatchInformation({ ...batchInformation, batch: nextBatch });
      extendChapters(newChapters);
    }
  }, [
    batchInformation,
    extendChapters,
    novel,
    pageIndex,
    pages,
    settingsFilter,
    settingsSort,
  ]);

  const loadUpToBatch = useCallback(
    async (targetBatch: number) => {
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

        setBatchInformation(prev => ({ ...prev, batch }));
        extendChapters(newChapters);
      }
    },
    [
      batchInformation,
      extendChapters,
      novel,
      pageIndex,
      pages,
      settingsFilter,
      settingsSort,
    ],
  );

  return {
    calculatePages,
    getNovel,
    getChapters,
    getNextChapterBatch,
    loadUpToBatch,
  };
};
