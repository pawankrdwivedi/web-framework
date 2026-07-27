module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  overrides: [
    {
      files: ['app/**', 'qe-framework-core/**'],
      env: {
        browser: true,
        node: true,
        jest: true,
      },
      globals: {
        expect: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
  ],
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Keep fixes conservative: warn for unused vars and allow underscore-prefixed vars
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
  },
};

