import { afterEach, test, vi } from 'vite-plus/test';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import assert from 'node:assert/strict';
import { DiagnosticResults } from '../src/diagnostics/results';
import { LocalDebugPanel } from '../src/local-debug';
import { parseDiagnosticResult } from '../src/diagnostics/response';
import { fixture, project } from './fixtures';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const configuration = () => Response.json({ enabled: true, credentialConfigured: true, projects: [project, 'other-example'] });
async function load() {
  fireEvent.click(screen.getByRole('button', { name: '設定状態を読み込む' }));
  await screen.findByRole('button', { name: '診断を実行' });
}
const diagnose = () => fireEvent.click(screen.getByRole('button', { name: '診断を実行' }));
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

test('shows candidate identity, location, evidence and unknown money; JSON is collapsed', () => {
  render(<DiagnosticResults result={fixture()} />);
  assert.ok(screen.getByRole('heading', { name: '見直し候補があります' }));
  assert.ok(screen.getByText('確認できた候補：1件'));
  const name = screen.getByText('disk-a');
  fireEvent.click(name);
  assert.equal(name.closest('details')?.open, true);
  assert.ok(screen.getByText('zone-a（ゾーン）'));
  assert.ok(screen.getByText('pd-balanced / 10 GiB'));
  assert.ok(screen.getByText('利用可能（READY）'));
  assert.ok(screen.getByText('不明（価格・請求データ未取得）'));
  assert.equal(screen.getByText('診断JSONを表示').closest('details')?.open, false);
});
test('partial collection preserves candidates and describes the missing source rather than a clean result', () => {
  render(<DiagnosticResults result={fixture('partial')} />);
  assert.ok(screen.getByRole('heading', { name: '一部を評価できませんでした' }));
  assert.ok(screen.getByText('disk-a'));
  const missing = screen.getByRole('region', { name: '未割り当ての静的外部IPv4' });
  assert.ok(within(missing).getByText('候補の有無は未確認です。未評価の理由を確認してください。'));
  assert.ok(screen.getByText('権限が不足しているか、必要なAPIが無効です。'));
  assert.equal(screen.queryByText('評価範囲内で該当する候補はありませんでした。'), null);
});
test('complete empty results and missing evidence have distinct messages', () => {
  const view = render(<DiagnosticResults result={fixture('empty')} />);
  assert.ok(screen.getByRole('heading', { name: '評価範囲内で該当なし' }));
  view.rerender(<DiagnosticResults result={fixture('unknown')} />);
  assert.equal(screen.queryByRole('heading', { name: '評価範囲内で該当なし' }), null);
  assert.ok(screen.getByText('状態または参照先の情報が不足・不正です。'));
  assert.ok(screen.getByText('未評価のリソース（1件）'));
});
test('authentication failure never presents zero candidates as a completed diagnosis', () => {
  render(<DiagnosticResults result={fixture('authentication')} />);
  assert.ok(screen.getByRole('heading', { name: '認証に失敗しました' }));
  assert.ok(screen.getByText('認証情報の形式を確認できません。ローカル設定を確認してください。'));
  assert.equal(screen.queryByText(/確認できた候補：/), null);
  assert.equal(screen.queryByRole('heading', { name: '評価範囲内で該当なし' }), null);
});
test('validates response structure, project and no-match consistency at the network boundary', () => {
  for (const mode of ['candidate', 'empty', 'partial', 'unknown', 'authentication'] as const) assert.deepEqual(parseDiagnosticResult(fixture(mode), project), fixture(mode));
  const broken = fixture('partial'); broken.rules[1].conclusion = 'no_matching_candidates';
  const contradictory = fixture('empty'); contradictory.rules[0].conclusion = 'incomplete';
  const wrongResource = fixture('candidate', 'other-example'); wrongResource.project = project;
  const malformed = fixture(); (malformed.rules[0].candidates[0].evidence as unknown as { referenceCount: unknown }).referenceCount = 'zero';
  for (const value of [null, {}, { ...fixture(), project: 'other-example' }, { ...fixture(), schemaVersion: '2' }, { ...fixture(), rules: [] }, broken, contradictory, wrongResource, malformed]) {
    assert.throws(() => parseDiagnosticResult(value, project), /診断結果の形式/);
  }
});
test('switching projects clears results and rejects a late response from the previous project', async () => {
  const pending = deferred<Response>();
  const fetcher = vi.fn().mockResolvedValueOnce(configuration()).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(Response.json(fixture('empty', 'other-example')));
  vi.stubGlobal('fetch', fetcher);
  render(<LocalDebugPanel />); await load(); diagnose();
  const signal = fetcher.mock.calls[1][1].signal as AbortSignal;
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other-example' } });
  assert.equal(signal.aborted, true);
  diagnose(); await screen.findByRole('heading', { name: '評価範囲内で該当なし' });
  await act(async () => { pending.resolve(Response.json(fixture())); });
  assert.equal(screen.queryByText('disk-a'), null);
  assert.equal(screen.queryByRole('heading', { name: '見直し候補があります' }), null);
  assert.ok(screen.getByText('診断結果 · other-example'));
});
test('rerunning clears the previous result immediately, and a network failure does not restore it', async () => {
  const pending = deferred<Response>();
  const fetcher = vi.fn().mockResolvedValueOnce(configuration()).mockResolvedValueOnce(Response.json(fixture())).mockReturnValueOnce(pending.promise);
  vi.stubGlobal('fetch', fetcher);
  render(<LocalDebugPanel />); await load(); diagnose(); await screen.findByText('disk-a');
  diagnose(); assert.equal(screen.queryByText('disk-a'), null);
  assert.ok(screen.getByText('診断中です。以前の結果は表示していません。'));
  await act(async () => { pending.resolve(new Response('private-server-error', { status: 500 })); });
  await screen.findByRole('alert');
  assert.equal(screen.queryByText('disk-a'), null);
  assert.equal(screen.queryByRole('heading', { name: '評価範囲内で該当なし' }), null);
  assert.ok(!document.body.textContent?.includes('private-server-error'));
});
test('reloading settings invalidates pending diagnosis and does not initiate another cloud request', async () => {
  const pending = deferred<Response>();
  const fetcher = vi.fn().mockResolvedValueOnce(configuration()).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(configuration());
  vi.stubGlobal('fetch', fetcher);
  render(<LocalDebugPanel />); await load(); diagnose(); await load();
  await act(async () => { pending.resolve(Response.json(fixture())); });
  assert.equal(screen.queryByRole('region', { name: '診断結果' }), null);
  assert.equal(fetcher.mock.calls.filter(([url]) => url === '/local-debug/diagnose').length, 1);
});
test('malformed successful HTTP response is shown as an error, not zero findings', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(configuration()).mockResolvedValueOnce(Response.json({})));
  render(<LocalDebugPanel />); await load(); diagnose();
  await waitFor(() => assert.match(screen.getByRole('alert').textContent ?? '', /診断結果の形式/));
  assert.equal(screen.queryByRole('region', { name: '診断結果' }), null);
});
