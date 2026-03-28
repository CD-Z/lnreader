import { ChapterInfo } from '@database/types';
import { ChapterSliceState } from './novelStore.types';

export const createInitialChapterSlice = (
  chapters?: ChapterInfo[],
): ChapterSliceState => ({
  chapters: chapters ?? [],
  firstUnreadChapter: undefined,
  chapterTextCache: {},
  batchInformation: {
    batch: 0,
    total: 0,
  },
});
