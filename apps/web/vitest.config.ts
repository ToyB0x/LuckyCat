import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { name: 'web', environment: 'jsdom', include: ['test/**/*.test.tsx'] },
});
