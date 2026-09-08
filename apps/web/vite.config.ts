import { defineConfig } from 'vite-plus';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: { proxy: { '/local-debug': 'http://127.0.0.1:8787' } },
  plugins: [tanstackStart(), react()],
});
