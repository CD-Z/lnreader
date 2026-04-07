/* eslint-disable no-console */
import {
  ChapterFilterKey,
  ChapterFilterPositiveKey,
  ChapterOrderKey,
} from '@database/constants';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useAppSettings } from './useSettings';
import { ChapterFilterObject, FilterStates } from '@database/utils/filter';
import { useNovelContext } from '@screens/novel/NovelContext';
import { NovelStoreState } from './useNovel/novelStore';
import {
  defaultNovelSettings,
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
} from './useNovel/types';

export { NOVEL_PAGE_INDEX_PREFIX, NOVEL_SETTINGS_PREFIX };

const selectNovel = (state: NovelStoreState) => state.novel;
const selectNovelSettings = (state: NovelStoreState) => state.novelSettings;
const selectSetNovelSettings = (state: NovelStoreState) =>
  state.setNovelSettings;

const useNovelDomainValue = <T>(
  novelStore: ReturnType<typeof useNovelContext>['novelStore'],
  selector: (state: NovelStoreState) => T,
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => novelStore.subscribe(onStoreChange),
    [novelStore],
  );

  const getSnapshot = useCallback(
    () => selector(novelStore.getState()),
    [novelStore, selector],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useNovelSettings = () => {
  const { novelStore } = useNovelContext();
  const { defaultChapterSort } = useAppSettings();

  const novel = useNovelDomainValue(novelStore, selectNovel);
  const domainNovelSettings = useNovelDomainValue(
    novelStore,
    selectNovelSettings,
  );
  const writeNovelSettings = useNovelDomainValue(
    novelStore,
    selectSetNovelSettings,
  );

  const novelSettings = useMemo(
    () => ({ ...defaultNovelSettings, ...domainNovelSettings }),
    [domainNovelSettings],
  );

  const _sort: ChapterOrderKey = novelSettings.sort ?? defaultChapterSort;
  const _filter: ChapterFilterKey[] = novelSettings.filter;
  const filterManager = useRef<ChapterFilterObject | null>(null);

  // #endregion
  // #region setters

  const setChapterSort = useCallback(
    async (sort?: ChapterOrderKey) => {
      if (novel) {
        writeNovelSettings({
          showChapterTitles: novelSettings?.showChapterTitles,
          sort,
          filter: _filter,
        });
      }
    },
    [novel, writeNovelSettings, novelSettings?.showChapterTitles, _filter],
  );
  const setChapterFilter = useCallback(
    async (filter?: ChapterFilterKey[]) => {
      if (novel) {
        writeNovelSettings({
          showChapterTitles: novelSettings?.showChapterTitles,
          sort: _sort,
          filter: filter ?? [],
        });
      }
    },
    [novel, writeNovelSettings, novelSettings?.showChapterTitles, _sort],
  );
  useEffect(() => {
    if (!filterManager.current) {
      filterManager.current = new ChapterFilterObject(
        _filter,
        setChapterFilter,
      );
    }
  }, [_filter, setChapterFilter]);

  const cycleChapterFilter = useCallback(
    (key: ChapterFilterPositiveKey) => {
      filterManager.current?.cycle(key);
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [_filter],
  );

  const setChapterFilterValue = useCallback(
    (key: ChapterFilterPositiveKey, value: keyof FilterStates) => {
      filterManager.current?.set(key, value);
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [_filter],
  );

  const getChapterFilterState = useCallback(
    (key: ChapterFilterPositiveKey) => {
      return filterManager.current?.state(key) ?? false;
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [_filter],
  );

  const getChapterFilter = useCallback(
    (key: ChapterFilterPositiveKey) => filterManager.current?.get(key),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_filter],
  );

  const setShowChapterTitles = useCallback(
    (v: boolean) => {
      writeNovelSettings({ ...novelSettings, showChapterTitles: v });
    },
    [novelSettings, writeNovelSettings],
  );

  // #endregion

  return useMemo(
    () => ({
      ...novelSettings,
      cycleChapterFilter,
      setChapterFilter,
      setChapterFilterValue,
      getChapterFilterState,
      getChapterFilter,
      setChapterSort,
      setShowChapterTitles,
    }),
    [
      cycleChapterFilter,
      getChapterFilter,
      getChapterFilterState,
      novelSettings,
      setChapterFilter,
      setChapterFilterValue,
      setChapterSort,
      setShowChapterTitles,
    ],
  );
};
