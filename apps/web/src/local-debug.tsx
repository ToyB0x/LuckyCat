import { useEffect, useRef, useState } from 'react';
import type { DiagnosticResult } from '@luckycat/core';
import { DiagnosticResults } from './diagnostics/results';
import { parseDiagnosticResult } from './diagnostics/response';
import { diagnosticStyles } from './diagnostics/styles';

interface Status { enabled: boolean; credentialConfigured: boolean; projects: string[] }
type Action = 'status' | 'diagnose' | 'check' | 'workflow' | 'poll';

export function LocalDebugPanel() {
  const [status, setStatus] = useState<Status>();
  const [project, setProject] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult>();
  const [auxiliary, setAuxiliary] = useState<unknown>();
  const [error, setError] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [busy, setBusy] = useState<Action>();
  const request = useRef<{ generation: number; controller?: AbortController }>({ generation: 0 });
  useEffect(() => () => { request.current.generation++; request.current.controller?.abort(); }, []);

  function reset() {
    request.current.generation++;
    request.current.controller?.abort();
    setDiagnosis(undefined); setAuxiliary(undefined); setError(''); setWorkflow(''); setBusy(undefined);
  }
  async function run(action: Action) {
    const workflowId = workflow;
    reset();
    const generation = request.current.generation;
    const controller = new AbortController(); request.current.controller = controller;
    setBusy(action);
    if (action === 'status') { setStatus(undefined); setProject(''); }
    if (action === 'poll') setWorkflow(workflowId);
    try {
      const path = action === 'poll' ? `workflow/${workflowId}` : action;
      const post = action !== 'status' && action !== 'poll';
      const response = await fetch(`/local-debug/${path}`, { signal: controller.signal,
        ...(post ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project }) } : {}) });
      if (!response.ok) throw new Error(`確認できませんでした（HTTP ${response.status}）。ローカルAPIと設定を確認してください。`);
      const data: unknown = await response.json();
      if (generation !== request.current.generation) return;
      if (action === 'diagnose') setDiagnosis(parseDiagnosticResult(data, project));
      else if (action === 'status') {
        if (!data || typeof data !== 'object' || !('enabled' in data) || typeof data.enabled !== 'boolean'
          || !('credentialConfigured' in data) || typeof data.credentialConfigured !== 'boolean'
          || !('projects' in data) || !Array.isArray(data.projects) || !data.projects.every(p => typeof p === 'string')) throw new Error('設定状態の応答を確認できませんでした。');
        const next = data as Status; setStatus(next); setProject(next.projects[0] ?? '');
      } else if (action === 'workflow') {
        if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/.test(data.id)) throw new Error('Workflowの開始を確認できませんでした。');
        setWorkflow(data.id); setAuxiliary({ status: '開始しました。結果を確認してください。' });
      } else setAuxiliary(data);
    } catch (failure) {
      if (generation !== request.current.generation) return;
      setError(action === 'diagnose' && failure instanceof Error && failure.message.startsWith('診断結果の形式') ? failure.message
        : failure instanceof Error && failure.message.startsWith('確認できませんでした（HTTP') ? failure.message
        : '通信または応答の確認に失敗しました。接続と設定を確認して再実行してください。');
    } finally { if (generation === request.current.generation) { setBusy(undefined); request.current.controller = undefined; } }
  }
  const ready = !!project && !!status?.enabled && !!status.credentialConfigured;
  return <section className="local-debug" aria-label="Google Cloudのローカル検証">
    <style>{diagnosticStyles}</style>
    <header><p className="eyebrow">Google Cloud · 開発用</p><h2>リソースの見直し候補を確認</h2>
      <p>未接続ディスクと未割り当ての静的外部IPv4を、現在の状態から確認します。価格推定は現在仮実装で、固定単価による概算を表示します。</p></header>
    <div className="diagnostic-controls">
      <button type="button" className="secondary" onClick={() => void run('status')}>設定状態を読み込む</button>
      {status && <>
        <label>対象プロジェクト<select value={project} onChange={event => { reset(); setProject(event.target.value); }}>
          {status.projects.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <p className="muted">認証モード：{status.enabled ? '有効' : '無効'} ／ 鍵：{status.credentialConfigured ? '設定あり（有効性は未確認）' : '未設定'}</p>
        {!ready && <p>許可プロジェクトとサービスアカウントJSON鍵のローカル設定を確認してください。</p>}
        <button type="button" className="primary" disabled={!!busy || !ready} onClick={() => void run('diagnose')}>診断を実行</button>
        <p className="muted">Google Cloudの読み取りクォータを消費します。リソースの変更は行いません。</p>
      </>}
    </div>
    <div role="status" aria-live="polite">{busy ? (busy === 'diagnose' ? '診断中です。以前の結果は表示していません。' : '確認中…') : diagnosis ? '診断結果を更新しました。' : ''}</div>
    {error && <p role="alert" className="request-error">{error} 診断結果は未確認です。</p>}
    {diagnosis && <DiagnosticResults result={diagnosis} />}
    {status && <details className="connection-tools"><summary>接続確認ツール</summary>
      <p>OIDCサーバーを使わず、サーバー側のJSON鍵で確認します。接続確認は各1ページの読み取りのみで、診断ではありません。</p>
      <button type="button" className="secondary" disabled={!!busy || !ready} onClick={() => void run('check')}>APIで接続確認</button>
      <button type="button" className="secondary" disabled={!!busy || !ready} onClick={() => void run('workflow')}>ローカルWorkflowで確認</button>
      {workflow && <button type="button" className="secondary" disabled={!!busy} onClick={() => void run('poll')}>Workflowの結果を確認</button>}
      {auxiliary !== undefined && <pre>{JSON.stringify(auxiliary, null, 2)}</pre>}
    </details>}
    <p className="muted privacy-note">ローカル専用・顧客向け未提供。結果にはリソース識別子が含まれます。公開先へ貼り付けないでください。</p>
  </section>;
}
