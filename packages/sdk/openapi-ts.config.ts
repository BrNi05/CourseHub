import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../openapi.json',
  output: './src',
  plugins: [
    '@hey-api/client-axios',
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
    {
      name: '@hey-api/sdk',
    },
  ],
});
