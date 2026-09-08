import { evaluateInventory, type DiagnosticResult, type Inventory } from '@luckycat/core';
import { parseDiagnosticResult } from './response';

export const previewScenarios = [
  { id: 'findings', ja: '候補あり', en: 'Candidates' },
  { id: 'many', ja: '候補50件', en: '50 candidates' },
  { id: 'empty', ja: '該当なし', en: 'No matches' },
  { id: 'partial', ja: '部分取得', en: 'Partial collection' },
  { id: 'unknown', ja: '金額不明', en: 'Unknown amounts' },
  { id: 'authentication', ja: '認証失敗', en: 'Authentication failure' },
  { id: 'transport', ja: '通信失敗', en: 'Network failure' },
  { id: 'loading', ja: '読み込み中', en: 'Loading' },
] as const;
export type PreviewScenario = typeof previewScenarios[number]['id'];
export type PreviewState = { kind: 'result'; result: DiagnosticResult } | { kind: 'loading' | 'transport' };

/** Fictional observations use the shared evaluator and response boundary; no IO. */
export function createPreviewState(scenario: PreviewScenario): PreviewState {
  if (scenario === 'loading' || scenario === 'transport') return { kind: scenario };
  const project = 'luckycat-demo';
  const at = '2026-09-08T00:00:00.000Z';
  const disk: Inventory = { source: 'disks', status: 'complete', startedAt: at, completedAt: at, scopes: ['zones/asia-northeast1-a'], pages: 1, issues: [], records: [] };
  const address: Inventory = { ...disk, source: 'addresses', scopes: ['regions/asia-northeast1'], records: [] };
  const count = scenario === 'empty' || scenario === 'authentication' ? 0 : scenario === 'many' ? 50 : 3;
  for (let i = 0; i < count; i++) {
    const suffix = scenario === 'many' ? `-${String(i + 1).padStart(2, '0')}` : '';
    if (i % 3 === 1 && scenario !== 'unknown') {
      address.records.push({ resource: `projects/${project}/regions/asia-northeast1/addresses/demo-reserved-ip${suffix}`,
        observedAt: at, state: 'RESERVED', referenceCount: 0, referencesOmitted: true, addressType: 'EXTERNAL', ipVersion: 'IPV4' });
    } else {
      const unpriced = scenario === 'unknown' || i % 3 === 2;
      disk.records.push({ resource: `projects/${project}/zones/asia-northeast1-a/disks/${unpriced ? 'demo-review-disk' : 'demo-cache-disk'}${scenario === 'unknown' ? `-${i + 1}` : suffix}`,
        observedAt: at, state: 'READY', referenceCount: 0, referencesOmitted: true, diskType: unpriced ? 'pd-extreme' : 'pd-standard', sizeGb: unpriced ? '500' : '200', replicating: false });
    }
  }
  if (scenario === 'partial') {
    disk.status = 'partial'; disk.issues = [{ reason: 'unreachable_scope', scope: 'zones/europe-west1-b' }];
  }
  if (scenario === 'authentication') for (const source of [disk, address]) {
    source.status = 'not_attempted'; source.pages = 0; source.scopes = []; source.issues = [{ reason: 'authentication_failed' }];
  }
  const result: DiagnosticResult = {
    schemaVersion: '2', project, startedAt: at, completedAt: at,
    authentication: scenario === 'authentication' ? 'failed' : 'succeeded',
    ...(scenario === 'authentication' ? { authenticationReason: 'invalid_credentials' } : {}),
    observation: { kind: 'current_state', continuousUnusedDuration: 'unknown' },
    limits: { pageSize: 100, pagesPerSource: 5, recordsPerSource: 500, bytesPerResponse: 2097152, requestMs: 10000, totalMs: 30000 },
    status: scenario === 'authentication' ? 'not_evaluated' : scenario === 'partial' ? 'partially_evaluated' : 'evaluated',
    sources: [disk, address].map(({ records, ...source }) => ({ ...source, receivedResources: records.length })),
    rules: [disk, address].map(evaluateInventory),
  };
  return { kind: 'result', result: parseDiagnosticResult(result, project) };
}
