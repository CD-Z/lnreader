import { useCallback } from 'react';
import { ChapterFilterKey, ChapterOrderKey } from '@database/constants';
import {
  bookmarkChapter as _bookmarkChapter,
  deleteChapter as _deleteChapter,
  deleteChapters as _deleteChapters,
  getPageChapters as _getPageChapters,
  markChapterRead as _markChapterRead,
  markChaptersRead as _markChaptersRead,
  markChaptersUnread as _markChaptersUnread,
  markPreviousChaptersUnread as _markPreviousChaptersUnread,
  markPreviuschaptersRead as _markPreviuschaptersRead,
  updateChapterProgress as _updateChapterProgress,
} from '@database/queries/ChapterQueries';
import { ChapterInfo, NovelInfo } from '@database/types';
import { getString } from '@strings/translations';
import { showToast } from '@utils/showToast';

export interface UseChapterOperationsParams {
  novel: NovelInfo | undefined;
  chapters: ChapterInfo[];
  _setChapters: React.Dispatch<React.SetStateAction<ChapterInfo[]>>;
  transformChapters: (chs: ChapterInfo[]) => ChapterInfo[];
  settingsSort: ChapterOrderKey;
  settingsFilter: ChapterFilterKey[];
  currentPage: string;
  fetching: boolean;
}

export const useChapterOperations = ({
  novel,
  _setChapters,
  transformChapters,
  settingsSort,
  settingsFilter,
  currentPage,
  fetching,
}: UseChapterOperationsParams) => {
  const mutateChapters = useCallback(
    (mutation: (chs: ChapterInfo[]) => ChapterInfo[]) => {
      if (novel) {
        _setChapters(mutation);
      }
    },
    [novel, _setChapters],
  );

  const updateChapter = useCallback(
    (index: number, update: Partial<ChapterInfo>) => {
      if (novel) {
        _setChapters(chs => {
          const next = [...chs];
          next[index] = { ...next[index], ...update };
          return next;
        });
      }
    },
    [novel, _setChapters],
  );

  const transformAndSetChapters = useCallback(
    async (chs: ChapterInfo[]) => {
      _setChapters(transformChapters(chs));
    },
    [transformChapters, _setChapters],
  );

  const extendChapters = useCallback(
    async (chs: ChapterInfo[]) => {
      _setChapters(prev => prev.concat(transformChapters(chs)));
    },
    [transformChapters, _setChapters],
  );

  const bookmarkChapters = useCallback(
    (_chapters: ChapterInfo[]) => {
      _chapters.forEach(_chapter => {
        _bookmarkChapter(_chapter.id);
      });
      mutateChapters(chs =>
        chs.map(chapter => {
          if (_chapters.some(_c => _c.id === chapter.id)) {
            return {
              ...chapter,
              bookmark: !chapter.bookmark,
            };
          }
          return chapter;
        }),
      );
    },
    [mutateChapters],
  );

  const markPreviouschaptersRead = useCallback(
    (chapterId: number) => {
      if (novel) {
        _markPreviuschaptersRead(chapterId, novel.id);
        mutateChapters(chs =>
          chs.map(chapter =>
            chapter.id <= chapterId ? { ...chapter, unread: false } : chapter,
          ),
        );
      }
    },
    [mutateChapters, novel],
  );

  const markChapterRead = useCallback(
    (chapterId: number) => {
      _markChapterRead(chapterId);

      mutateChapters(chs =>
        chs.map(c => {
          if (c.id !== chapterId) {
            return c;
          }
          return {
            ...c,
            unread: false,
          };
        }),
      );
    },
    [mutateChapters],
  );

  const updateChapterProgress = useCallback(
    (chapterId: number, progress: number) => {
      _updateChapterProgress(chapterId, Math.min(progress, 100));

      mutateChapters(chs =>
        chs.map(c => {
          if (c.id !== chapterId) {
            return c;
          }
          return {
            ...c,
            progress,
          };
        }),
      );
    },
    [mutateChapters],
  );

  const markChaptersRead = useCallback(
    (_chapters: ChapterInfo[]) => {
      const chapterIds = _chapters.map(chapter => chapter.id);
      _markChaptersRead(chapterIds);

      mutateChapters(chs =>
        chs.map(chapter => {
          if (chapterIds.includes(chapter.id)) {
            return {
              ...chapter,
              unread: false,
            };
          }
          return chapter;
        }),
      );
    },
    [mutateChapters],
  );

  const markPreviousChaptersUnread = useCallback(
    (chapterId: number) => {
      if (novel) {
        _markPreviousChaptersUnread(chapterId, novel.id);
        mutateChapters(chs =>
          chs.map(chapter =>
            chapter.id <= chapterId ? { ...chapter, unread: true } : chapter,
          ),
        );
      }
    },
    [mutateChapters, novel],
  );

  const markChaptersUnread = useCallback(
    (_chapters: ChapterInfo[]) => {
      const chapterIds = _chapters.map(chapter => chapter.id);
      _markChaptersUnread(chapterIds);

      mutateChapters(chs =>
        chs.map(chapter => {
          if (chapterIds.includes(chapter.id)) {
            return {
              ...chapter,
              unread: true,
            };
          }
          return chapter;
        }),
      );
    },
    [mutateChapters],
  );

  const deleteChapter = useCallback(
    (_chapter: ChapterInfo) => {
      if (novel) {
        _deleteChapter(novel.pluginId, novel.id, _chapter.id).then(() => {
          mutateChapters(chs =>
            chs.map(chapter => {
              if (chapter.id !== _chapter.id) {
                return chapter;
              }
              return {
                ...chapter,
                isDownloaded: false,
              };
            }),
          );
          showToast(getString('common.deleted', { name: _chapter.name }));
        });
      }
    },
    [mutateChapters, novel],
  );

  const deleteChapters = useCallback(
    (_chapters: ChapterInfo[]) => {
      if (novel) {
        _deleteChapters(novel.pluginId, novel.id, _chapters).then(() => {
          showToast(
            getString('updatesScreen.deletedChapters', {
              num: _chapters.length,
            }),
          );
          mutateChapters(chs =>
            chs.map(chapter => {
              if (_chapters.some(_c => _c.id === chapter.id)) {
                return {
                  ...chapter,
                  isDownloaded: false,
                };
              }
              return chapter;
            }),
          );
        });
      }
    },
    [novel, mutateChapters],
  );

  const refreshChapters = useCallback(() => {
    if (novel?.id && !fetching) {
      _getPageChapters(
        novel.id,
        settingsSort,
        settingsFilter,
        currentPage,
      ).then(chs => {
        transformAndSetChapters(chs);
      });
    }
  }, [
    novel?.id,
    fetching,
    settingsSort,
    settingsFilter,
    currentPage,
    transformAndSetChapters,
  ]);

  return {
    mutateChapters,
    updateChapter,
    setChapters: transformAndSetChapters,
    extendChapters,
    bookmarkChapters,
    markPreviouschaptersRead,
    markChapterRead,
    markChaptersRead,
    markPreviousChaptersUnread,
    markChaptersUnread,
    updateChapterProgress,
    deleteChapter,
    deleteChapters,
    refreshChapters,
  };
};
