import { defineConfig } from 'vite-plus';

// Generated output and local state are owned by their respective tools.
const generated = [
  '**/dist/**',
  '**/dist-local/**',
  '**/.vitepress/cache/**',
  '**/.vitepress/dist/**',
  '**/.wrangler/**',
  '**/.tanstack/**',
  '**/.output/**',
  'apps/web/src/routeTree.gen.ts',
  'pnpm-lock.yaml',
];

export default defineConfig({
  lint: {
    ignorePatterns: generated,
    plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y'],
    categories: { correctness: 'error' },
  },
  fmt: {
    ignorePatterns: generated,
    singleQuote: true,
    semi: true,
    sortPackageJson: false,
    overrides: [{ files: ['**/*.jsonc'], options: { trailingComma: 'none' } }],
  },
});
