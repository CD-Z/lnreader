import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';

export const NOVEL_PAGE_INDEX_PREFIX = 'NOVEL_PAGE_INDEX_PREFIX';
export const NOVEL_SETTINGS_PREFIX = 'NOVEL_SETTINGS';
export const LAST_READ_PREFIX = 'LAST_READ_PREFIX';

export const defaultNovelSettings: NovelSettings = {
  showChapterTitles: true,
  filter: [],
};

export const defaultPageIndex = 0;

export interface NovelSettings {
  sort?: ChapterOrderKey;
  filter: ChapterFilterKey[];
  showChapterTitles?: boolean;
}

export interface BatchInfo {
  batch: number;
  total: number;
  totalChapters?: number;
}
