import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import ChapterDrawer from '..';

const mockUseNovelContext = jest.fn();
const mockUseChapterContext = jest.fn();

jest.mock('@screens/novel/NovelContext', () => ({
  useNovelContext: () => mockUseNovelContext(),
}));

jest.mock('@screens/reader/ChapterContext', () => ({
  useChapterContext: () => mockUseChapterContext(),
}));

jest.mock('@hooks/persisted', () => ({
  useTheme: () => ({
    surface: '#111',
    outline: '#222',
    onSurface: '#333',
    onSurfaceVariant: '#444',
  }),
  useAppSettings: () => ({
    defaultChapterSort: 'positionAsc',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));

jest.mock('@strings/translations', () => ({
  getString: (key: string) => key,
}));

jest.mock('@components/index', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    Button: ({ title, onPress }: any) =>
      React.createElement(
        Pressable,
        { testID: `btn-${title}`, onPress },
        React.createElement(Text, null, title),
      ),
    LoadingScreenV2: () => React.createElement(View, { testID: 'loading' }),
  };
});

jest.mock('../RenderListChapter', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return ({ item, onPress }: any) =>
    React.createElement(
      Pressable,
      { testID: `chapter-${item.id}`, onPress },
      React.createElement(Text, null, item.name),
    );
});

jest.mock('@legendapp/list', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    LegendList: ({ data = [], renderItem, onEndReached }: any) =>
      React.createElement(
        View,
        null,
        ...data.map((item: any, index: number) =>
          React.createElement(
            React.Fragment,
            { key: item.id ?? index },
            renderItem({ item, index }),
          ),
        ),
        React.createElement(
          Pressable,
          { testID: 'legend-end-reached', onPress: () => onEndReached?.() },
          React.createElement(Text, null, 'end'),
        ),
      ),
  };
});

const makeChapter = (id: number, page = '1') => ({
  id,
  novelId: 7,
  name: `Chapter ${id}`,
  path: `/chapter/${id}`,
  page,
  position: id,
  unread: true,
  isDownloaded: false,
  bookmark: false,
  progress: 0,
  releaseTime: '2026-01-01',
  updatedTime: '2026-01-01',
  readTime: '2026-01-01',
});

const createStore = (overrides: Record<string, unknown> = {}) => {
  const state = {
    chapters: [makeChapter(1, '1'), makeChapter(2, '2')],
    novelSettings: { sort: 'positionAsc', filter: [] },
    pages: ['1', '2'],
    fetching: false,
    batchInformation: { batch: 0, total: 1, totalChapters: 2 },
    getNextChapterBatch: jest.fn(),
    setPageIndex: jest.fn(),
    ...overrides,
  };

  return {
    getState: () => state,
    subscribe: jest.fn(() => () => {}),
    state,
  };
};

const createNovelContext = (overrides: Record<string, unknown> = {}) => ({
  novelStore: createStore(),
  navigationBarHeight: 0,
  statusBarHeight: 0,
  ...overrides,
});

describe('ChapterDrawer (task 12 context boundary cutover)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses novelStore selector-backed page index and pagination batch actions', async () => {
    const store = createStore();
    mockUseChapterContext.mockReturnValue({
      chapter: makeChapter(10, '2'),
      getChapter: jest.fn(),
      setLoading: jest.fn(),
    });
    mockUseNovelContext.mockReturnValue(
      createNovelContext({
        novelStore: store,
      }),
    );

    render(<ChapterDrawer />);

    await waitFor(() => {
      expect(store.state.setPageIndex).toHaveBeenCalledWith(1);
    });

    fireEvent.press(screen.getByTestId('legend-end-reached'));

    expect(store.state.getNextChapterBatch).toHaveBeenCalledTimes(1);
  });
});
