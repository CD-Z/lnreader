import { buildEditorTheme } from '../editorTheme';
import type { ThemeColors } from '@theme/types';

const lightTheme: ThemeColors = {
  background: '#ffffff',
  onBackground: '#000000',
  primary: '#6200ee',
  secondary: '#03dac6',
  tertiary: '#fef7ff',
  outline: '#737374',
  onSurfaceVariant: '#49454f',
  error: '#ba1a1a',
  isDark: false,
} as ThemeColors;

const darkTheme: ThemeColors = {
  background: '#1e1e1e',
  onBackground: '#f8f8f2',
  primary: '#bd93f9',
  secondary: '#f1fa8c',
  tertiary: '#8be9fd',
  outline: '#6272a4',
  onSurfaceVariant: '#cbcbd4',
  error: '#ff5555',
  isDark: true,
} as ThemeColors;

describe('buildEditorTheme', () => {
  it('maps light theme colors to the editor palette', () => {
    const theme = buildEditorTheme(lightTheme);

    expect(theme.keyword).toBe('#6200ee');
    expect(theme.string).toBe('#03dac6');
    expect(theme.comment).toBe('#737374');
    expect(theme.dark).toBe(false);
  });

  it('uses theme-derived colors in dark mode', () => {
    const theme = buildEditorTheme(darkTheme);

    expect(theme.dark).toBe(true);
    expect(theme.keyword).toBe('#bd93f9');
    expect(theme.selection).toMatch(/^rgba\(/);
    expect(theme.activeLine).toMatch(/^rgba\(/);
    expect(theme.activeLineGutter).toMatch(/^rgba\(/);
  });

  it('provides a value for every editor theme field', () => {
    for (const fixture of [lightTheme, darkTheme]) {
      const theme = buildEditorTheme(fixture);

      expect(typeof theme.dark).toBe('boolean');

      for (const [key, value] of Object.entries(theme) as Array<
        [string, string]
      >) {
        if (key === 'dark') {
          continue;
        }
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});
