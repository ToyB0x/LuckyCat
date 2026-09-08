import { createFileRoute, notFound } from '@tanstack/react-router';
import { DiagnosticHistory } from '../diagnostics/history';

export const Route = createFileRoute('/dev/history')({
  beforeLoad: () => { if (!import.meta.env.DEV) throw notFound(); },
  head: () => ({ meta: [{ title: 'LuckyCat · Local history' }, { name: 'robots', content: 'noindex' }] }),
  component: () => import.meta.env.DEV ? <DiagnosticHistory /> : null,
});
