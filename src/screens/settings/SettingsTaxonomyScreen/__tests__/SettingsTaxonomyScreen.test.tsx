import { fireEvent, render, screen } from '@testing-library/react-native';

import { getNovelsWithGenresFromDb } from '@database/queries/StatsQueries';

import SettingsTaxonomyScreen from '../SettingsTaxonomyScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => () => void) => {
    require('react').useEffect(callback, [callback]);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, right: 0 }),
}));

let mockTaxonomy: { parent: string; children: string[] }[] = [];
const mockSetTaxonomy = jest.fn(
  (next: { parent: string; children: string[] }[]) => {
    mockTaxonomy = next;
  },
);

jest.mock('@hooks/persisted', () => ({
  useTheme: () => ({
    background: '#111',
    rippleColor: '#222',
    onSurface: '#333',
    onSurfaceVariant: '#444',
    primary: '#555',
  }),
}));

jest.mock('@hooks/persisted/useGenreTaxonomy', () => ({
  useGenreTaxonomy: () => ({
    taxonomy: mockTaxonomy,
    setTaxonomy: mockSetTaxonomy,
  }),
}));

jest.mock('@database/queries/StatsQueries', () => ({
  getNovelsWithGenresFromDb: jest.fn(),
}));

jest.mock('@i18n/translations', () => ({
  getString: (key: string) => key,
}));

jest.mock('react-native-paper', () => {
  const React = require('react');
  const { Pressable, Text, TextInput } = require('react-native');
  const MockTextInput = (props: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(TextInput, { ...props, testID: props.label }),
      props.right,
    );
  MockTextInput.Icon = ({ icon, onPress, disabled }: any) =>
    React.createElement(
      Pressable,
      { testID: `icon-${icon}`, onPress, disabled },
      React.createElement(Text, null, icon),
    );

  return {
    TextInput: MockTextInput,
    FAB: ({ label, onPress }: any) =>
      React.createElement(
        Pressable,
        { onPress },
        React.createElement(Text, null, label),
      ),
    IconButton: ({ icon, onPress, disabled }: any) =>
      React.createElement(
        Pressable,
        { testID: `icon-${icon}`, onPress, disabled },
        React.createElement(Text, null, icon),
      ),
  };
});

jest.mock('@components', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  const PassThrough = ({ children }: any) =>
    React.createElement(React.Fragment, null, children);

  const Dialog: any = () => null;
  Dialog.Root = PassThrough;
  Dialog.Header = PassThrough;
  Dialog.Title = PassThrough;
  Dialog.Content = PassThrough;
  Dialog.Actions = PassThrough;
  Dialog.Action = ({ children, onPress }: any) =>
    React.createElement(
      Pressable,
      { onPress },
      React.createElement(Text, null, children),
    );

  const List: any = () => null;
  List.Section = PassThrough;
  List.SubHeader = () => null;
  List.Item = ({ title, onPress }: any) =>
    React.createElement(
      Pressable,
      { onPress },
      React.createElement(Text, null, title),
    );

  return {
    SafeAreaView: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    Appbar: () => null,
    Dialog,
    List,
  };
});

jest.mock(
  '@components/ConfirmationDialog/ConfirmationDialog',
  () => () => null,
);

const renderScreen = () =>
  render(<SettingsTaxonomyScreen navigation={{} as any} route={{} as any} />);

describe('SettingsTaxonomyScreen', () => {
  beforeEach(() => {
    mockTaxonomy = [{ parent: 'Fantasy', children: ['Sci-Fi'] }];
    mockSetTaxonomy.mockClear();
    jest
      .mocked(getNovelsWithGenresFromDb)
      .mockImplementation(() => new Promise(() => {}));
  });

  it('refuses a parent that normalizes to an existing parent', () => {
    renderScreen();
    fireEvent.press(screen.getByText('genreStats.newGroup'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.parentNamePlaceholder'),
      'fantasy',
    );
    fireEvent.press(screen.getByText('common.ok'));
    expect(mockSetTaxonomy).not.toHaveBeenCalled();
  });

  it('adds a parent with a distinct normalized name', () => {
    renderScreen();
    fireEvent.press(screen.getByText('genreStats.newGroup'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.parentNamePlaceholder'),
      'Comedy',
    );
    fireEvent.press(screen.getByText('common.ok'));
    expect(mockSetTaxonomy).toHaveBeenCalledWith([
      { parent: 'Fantasy', children: ['Sci-Fi'] },
      { parent: 'Comedy', children: [] },
    ]);
  });

  it('stays in the dialog to add subgenres right after adding a parent', () => {
    renderScreen();
    fireEvent.press(screen.getByText('genreStats.newGroup'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.parentNamePlaceholder'),
      'Comedy',
    );
    fireEvent.press(screen.getByText('common.ok'));
    // Dialog switched to edit mode for the new parent: child input is live
    fireEvent.changeText(
      screen.getByTestId('genreStats.childNamePlaceholder'),
      'Slice of Life',
    );
    fireEvent.press(screen.getByTestId('icon-plus'));
    expect(mockSetTaxonomy).toHaveBeenLastCalledWith([
      { parent: 'Fantasy', children: ['Sci-Fi'] },
      { parent: 'Comedy', children: ['Slice of Life'] },
    ]);
  });

  it('refuses renaming a parent to a normalized duplicate', () => {
    mockTaxonomy = [
      { parent: 'Fantasy', children: [] },
      { parent: 'Romance', children: [] },
    ];
    renderScreen();
    fireEvent.press(screen.getByText('Fantasy'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.parentNamePlaceholder'),
      'romance',
    );
    fireEvent.press(screen.getByText('common.ok'));
    expect(mockSetTaxonomy).not.toHaveBeenCalled();
  });

  it('refuses a child that normalizes to an existing child', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Fantasy'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.childNamePlaceholder'),
      'SCIFI',
    );
    fireEvent.press(screen.getByTestId('icon-plus'));
    expect(mockSetTaxonomy).not.toHaveBeenCalled();
  });

  it('adds a child with a distinct normalized name', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Fantasy'));
    fireEvent.changeText(
      screen.getByTestId('genreStats.childNamePlaceholder'),
      'Harem',
    );
    fireEvent.press(screen.getByTestId('icon-plus'));
    expect(mockSetTaxonomy).toHaveBeenCalledWith([
      { parent: 'Fantasy', children: ['Sci-Fi', 'Harem'] },
    ]);
  });

  it('suggests ungrouped library genres and adds one to the group', async () => {
    jest.mocked(getNovelsWithGenresFromDb).mockResolvedValue([
      {
        id: 1,
        name: 'Novel',
        path: '',
        cover: null,
        pluginId: '',
        genres: 'Sci Fi, Wuxia',
        status: null,
      },
    ]);
    renderScreen();
    fireEvent.press(screen.getByText('Fantasy'));
    expect(await screen.findByText('Wuxia')).toBeTruthy();
    expect(screen.queryByText('Sci Fi')).toBeNull();
    fireEvent.press(screen.getByText('Wuxia'));
    expect(mockSetTaxonomy).toHaveBeenLastCalledWith([
      { parent: 'Fantasy', children: ['Sci-Fi', 'Wuxia'] },
    ]);
  });
});
