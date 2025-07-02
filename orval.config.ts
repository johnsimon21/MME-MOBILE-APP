import { defineConfig } from 'orval';

export default defineConfig({
  mme: {
    output: {
      mode: 'tags-split',
      target: 'src/infrastructure/api/generated',
      schemas: 'src/infrastructure/api/generated/model',
      client: 'axios',
      mock: true,
      override: {
        mutator: {
          path: 'src/infrastructure/api/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
    input: {
      target: 'http://localhost:3000/api/docs-json',
      // Alternative: use local file if you want to avoid running server
      // target: './swagger.json',
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
