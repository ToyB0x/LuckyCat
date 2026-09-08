import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    include: ['test/**/*.test.{ts,mjs}'],
  },
});
