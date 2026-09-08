import { useEffect, useRef, useState } from 'react';
import type { DiagnosticResult } from '@luckycat/core';
import { historyId, historyRequest } from './history-client';

export function SaveDiagnostic({ result }: { result: DiagnosticResult }) {
  const [id] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState(false);
  const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => request.current?.abort(), []);
  async function save() {
    const controller = new AbortController(); request.current = controller;
    setState('saving'); setError(false);
    try {
      const value = await historyRequest('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, result }), signal: controller.signal });
      if (!value || typeof value !== 'object' || !('id' in value) || !historyId(value.id) || value.id !== id) throw new Error('Invalid save response');
      if (!controller.signal.aborted) setState('saved');
    } catch { if (!controller.signal.aborted) { setState('idle'); setError(true); } }
  }
  return <div className="diagnostic-save">
    <button type="button" className="secondary" disabled={state !== 'idle'} onClick={() => void save()}>{state === 'saving' ? '保存中…' : state === 'saved' ? 'ローカルに保存済み' : 'ローカルに保存'}</button>
    <a href="/dev/history">保存した履歴を見る</a>
    {state === 'saved' && <p role="status">診断時点の結果を保存しました。</p>}
    {error && <p role="alert">保存できませんでした。診断結果は画面に残っています。ローカルAPI・D1のセットアップと対象プロジェクトの設定を確認し、再試行してください。</p>}
  </div>;
}
