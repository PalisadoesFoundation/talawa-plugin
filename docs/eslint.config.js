const js = require('@eslint/js');
const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const imports = require('eslint-plugin-import');
const prettier = require('eslint-plugin-prettier');
const react = require('eslint-plugin-react');
const tsdoc = require('eslint-plugin-tsdoc');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      '.docusaurus/**',
      'docker/**',
      '*.json',
      '*.md',
      '*.css',
      '*.scss',
      '*.less',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
    ],
  },

  // TypeScript and TSX files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',

        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      react,
      '@typescript-eslint': ts,
      import: imports,
      prettier,
      tsdoc,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'import/no-duplicates': 'error',
      'no-undef': 'off',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^(TestInterface|I|Interface)[A-Z]', match: true } },
        { selector: ['typeAlias', 'typeLike', 'enum'], format: ['PascalCase'] },
        { selector: 'typeParameter', format: ['PascalCase'], prefix: ['T'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'memberLike', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'require' },
        { selector: 'variable', modifiers: ['exported'], format: null },
      ],
      'react/jsx-pascal-case': ['error', { allowAllCaps: false, allowNamespace: false }],
      'react/no-this-in-sfc': 'error',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
    },
  },

  // Config files
  {
    files: ['*.config.ts', '*.config.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': ts, prettier },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'error',
      'prettier/prettier': 'error',
    },
  },
];
