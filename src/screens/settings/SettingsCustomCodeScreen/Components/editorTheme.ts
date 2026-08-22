import Color from 'color';
import type { ThemeColors } from '@theme/types';

export interface EditorTheme {
  background: string;
  foreground: string;
  gutterBackground?: string;
  gutterForeground?: string;
  selection?: string;
  activeLine?: string;
  activeLineGutter?: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  type: string;
  comment: string;
  variable: string;
  punctuation: string;
  invalid: string;
  dark: boolean;
}

export function buildEditorTheme(theme: ThemeColors): EditorTheme {
  const activeLine = Color(theme.onBackground)
    .alpha(theme.isDark ? 0.06 : 0.04)
    .rgb()
    .string();

  return {
    background: theme.background,
    foreground: theme.onBackground,
    gutterBackground: theme.background,
    gutterForeground: theme.outline,
    selection: Color(theme.primary).alpha(0.3).rgb().string(),
    activeLine,
    activeLineGutter: activeLine,
    keyword: theme.primary,
    string: theme.secondary,
    number: theme.secondary,
    function: theme.tertiary,
    type: theme.tertiary,
    comment: theme.outline,
    variable: theme.onBackground,
    punctuation: theme.onSurfaceVariant,
    invalid: theme.error,
    dark: theme.isDark,
  };
}
