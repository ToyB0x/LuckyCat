import { createFileRoute, notFound } from '@tanstack/react-router';
import { DiagnosticPreview } from '../diagnostics/preview';

export const Route = createFileRoute('/dev/diagnostics')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({
    meta: [{ title: 'LuckyCat · UI preview' }, { name: 'robots', content: 'noindex' }],
  }),
  component: () => (import.meta.env.DEV ? <DiagnosticPreview /> : null),
});
