import { fireEvent, render, screen } from '@test-utils';
import type { ReactNode } from 'react';
import { ReplaceItem } from '../ListItems';
import Snippet from '../Snippet';

const theme = {
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#21005d',
  onSurface: '#1d1b20',
  onSurfaceVariant: '#49454f',
  onTertiaryContainer: '#31111d',
  outline: '#79747e',
  primary: '#6750a4',
  primaryContainer: '#eaddff',
  rippleColor: 'rgba(103, 80, 164, 0.12)',
  secondaryContainer: '#e8def8',
  surfaceVariant: '#e7e0ec',
  tertiaryContainer: '#ffd8e4',
};

jest.mock('@hooks/persisted', () => ({
  useTheme: () => theme,
}));

jest.mock('@components/AppErrorBoundary/AppErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@screens/novel/NovelContext', () => ({
  NovelContextProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const { View } = jest.requireActual('react-native');
  const frame = { height: 800, width: 400, x: 0, y: 0 };
  const insets = { bottom: 0, left: 0, right: 0, top: 0 };

  return {
    SafeAreaFrameContext: ReactModule.createContext(frame),
    SafeAreaInsetsContext: ReactModule.createContext(insets),
    SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children: ReactNode }) =>
      ReactModule.createElement(View, props, children),
    initialWindowMetrics: { frame, insets },
    useSafeAreaFrame: () => frame,
    useSafeAreaInsets: () => insets,
  };
});

jest.mock('@i18n/translations', () => ({
  getString: (key: string) =>
    ({
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'customCodeSettings.renameHint': 'Long press to rename',
      'customCodeSettings.replace': 'Replace',
    }[key] ?? key),
}));

describe('custom code cards', () => {
  it('opens and deletes a replacement rule using explicit actions', () => {
    const editItem = jest.fn();
    const removeItem = jest.fn();

    render(
      <ReplaceItem
        item={['Chapter ', 'Ch. ']}
        editItem={editItem}
        removeItem={removeItem}
      />,
    );

    fireEvent.press(screen.getByLabelText('Edit'));
    expect(editItem).toHaveBeenCalledWith(['Chapter ', 'Ch. ']);

    fireEvent.press(screen.getByLabelText('Delete'));
    expect(removeItem).toHaveBeenCalledWith('Chapter ');
  });

  it('supports editing, renaming, toggling, and deleting a snippet', () => {
    const deleteSnippet = jest.fn();
    const edit = jest.fn();
    const rename = jest.fn();
    const toggle = jest.fn();

    render(
      <Snippet
        delete={deleteSnippet}
        edit={edit}
        index={2}
        rename={rename}
        snippet={{
          active: true,
          code: 'p { margin-block: 1.4em; }',
          lang: 'css',
          name: 'Bigger paragraph spacing',
        }}
        toggle={toggle}
      />,
    );

    const card = screen.getByRole('button', {
      name: 'Bigger paragraph spacing',
    });
    expect(card.props.onPress).toBeUndefined();

    fireEvent(card, 'longPress');
    expect(rename).toHaveBeenCalledWith(2, false, 'Bigger paragraph spacing');

    fireEvent.press(screen.getByLabelText('Edit'));
    expect(edit).toHaveBeenCalledWith(2, false);

    fireEvent.press(screen.getByRole('switch'));
    expect(toggle).toHaveBeenCalledWith(2, false);

    fireEvent.press(screen.getByLabelText('Delete'));
    expect(deleteSnippet).toHaveBeenCalledWith(2, false);
  });
});
