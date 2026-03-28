import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { RouteProp } from '@react-navigation/native';
import { useStore } from 'zustand';
import { ReaderStackParamList } from '@navigators/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeviceOrientation } from '@hooks/index';
import { useLibraryContext } from '@components/Context/LibraryContext';
import { useAppSettings } from '@hooks/persisted';
import { novelPersistence } from '@hooks/persisted/useNovel/contracts';
import { createNovelStore } from '@hooks/persisted/useNovel/novelStore';
import {
  NovelStoreActions,
  NovelStoreApi,
  NovelStoreData,
  NovelStoreState,
} from '@hooks/persisted/useNovel/novelStore.types';
import { NovelInfo } from '@database/types';
import { getNovelById, getNovelByPath } from '@database/queries/NovelQueries';
import { useLiveQuery, useLiveQueryAsync } from '@database/manager/manager';
import { dbManager } from '@database/db';
import { chapterSchema } from '@database/schema';
import { eq } from 'drizzle-orm';

type Props = {
  children: React.ReactNode;
  route:
    | RouteProp<ReaderStackParamList, 'Novel'>
    | RouteProp<ReaderStackParamList, 'Chapter'>;
};

type NovelLayout = {
  navigationBarHeight: number;
  statusBarHeight: number;
};

const NovelStoreContext = createContext<NovelStoreApi | null>(null);
const NovelLayoutContext = createContext<NovelLayout | null>(null);

export function NovelContextProvider({ children, route }: Props) {
  console.time('novel contex');
  const initialNovel =
    'id' in route.params ? (route.params as NovelInfo) : undefined;

  const { path, pluginId } =
    'novel' in route.params ? route.params.novel : route.params;
  const storeKey = `${pluginId}:${path}`;

  const { switchNovelToLibrary } = useLibraryContext();
  const { defaultChapterSort } = useAppSettings();

  const defaultChapterSortRef = useRef(defaultChapterSort);
  const switchNovelToLibraryRef = useRef(switchNovelToLibrary);

  const persistendInput = useMemo(
    () => ({
      pluginId,
      novelPath: path,
    }),
    [pluginId, path],
  );

  const storeRef = useRef<{
    key: string;
    store: NovelStoreApi;
  } | null>(null);
  const queriedNovelRef = useRef<boolean>(false);
  console.timeLog(
    'novel contex',
    'Checking store initialization for novel:',
    storeKey,
  );
  if (storeRef.current?.key !== storeKey) {
    queriedNovelRef.current = false;
    const novel = initialNovel?.id
      ? getNovelById(initialNovel.id)
      : getNovelByPath(path, pluginId) ?? initialNovel;

    const chs = novel?.id
      ? dbManager.allSync(
          dbManager
            .select()
            .from(chapterSchema)
            .where(eq(chapterSchema.novelId, novel.id)),
        )
      : [];

    if (novel?.id) {
      queriedNovelRef.current = true;
    }
    console.timeLog(
      'novel contex',
      'Creating novel store for novel:',
      novel?.name,
      'with chapters:',
      chs.length,
    );
    storeRef.current = {
      key: storeKey,
      store: createNovelStore({
        pluginId,
        novelPath: path,
        chapters: chs,
        novel,
        defaultChapterSort: defaultChapterSortRef.current,
        initialPageIndex: novelPersistence.readPageIndex({
          pluginId,
          novelPath: path,
        }),
        initialNovelSettings:
          novelPersistence.readSettings(persistendInput) ?? undefined,
        initialLastRead: novelPersistence.readLastRead({
          pluginId,
          novelPath: path,
        }),
        dependencies: {
          persistPageIndex: value =>
            novelPersistence.writePageIndex(persistendInput, value),
          persistNovelSettings: value =>
            novelPersistence.writeSettings(persistendInput, value),
          persistLastRead: chapter =>
            novelPersistence.writeLastRead(persistendInput, chapter),
          switchNovelToLibrary: (novelPath, currentPluginId) =>
            switchNovelToLibraryRef.current(novelPath, currentPluginId),
        },
      }),
    };
  }
  console.timeLog('novel contex', 'Novel store ready for novel:', storeKey);
  const novelStore = storeRef.current.store;

  if (!queriedNovelRef.current) {
    novelStore.getState().actions.bootstrapNovel();
  }

  const { bottom, top } = useSafeAreaInsets();
  const orientation = useDeviceOrientation();

  const navigationBarHeightRef = useRef(bottom);
  const statusBarHeightRef = useRef(top);

  if (bottom < navigationBarHeightRef.current && orientation === 'landscape') {
    navigationBarHeightRef.current = bottom;
  } else if (bottom > navigationBarHeightRef.current) {
    navigationBarHeightRef.current = bottom;
  }

  if (top > statusBarHeightRef.current) {
    statusBarHeightRef.current = top;
  }

  const layoutValue = useMemo(
    () => ({
      navigationBarHeight: navigationBarHeightRef.current,
      statusBarHeight: statusBarHeightRef.current,
    }),
    [],
  );
  console.timeEnd('novel contex');
  return (
    <NovelStoreContext.Provider value={novelStore}>
      <NovelLayoutContext.Provider value={layoutValue}>
        {children}
      </NovelLayoutContext.Provider>
    </NovelStoreContext.Provider>
  );
}

function useNovelStoreApi() {
  const store = useContext(NovelStoreContext);

  if (!store) {
    throw new Error('useNovelStore must be used inside NovelContextProvider');
  }

  return store;
}

export function useNovelStore<T>(selector: (state: NovelStoreState) => T): T {
  const store = useNovelStoreApi();
  return useStore(store, selector);
}

export function useNovelState<T>(selector: (state: NovelStoreData) => T): T {
  return useNovelStore(state => selector(state));
}

export function useNovelValue<K extends keyof NovelStoreData>(
  key: K,
): NovelStoreData[K] {
  return useNovelStore(state => state[key]);
}

export function useNovelActions(): NovelStoreActions {
  return useNovelStore(state => state.actions);
}

export function useNovelAction<K extends keyof NovelStoreActions>(
  key: K,
): NovelStoreActions[K] {
  return useNovelStore(state => state.actions[key]);
}

export function useNovelLayout() {
  const context = useContext(NovelLayoutContext);

  if (!context) {
    throw new Error('useNovelLayout must be used inside NovelContextProvider');
  }

  return context;
}
