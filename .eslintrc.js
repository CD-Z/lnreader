module.exports = {
  root: true,
  extends: ['@react-native'],
  overrides: [
    {
      // Test files only
      plugins: ['jest'],
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react', 'plugin:jest/recommended'],
    },
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        'no-shadow': 'off',
        'no-undef': 'off',
        'no-console': 'error',
        '@typescript-eslint/no-shadow': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        'curly': ['error', 'multi-line', 'consistent'],
        'no-useless-return': 'error',
        'block-scoped-var': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'no-dupe-else-if': 'error',
        'no-duplicate-imports': 'error',
        '@react-native/no-deep-imports': 0,
      },
    },
  ],
};
