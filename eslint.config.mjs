import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'docs/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    prettier // Apply prettier config last to disable conflicting rules
);
