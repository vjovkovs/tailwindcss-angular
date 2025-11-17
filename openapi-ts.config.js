import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json', 
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/app/core/api/generated'
  },
lugins: [
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
      name: '@hey-api/sdk',
      validator: 'zod', 
      transformer: true,
    },
    '@tanstack/angular-query-experimental'
  ],
});