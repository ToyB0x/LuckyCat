import { evaluateInventory, type DiagnosticResult, type Inventory } from '@luckycat/core';

export const project = 'debug-example';
const at = '2026-01-01T00:00:00.000Z';
export function fixture(mode: 'candidate' | 'empty' | 'partial' | 'unknown' | 'authentication' = 'candidate', target = project): DiagnosticResult {
  const disk: Inventory = { source: 'disks', status: 'complete', startedAt: at, completedAt: at, scopes: ['zones/zone-a'], pages: 1, issues: [], records: mode === 'empty' || mode === 'authentication' ? [] : [{
    resource: `projects/${target}/zones/zone-a/disks/disk-a`, observedAt: at, state: mode === 'unknown' ? null : 'READY', referenceCount: 0,
    referencesOmitted: true, diskType: 'pd-balanced', sizeGb: '10', replicating: false,
  }] };
  const address: Inventory = { source: 'addresses', status: 'complete', startedAt: at, completedAt: at, scopes: ['global'], pages: 1, issues: [], records: [] };
  if (mode === 'partial') { address.status = 'failed'; address.pages = 0; address.scopes = []; address.issues = [{ reason: 'access_denied_or_api_disabled' }]; }
  if (mode === 'authentication') for (const source of [disk, address]) { source.status = 'not_attempted'; source.scopes = []; source.pages = 0; source.issues = [{ reason: 'authentication_failed' }]; }
  return {
    schemaVersion: '1', project: target, startedAt: at, completedAt: at,
    authentication: mode === 'authentication' ? 'failed' : 'succeeded', ...(mode === 'authentication' ? { authenticationReason: 'invalid_credentials' } : {}),
    observation: { kind: 'current_state', continuousUnusedDuration: 'unknown' },
    limits: { pageSize: 100, pagesPerSource: 5, recordsPerSource: 500, bytesPerResponse: 2097152, requestMs: 10000, totalMs: 30000 },
    status: mode === 'authentication' ? 'not_evaluated' : mode === 'partial' || mode === 'unknown' ? 'partially_evaluated' : 'evaluated',
    sources: [disk, address].map(({ records, ...source }) => ({ ...source, receivedResources: records.length })),
    rules: [disk, address].map(evaluateInventory),
  };
}
