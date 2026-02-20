const mockTheme = {
  primary: '#6200ee',
  onPrimary: '#ffffff',
  secondary: '#03dac6',
  onSecondary: '#000000',
  surface: '#ffffff',
  onSurface: '#000000',
  background: '#ffffff',
  onBackground: '#000000',
  surfaceVariant: '#ededed',
  outline: '#737374',
  shadow: '#000000',
  inverseSurface: '#1f1f1f',
  inverseOnSurface: '#ffffff',
  elevation: {
    level0: '#ffffff',
    level1: '#f2f2f2',
    level2: '#ededed',
    level3: '#e8e8e8',
    level4: '#e3e3e3',
    level5: '#dedede',
  },
  isDark: false,
  id: 0,
};

const useTheme = jest.fn(() => mockTheme);

export default useTheme;
export { mockTheme };
