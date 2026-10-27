import js from '@eslint/js'
import globals from 'globals'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import path from 'node:path'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist', 'dist-ssr', '.cache', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooksPlugin.configs.flat.recommended,
      ...tseslint.configs.recommendedTypeChecked, // Strict typed linting
      ...tseslint.configs.stylisticTypeChecked, // Consistent stylistic rules
    ],
    languageOptions: {
      ecmaVersion: 'latest', // 2026 ECMAScript standard
      globals: {
        ...globals.browser,
        ...globals.es2026,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.resolve(import.meta.dirname, '..'),
      },
    },
    plugins: {
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettierConfig,
)
