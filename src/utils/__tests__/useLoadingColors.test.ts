import { ThemeColors } from '@theme/types';
import { getLoadingColors } from '../useLoadingColors';

jest.mock('@hooks/persisted', () => ({
  useAppSettings: jest.fn(),
}));

const createTheme = (surface: string, onSurface: string) =>
  ({ surface, onSurface } as ThemeColors);

describe('getLoadingColors', () => {
  it.each([
    [
      'light',
      createTheme('rgb(254, 251, 255)', 'rgb(27, 27, 31)'),
      ['#D1CED2', '#E7E5E9'],
    ],
    [
      'dark',
      createTheme('rgb(27, 27, 31)', 'rgb(228, 226, 230)'),
      ['#434347', '#2F2F33'],
    ],
    ['pure black', createTheme('#000000', '#ffffff'), ['#333333', '#191919']],
  ])(
    'creates clearly visible animated colors for the %s theme',
    (_, theme, expected) => {
      expect(getLoadingColors(theme)).toEqual(expected);
    },
  );

  it.each([
    [
      'light',
      createTheme('rgb(254, 251, 255)', 'rgb(27, 27, 31)'),
      ['#D1CED2', '#E3E0E4'],
    ],
    [
      'dark',
      createTheme('rgb(27, 27, 31)', 'rgb(228, 226, 230)'),
      ['#434347', '#333337'],
    ],
    ['pure black', createTheme('#000000', '#ffffff'), ['#333333', '#1F1F1F']],
  ])('increases static contrast for the %s theme', (_, theme, expected) => {
    expect(getLoadingColors(theme, true)).toEqual(expected);
  });
});
