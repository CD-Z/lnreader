 
import { useMMKVObject } from 'react-native-mmkv';
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
import { NovelStoreApi, NovelStoreState } from './useNovel/novelStore';
import {
  defaultNovelSettings,
  NovelSettings,
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
} from './useNovel/types';

export { NOVEL_PAGE_INDEX_PREFIX, NOVEL_SETTINGS_PREFIX };

// #endregion
// #region definition useNovel

type NovelContextWithOptionalStore = ReturnType<typeof useNovelContext> & {
  novelStore?: NovelStoreApi;
};

const noopUnsubscribe = () => {};

const selectNovel = (state: NovelStoreState) => state.novel;
const selectNovelSettings = (state: NovelStoreState) => state.novelSettings;
const selectSetNovelSettings = (state: NovelStoreState) =>
  state.setNovelSettings;

const useNovelDomainValue = <T>(
  novelStore: NovelStoreApi | undefined,
  selector: (state: NovelStoreState) => T,
  fallback: T,
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      novelStore ? novelStore.subscribe(onStoreChange) : noopUnsubscribe,
    [novelStore],
  );

  const getSnapshot = useCallback(
    () => (novelStore ? selector(novelStore.getState()) : fallback),
    [fallback, novelStore, selector],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useNovelSettings = () => {
  const novelContext = useNovelContext() as NovelContextWithOptionalStore;
  const { defaultChapterSort } = useAppSettings();

  const contextNovel = novelContext.novel;
  const novel = useNovelDomainValue(
    novelContext.novelStore,
    selectNovel,
    contextNovel,
  );

  const [ns, setNovelSettings] = useMMKVObject<NovelSettings>(
    `${NOVEL_SETTINGS_PREFIX}_${novel?.pluginId}_${novel?.path}`,
  );

  const fallbackSetNovelSettings = useCallback(
    (settings: NovelSettings) => setNovelSettings(settings),
    [setNovelSettings],
  );

  const persistedNovelSettings = useMemo(
    () => ({ ...defaultNovelSettings, ...ns }),
    [ns],
  );

  const domainNovelSettings = useNovelDomainValue(
    novelContext.novelStore,
    selectNovelSettings,
    persistedNovelSettings,
  );

  const applyNovelSettings = useNovelDomainValue(
    novelContext.novelStore,
    selectSetNovelSettings,
    fallbackSetNovelSettings,
  );

  const writeNovelSettings = useCallback(
    (settings: NovelSettings) => {
      setNovelSettings(settings);
      if (novelContext.novelStore) {
        applyNovelSettings(settings);
      }
    },
    [applyNovelSettings, novelContext.novelStore, setNovelSettings],
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
