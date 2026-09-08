import { useState } from 'react';

interface Status { enabled: boolean; credentialConfigured: boolean; projects: string[] }

export function LocalDebugPanel() {
  const [status, setStatus] = useState<Status>();
  const [project, setProject] = useState('');
  const [result, setResult] = useState<unknown>();
  const [workflow, setWorkflow] = useState('');
  const [busy, setBusy] = useState(false);

  async function call(path: string, body?: unknown) {
    const response = await fetch(`/local-debug/${path}`, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : undefined);
    if (!response.ok) throw new Error(`確認できませんでした（HTTP ${response.status}）。ローカルAPIと設定を確認してください。`);
    return response.json();
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); } catch (error) { setResult({ error: error instanceof Error ? error.message : '確認に失敗しました。' }); }
    finally { setBusy(false); }
  }
  const buttonStyle = { padding: '10px 16px', margin: '8px 8px 8px 0', cursor: 'pointer' };
  return <section style={{ borderTop: '1px solid #ccc', marginTop: 32, paddingTop: 16 }}>
    <h2>Google Cloud · ローカル接続確認</h2>
    <p>開発専用です。OIDCサーバーを使わず、サーバー側に設定したサービスアカウントJSON鍵で確認します。診断ルールはまだ実行しません。</p>
    <button style={buttonStyle} disabled={busy} onClick={() => run(async () => {
      const next: Status = await call('status'); setStatus(next); setProject(next.projects[0] ?? '');
    })}>設定状態を読み込む</button>
    {status && <>
      <p>モード：{status.enabled ? '有効' : '無効'} ／ 鍵：{status.credentialConfigured ? '設定あり（有効性は未確認）' : '未設定'}</p>
      <label>対象プロジェクト <select value={project} onChange={event => setProject(event.target.value)}>
        {status.projects.map(value => <option key={value}>{value}</option>)}
      </select></label>
      <p>以下の確認はGoogle Cloudへ接続し、読み取りクォータを消費します。リソースの変更や全件取得は行いません。</p>
      <button style={buttonStyle} disabled={busy || !project || !status.enabled || !status.credentialConfigured} onClick={() => run(async () => setResult(await call('check', { project })))}>APIで接続確認</button>
      <button style={buttonStyle} disabled={busy || !project || !status.enabled || !status.credentialConfigured} onClick={() => run(async () => {
        const created = await call('workflow', { project }); setWorkflow(created.id); setResult({ status: '開始しました。結果を確認してください。' });
      })}>ローカルWorkflowで確認</button>
    </>}
    {workflow && <button style={buttonStyle} disabled={busy} onClick={() => run(async () => setResult(await call(`workflow/${workflow}`)))}>Workflowの結果を確認</button>}
    {busy && <p role="status">確認中…</p>}
    {result !== undefined && <pre aria-live="polite" style={{ background: '#f4f4f4', padding: 16, overflowX: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>}
    <p><small>read_probe_succeededは限定した読み取り確認の成功です。認証成功・権限確認・診断完了はそれぞれ別の状態です。</small></p>
  </section>;
}
