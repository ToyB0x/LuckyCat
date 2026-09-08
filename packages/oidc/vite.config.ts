import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'oidc',
    environment: 'node',
    include: ['test/**/*.test.{ts,mjs}'],
  },
});
