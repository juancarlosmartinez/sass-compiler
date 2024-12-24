// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'dist',
            'node_modules',
            'coverage',
            'index.js',
            'jest.config.js',
            'test/**/*.js',
        ]
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
);