import { afterAll, beforeAll, test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { evaluateInventory, type Inventory, type DiagnosticResult } from '@luckycat/core';
import { handleHistory, type HistorySettings } from '../src/debug/history';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("test"); } }', d1Databases: ['DB'], compatibilityDate: '2026-09-08', cf: false }));
let env: HistorySettings;
beforeAll(async () => {
  const db = await mf.getD1Database('DB');
  for (const statement of (await readFile(new URL('../../../packages/db/migrations/0001_diagnostic_history.sql', import.meta.url), 'utf8')).split(';').filter(value => value.trim())) await db.prepare(statement).run();
  env = { LOCAL_DIAGNOSTICS: db as unknown as D1Database, GOOGLE_DEBUG_PROJECTS: 'history-example' };
});
afterAll(() => mf.dispose());
const call = (path = '', init?: RequestInit, settings = env) => handleHistory(new Request(`http://localhost/local-debug/history${path}`, init), settings);
function fixture(): DiagnosticResult {
  const at = '2026-09-08T00:00:00.000Z';
  const disk: Inventory = { source: 'disks', status: 'partial', startedAt: at, completedAt: at, pages: 1, scopes: ['zones/example-a'], issues: [{ reason: 'unreachable_scope', scope: 'zones/example-b' }],
    records: [{ resource: 'projects/history-example/zones/example-a/disks/demo-disk', observedAt: at, state: 'READY', referenceCount: 0, referencesOmitted: true, diskType: 'pd-extreme', sizeGb: '500' }] };
  const address: Inventory = { ...disk, source: 'addresses', status: 'complete', scopes: ['global'], issues: [], records: [] };
  return { schemaVersion: '2', project: 'history-example', startedAt: at, completedAt: at, authentication: 'succeeded', observation: { kind: 'current_state', continuousUnusedDuration: 'unknown' },
    limits: { pageSize: 100, pagesPerSource: 5, recordsPerSource: 500, bytesPerResponse: 2097152, requestMs: 10000, totalMs: 30000 }, status: 'partially_evaluated',
    sources: [disk, address].map(({ records, ...source }) => ({ ...source, receivedResources: records.length })), rules: [disk, address].map(evaluateInventory) };
}
const post = (id: string, result: unknown) => call('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, result }) });

test('D1 round trip keeps partial coverage and unknown prices, strips extra fields, and supports idempotent saves and deletion without keys', async () => {
  const id = crypto.randomUUID(), result = fixture();
  Object.assign(result, { unexpectedCredential: 'synthetic-do-not-store' });
  Object.assign(result.rules[0].candidates[0].evidence, { rawResponse: 'synthetic-do-not-store' });
  assert.equal((await post(id, result)).status, 201);
  assert.equal((await post(id, result)).status, 201);
  const list = await (await call()).json() as { items: {id:string}[] };
  assert.equal(list.items.filter(row => row.id === id).length, 1);
  const saved = await (await call(`/${id}`)).json() as { result: DiagnosticResult };
  assert.equal(saved.result.status, 'partially_evaluated');
  assert.equal(saved.result.rules[0].candidates[0].amount.status, 'unknown');
  assert.deepEqual(saved.result.sources[0].issues, result.sources[0].issues);
  assert.ok(!JSON.stringify(saved).includes('synthetic-do-not-store'));
  const raw = await env.LOCAL_DIAGNOSTICS!.prepare('SELECT result_json FROM diagnostic_history WHERE id = ?').bind(id).first<{ result_json: string }>();
  assert.ok(!raw!.result_json.includes('synthetic-do-not-store'));
  const changed = fixture(); changed.completedAt = '2026-09-08T00:01:00.000Z';
  assert.equal((await post(id, changed)).status, 409);
  assert.equal((await call(`/${id}`, { method: 'DELETE' }, { LOCAL_DIAGNOSTICS: env.LOCAL_DIAGNOSTICS })).status, 200);
  assert.equal((await call(`/${id}`)).status, 404);
});

test('invalid input, oversized requests and missing storage are errors rather than empty history', async () => {
  assert.equal((await post(crypto.randomUUID(), { ...fixture(), schemaVersion: '1' })).status, 400);
  assert.equal((await post(crypto.randomUUID(), { ...fixture(), project: 'other-example' })).status, 403);
  assert.equal((await post(crypto.randomUUID(), { ...fixture(), padding: 'x'.repeat(1024 * 1024) })).status, 413);
  assert.equal((await call('', { method: 'POST', body: '{}' })).status, 415);
  assert.equal((await call('?offset=-1')).status, 400);
  assert.equal((await call('/invalid')).status, 400);
  assert.equal((await call('', undefined, {})).status, 503);
});

test('unsupported saved snapshots can be listed and deleted, but never rendered as no matches', async () => {
  const id = crypto.randomUUID(); await post(id, fixture());
  await env.LOCAL_DIAGNOSTICS!.prepare('UPDATE diagnostic_history SET result_json = ? WHERE id = ?').bind('{"schemaVersion":"future"}', id).run();
  assert.equal((await call(`/${id}`)).status, 422);
  assert.equal((await call(`/${id}`, { method: 'DELETE' })).status, 200);
});

test('history pagination returns at most 20 summaries, without snapshot bodies', async () => {
  const ids = Array.from({ length: 21 }, () => crypto.randomUUID());
  for (const id of ids) await post(id, fixture());
  const page = await (await call()).json() as {items: unknown[]; nextOffset: number};
  assert.equal(page.items.length, 20); assert.equal(page.nextOffset, 20);
  assert.ok(!JSON.stringify(page).includes('resultJson'));
  const next = await (await call('?offset=20')).json() as {items: unknown[]; nextOffset: null};
  assert.equal(next.items.length, 1); assert.equal(next.nextOffset, null);
  for (const id of ids) await call(`/${id}`, { method: 'DELETE' });
});
