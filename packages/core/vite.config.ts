import { defineConfig } from 'vite-plus';

export default defineConfig({ test: { name: 'core', environment: 'node', include: ['test/**/*.test.mjs'] } });
