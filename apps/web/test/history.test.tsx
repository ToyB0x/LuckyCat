import { afterEach, test, vi } from 'vite-plus/test';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import assert from 'node:assert/strict';
import { SaveDiagnostic } from '../src/diagnostics/save';
import { DiagnosticHistory } from '../src/diagnostics/history';
import { parseHistoryPage } from '../src/diagnostics/history-client';
import { fixture, project } from './fixtures';

const first = '00000000-0000-4000-8000-000000000001',
  second = '00000000-0000-4000-8000-000000000002';
const at = '2026-09-08T00:00:00.000Z';
const item = (id = first) => ({
  id,
  project,
  diagnosedAt: at,
  savedAt: at,
  evaluation: 'partially_evaluated',
  candidateCount: 1,
});
const page = (items = [item()]) => Response.json({ items, nextOffset: null });
const saved = (id = first) => Response.json({ id, savedAt: at, result: fixture('partial') });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test('save failure retains the result and retry uses the same ID without diagnosing again', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockImplementationOnce((_url, init) => Response.json({ id: JSON.parse(init.body).id }));
  vi.stubGlobal('fetch', fetcher);
  render(<SaveDiagnostic result={fixture()} />);
  fireEvent.click(screen.getByRole('button', { name: 'ローカルに保存' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'ローカルに保存' }));
  await screen.findByText('診断時点の結果を保存しました。');
  assert.equal(
    JSON.parse(fetcher.mock.calls[0][1].body).id,
    JSON.parse(fetcher.mock.calls[1][1].body).id,
  );
  assert.ok(fetcher.mock.calls.every(([url]) => url === '/local-debug/history'));
  assert.equal(
    screen.getByRole('button', { name: 'ローカルに保存済み' }).hasAttribute('disabled'),
    true,
  );
});

test('history opens a saved partial result and deletion requires an explicit confirmation', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(page())
    .mockResolvedValueOnce(saved())
    .mockResolvedValueOnce(Response.json({ deleted: true }))
    .mockResolvedValueOnce(page([]));
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticHistory />);
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(project) }));
  await screen.findByRole('heading', { name: '一部を評価できませんでした' });
  fireEvent.click(screen.getByRole('button', { name: '履歴を削除' }));
  assert.equal(fetcher.mock.calls.length, 2);
  fireEvent.click(screen.getByRole('button', { name: '削除する' }));
  await screen.findByText('このページに保存済みの診断結果はありません。');
  assert.equal(screen.queryByRole('region', { name: '診断結果' }), null);
  assert.ok(fetcher.mock.calls.every(([url]) => url.startsWith('/local-debug/history')));
});

test('late detail responses are ignored and invalid snapshots never become an empty diagnosis', async () => {
  const pending = deferred<Response>();
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(page([item(), item(second)]))
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(Response.json({ id: second, savedAt: at, result: {} }));
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticHistory />);
  const buttons = await screen.findAllByRole('button', { name: new RegExp(project) });
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[1]);
  await screen.findByRole('alert');
  await act(async () => pending.resolve(saved()));
  assert.equal(screen.queryByRole('region', { name: '診断結果' }), null);
  assert.equal(fetcher.mock.calls[1][1].signal.aborted, true);
});

test('reselecting the same entry preserves pending requests and loaded evidence without refetching', async () => {
  const pending = deferred<Response>();
  const fetcher = vi.fn().mockResolvedValueOnce(page()).mockReturnValueOnce(pending.promise);
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticHistory />);
  const entry = await screen.findByRole('button', { name: new RegExp(project) });
  fireEvent.click(entry);
  fireEvent.click(entry);
  assert.equal(fetcher.mock.calls.length, 2);
  assert.equal(fetcher.mock.calls[1][1].signal.aborted, false);
  await act(async () => pending.resolve(saved()));
  await screen.findByRole('heading', { name: '一部を評価できませんでした' });
  fireEvent.click(screen.getByText('disk-a'));
  fireEvent.click(entry);
  assert.ok(screen.getByRole('region', { name: '診断結果' }));
  assert.equal(screen.getByText('disk-a').closest('details')?.open, true);
  assert.equal(screen.queryByText('保存結果を読み込み中…'), null);
  assert.equal(fetcher.mock.calls.length, 2);
});

test('reselecting a failed entry preserves its error and reloading history permits another attempt', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(page())
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(page())
    .mockResolvedValueOnce(saved());
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticHistory />);
  const entry = await screen.findByRole('button', { name: new RegExp(project) });
  fireEvent.click(entry);
  await screen.findByRole('alert');
  fireEvent.click(entry);
  assert.ok(screen.getByRole('alert'));
  assert.equal(screen.queryByText('保存結果を読み込み中…'), null);
  assert.equal(fetcher.mock.calls.length, 2);
  fireEvent.click(screen.getByRole('button', { name: '履歴を再読み込み' }));
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(project) }));
  await screen.findByRole('heading', { name: '一部を評価できませんでした' });
  assert.equal(screen.queryByRole('alert'), null);
});

test('failed list and delete requests remain errors and English history retains the same behavior', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(page())
    .mockResolvedValueOnce(new Response('', { status: 503 }));
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticHistory />);
  await screen.findByRole('alert');
  assert.equal(screen.queryByText('このページに保存済みの診断結果はありません。'), null);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reload history' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Delete entry' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
  await waitFor(() => assert.match(screen.getByRole('alert').textContent ?? '', /Deletion failed/));
  assert.ok(screen.getByRole('button', { name: new RegExp(project) }));
});

test('history summaries reject missing counts, invalid identifiers and malformed pagination', () => {
  for (const value of [
    {},
    { items: [{ ...item(), candidateCount: null }], nextOffset: null },
    { items: [{ ...item(), id: '../status' }], nextOffset: null },
    { items: [], nextOffset: -1 },
  ])
    assert.throws(() => parseHistoryPage(value));
});
