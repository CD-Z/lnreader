import { useCallback } from 'react';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import { ChapterInfo, NovelInfo } from '@database/types';
import { bootstrapService } from './bootstrapService';
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
  const calculatePages = useCallback(
    async (tmpNovel: NovelInfo) => bootstrapService.calculatePages(tmpNovel),
    [],
  );

  const getNovel = useCallback(async () => {
    const tmpNovel = await bootstrapService.resolveNovel(novelPath, pluginId);
    if (!tmpNovel) return;

    setPages(await calculatePages(tmpNovel));
    setNovel(tmpNovel);
  }, [novelPath, pluginId, calculatePages, setPages, setNovel]);

  const getChapters = useCallback(async () => {
    if (!novel) return;

    const chapterState = await bootstrapService.getChaptersForPage({
      novel,
      novelPath,
      pluginId,
      pages,
      pageIndex,
      settingsSort,
      settingsFilter,
    });

    setBatchInformation(chapterState.batchInformation);
    setChapters(chapterState.chapters);
    setFirstUnreadChapter(chapterState.firstUnreadChapter);
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
    const nextState = await bootstrapService.getNextChapterBatch({
      novel,
      pages,
      pageIndex,
      settingsSort,
      settingsFilter,
      batchInformation,
    });
    if (!nextState) return;

    setBatchInformation({ ...batchInformation, batch: nextState.batch });
    extendChapters(nextState.chapters);
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
      await bootstrapService.loadUpToBatch({
        targetBatch,
        novel,
        pages,
        pageIndex,
        settingsSort,
        settingsFilter,
        batchInformation,
        onBatchLoaded: (batch, chapters) => {
          setBatchInformation(prev => ({ ...prev, batch }));
          extendChapters(chapters);
        },
      });
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
