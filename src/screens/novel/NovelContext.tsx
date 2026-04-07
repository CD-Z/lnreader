import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { RouteProp } from '@react-navigation/native';
import { ReaderStackParamList } from '@navigators/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeviceOrientation } from '@hooks/index';
import { NovelInfo } from '@database/types';
import { useLibraryContext } from '@components/Context/LibraryContext';
import { useAppSettings } from '@hooks/persisted';
import { createNovelStore } from '@hooks/persisted/useNovel/novelStore';
import { novelPersistence } from '@hooks/persisted/useNovel/contracts';

type NovelContextType = {
  novelStore: ReturnType<typeof createNovelStore>;
  navigationBarHeight: number;
  statusBarHeight: number;
};

const defaultValue = {} as NovelContextType;

const NovelContext = createContext<NovelContextType>(defaultValue);

export function NovelContextProvider({
  children,

  route,
}: {
  children: React.JSX.Element;

  route:
    | RouteProp<ReaderStackParamList, 'Novel'>
    | RouteProp<ReaderStackParamList, 'Chapter'>;
}) {
  const { path, pluginId } =
    'novel' in route.params ? route.params.novel : route.params;

  const { switchNovelToLibrary } = useLibraryContext();
  const { defaultChapterSort } = useAppSettings();

  const novelStore = useMemo(
    () =>
      createNovelStore({
        pluginId,
        novelPath: path,
        novel: 'id' in route.params ? (route.params as NovelInfo) : undefined,
        defaultChapterSort,
        initialPageIndex: novelPersistence.readPageIndex({
          pluginId,
          novelPath: path,
        }),
        initialNovelSettings:
          novelPersistence.readSettings({
            pluginId,
            novelPath: path,
          }) ?? undefined,
        initialLastRead: novelPersistence.readLastRead({
          pluginId,
          novelPath: path,
        }),
        dependencies: {
          persistPageIndex: value =>
            novelPersistence.writePageIndex(
              {
                pluginId,
                novelPath: path,
              },
              value,
            ),
          persistNovelSettings: value =>
            novelPersistence.writeSettings(
              {
                pluginId,
                novelPath: path,
              },
              value,
            ),
          persistLastRead: chapter =>
            novelPersistence.writeLastRead(
              {
                pluginId,
                novelPath: path,
              },
              chapter,
            ),
          switchNovelToLibrary,
        },
      }),
    [defaultChapterSort, path, pluginId, route.params, switchNovelToLibrary],
  );

  useEffect(() => {
    void novelStore.getState().bootstrapNovel();
  }, [novelStore]);

  const { bottom, top } = useSafeAreaInsets();
  const orientation = useDeviceOrientation();
  const NavigationBarHeight = useRef(bottom);
  const StatusBarHeight = useRef(top);

  if (bottom < NavigationBarHeight.current && orientation === 'landscape') {
    NavigationBarHeight.current = bottom;
  } else if (bottom > NavigationBarHeight.current) {
    NavigationBarHeight.current = bottom;
  }
  if (top > StatusBarHeight.current) {
    StatusBarHeight.current = top;
  }
  const contextValue = useMemo(
    () => ({
      novelStore,
      navigationBarHeight: NavigationBarHeight.current,
      statusBarHeight: StatusBarHeight.current,
    }),
    [novelStore],
  );
  return (
    <NovelContext.Provider value={contextValue}>
      {children}
    </NovelContext.Provider>
  );
}

export const useNovelContext = () => {
  const context = useContext(NovelContext);
  return context;
};
