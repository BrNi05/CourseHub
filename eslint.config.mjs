import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// NestJS rules
import enforceSerializeDecoratorRule from './eslint-rules/backend/enforce-serializer.mjs';
import noPrismaImport from './eslint-rules/backend/no-prismaimport.mjs';
import noApiProperty from './eslint-rules/backend/apiproperty.mjs';
import requireThrottable from './eslint-rules/backend/throttable-decorator.mjs';
import requireTests from './eslint-rules/backend/require-tests.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  js.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],

  // TypeScript & Prettier
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        project: [
          path.join(__dirname, 'tsconfig.base.json'),
          path.join(__dirname, 'apps/backend/tsconfig.json'),
          path.join(__dirname, 'apps/client/tsconfig.json'),
          path.join(__dirname, 'packages/sdk/tsconfig.json'),
          path.join(__dirname, 'tsconfig.eslint.json'),
        ],
        tsconfigRootDir: __dirname,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      internal: {
        rules: {
          'no-serializer': enforceSerializeDecoratorRule,
          'no-prismaimport': noPrismaImport,
          'no-apiproperty': noApiProperty,
          'throttable-decorator': requireThrottable,
          'require-tests': requireTests,
        },
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      'internal/no-serializer': 'error',
      'internal/no-apiproperty': 'error',
      'internal/no-prismaimport': [
        'error',
        { packages: ['@prisma_client', '@prisma/client'] },
      ],
      'internal/throttable-decorator': 'error',
      'internal/require-tests': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      //'@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      '@typescript-eslint/unbound-method': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },

  // Vue-specific rules
  {
    files: ['**/*.vue'],
    rules: {
      'vue/html-indent': ['warn', 2],
      'vue/max-attributes-per-line': ['warn', { singleline: 5 }],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: { void: 'always', normal: 'never', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/script-indent': 'off',
    },
  },

  // Ignore generated files and development tools
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/build/**',
      '**/generated/**',
      '**/.turbo/**',
      'dev-tools/**',
      'packages/sdk/src/**',
      'apps/backend/public/**',
      'apps/backend/openapi.generate.ts',
      'apps/client/dist/**',
    ],
  },

  // Special config for root TS config files
  {
    files: ['vite.config.ts', 'uno.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: null },
    },
  },
]);
