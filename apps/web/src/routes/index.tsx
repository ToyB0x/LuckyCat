import { createFileRoute } from '@tanstack/react-router';
import { LocalDebugPanel } from '../local-debug';
import { getGreeting } from '@luckycat/core';

export const Route = createFileRoute('/')({
  component: () => (
    <main
      style={{
        maxWidth: import.meta.env.DEV ? 1120 : 640,
        margin: '80px auto',
        padding: 24,
        fontFamily: 'system-ui',
      }}
    >
      <h1>{getGreeting()}</h1>
      <p>
        This is a minimal application starter. Product workflows and sign-in are not implemented
        yet.
      </p>
      {import.meta.env.DEV && (
        <>
          <p>
            <a href="/dev/diagnostics">UIプレビュー（架空データ）</a> ·{' '}
            <a href="/dev/history">保存した診断結果</a>
          </p>
          <LocalDebugPanel />
        </>
      )}
    </main>
  ),
});
