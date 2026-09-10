import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'copy', '.agent', 'design-system', 'backend/generated']),
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/scripts/**/*'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-refresh/only-export-components': 'off', // Allow exporting hooks and providers together
    }
  },
  {
    files: ['backend/**/*.js', 'src/scripts/**/*.js', 'vite.config.js', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: { 
        ecmaVersion: 'latest',
      },
    },
  }
])

