type Formatter = {
  format: (
    code: string,
    options: {
      parser: 'babel' | 'css';
      plugins: unknown[];
      singleQuote: boolean;
      tabWidth: number;
    },
  ) => string;
};

export const formatSnippet = (code: string, language: 'css' | 'js'): string => {
  const prettier = require('prettier/standalone') as Formatter;
  const parser =
    language === 'css'
      ? require('prettier/parser-postcss')
      : require('prettier/parser-babel');

  return prettier
    .format(code, {
      parser: language === 'css' ? 'css' : 'babel',
      plugins: [parser],
      singleQuote: true,
      tabWidth: 2,
    })
    .trimEnd();
};
