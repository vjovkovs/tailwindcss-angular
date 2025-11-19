import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi-updated.json', 
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/app/core/api/generated'
  },
  plugins: [
    '@hey-api/schemas',
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/zod',
      dates: {
        local: true, // Allow date-only strings without timezone
        offset: false, // Don't require timezone offset
      },
    },
    {
      name: '@hey-api/sdk',
      validator: 'zod',
      transformer: true,
    },
    '@tanstack/angular-query-experimental'
  ],
});