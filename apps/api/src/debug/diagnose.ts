import { evaluateInventory, type Inventory, type SourceKind, type DiagnosticResult } from '@luckycat/core';
import { createLocalServiceAccountProvider, CredentialError } from '@luckycat/oidc';
import { allowedProjects, debugEnabled, type DebugSettings } from './check';
import { collectInventory, collectionLimits } from '../google-cloud/inventory';

export async function diagnoseGoogleCloud(env: DebugSettings, project: string, fetcher: typeof fetch = fetch): Promise<DiagnosticResult> {
  if (!debugEnabled(env)) throw new Error('debug_disabled');
  if (!allowedProjects(env).includes(project)) throw new Error('project_not_allowed');
  const startedAt = new Date().toISOString();
  const sources: Inventory[] = [];
  let authentication: 'succeeded' | 'failed' = 'failed';
  let authenticationReason: string | undefined;
  let token: string | undefined;
  try {
    token = await createLocalServiceAccountProvider({ mode: env.GOOGLE_AUTH_MODE, serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON, fetcher }).getAccessToken();
    authentication = 'succeeded';
  } catch (error) { authenticationReason = error instanceof CredentialError ? error.code : 'authentication_failed'; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), collectionLimits.totalMs);
  try {
    for (const source of ['disks', 'addresses'] as SourceKind[]) {
      if (token) sources.push(await collectInventory(project, source, token, controller.signal, fetcher));
      else sources.push({ source, status: 'not_attempted', startedAt, completedAt: new Date().toISOString(), pages: 0, scopes: [], records: [], issues: [{ reason: 'authentication_failed' }] });
    }
  } finally { clearTimeout(timer); }
  const rules = sources.map(evaluateInventory);
  return {
    schemaVersion: '1', project, startedAt, completedAt: new Date().toISOString(), authentication,
    ...(authenticationReason ? { authenticationReason } : {}),
    observation: { kind: 'current_state', continuousUnusedDuration: 'unknown' },
    limits: collectionLimits,
    status: rules.every(r => r.status === 'evaluated') ? 'evaluated' : rules.some(r => r.evaluatedResources > 0 || r.status === 'evaluated') ? 'partially_evaluated' : 'not_evaluated',
    sources: sources.map(({ records, ...source }) => ({ ...source, receivedResources: records.length })),
    rules,
  };
}
