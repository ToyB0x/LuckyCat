import type { DiagnosticResult } from '@luckycat/core';

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const string = (v: unknown): v is string => typeof v === 'string';
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const timestamp = (v: unknown) => string(v) && Number.isFinite(Date.parse(v));
const strings = (v: unknown) => Array.isArray(v) && v.every(string);
const oneOf = (v: unknown, values: string[]) => string(v) && values.includes(v);
const issue = (v: unknown) => object(v) && string(v.reason) && (v.scope === undefined || string(v.scope));
const evaluation = (v: unknown) => oneOf(v, ['evaluated', 'partially_evaluated', 'not_evaluated']);
const resource = (v: unknown) => object(v) && string(v.resource) && timestamp(v.observedAt)
  && (v.state === null || string(v.state)) && (v.referenceCount === null || count(v.referenceCount))
  && typeof v.referencesOmitted === 'boolean'
  && ['diskType', 'sizeGb', 'addressType', 'ipVersion'].every(k => v[k] === undefined || v[k] === null || string(v[k]))
  && ['replicating', 'ipVersionInferred', 'addressTypeDefaulted'].every(k => v[k] === undefined || typeof v[k] === 'boolean');
const candidate = (v: unknown) => object(v) && string(v.resource) && resource(v.evidence)
  && object(v.evidence) && v.evidence.resource === v.resource && v.requiresHumanReview === true
  && object(v.amount) && v.amount.status === 'unknown' && v.amount.reason === 'pricing_not_collected';
const rule = (v: unknown) => object(v) && v.version === '1' && evaluation(v.status) && count(v.evaluatedResources)
  && oneOf(v.conclusion, ['candidates_found', 'no_matching_candidates', 'incomplete'])
  && Array.isArray(v.candidates) && v.candidates.every(candidate)
  && Array.isArray(v.unevaluated) && v.unevaluated.every(u => object(u) && string(u.resource) && string(u.reason))
  && Array.isArray(v.collectionIssues) && v.collectionIssues.every(issue);
const source = (v: unknown) => object(v) && oneOf(v.status, ['complete', 'partial', 'failed', 'not_attempted'])
  && timestamp(v.startedAt) && timestamp(v.completedAt) && count(v.pages) && count(v.receivedResources)
  && strings(v.scopes) && Array.isArray(v.issues) && v.issues.every(issue);

/** Check the network boundary before interpreting a missing value as a count or status. */
export function parseDiagnosticResult(value: unknown, project: string): DiagnosticResult {
  const invalid = () => new Error('診断結果の形式を確認できませんでした。APIと画面のバージョンを確認して再実行してください。');
  if (!object(value) || value.schemaVersion !== '1' || value.project !== project
    || !timestamp(value.startedAt) || !timestamp(value.completedAt) || !evaluation(value.status)
    || !oneOf(value.authentication, ['succeeded', 'failed']) || (value.authenticationReason !== undefined && !string(value.authenticationReason))
    || !object(value.observation) || value.observation.kind !== 'current_state' || value.observation.continuousUnusedDuration !== 'unknown'
    || !object(value.limits) || !['pageSize', 'pagesPerSource', 'recordsPerSource', 'bytesPerResponse', 'requestMs', 'totalMs'].every(k => count((value.limits as Record<string, unknown>)[k]))
    || !Array.isArray(value.sources) || value.sources.length !== 2 || !value.sources.every(source)
    || !Array.isArray(value.rules) || value.rules.length !== 2 || !value.rules.every(rule)) throw invalid();
  const result = value as unknown as DiagnosticResult;
  for (const [kind, id] of [['disks', 'unattached-persistent-disk'], ['addresses', 'unassigned-static-external-ipv4']]) {
    const sources = result.sources.filter(s => s.source === kind);
    const rules = result.rules.filter(r => r.source === kind && r.rule === id);
    if (sources.length !== 1 || rules.length !== 1) throw invalid();
    const s = sources[0], r = rules[0];
    if ([...r.candidates, ...r.unevaluated].some(item => !item.resource.startsWith(`projects/${project}/`))
      || r.evaluatedResources < r.candidates.length || (r.candidates.length > 0) !== (r.conclusion === 'candidates_found')
      || (r.status === 'evaluated' && (r.conclusion === 'incomplete' || s.status !== 'complete' || s.issues.length > 0 || r.unevaluated.length > 0 || r.collectionIssues.length > 0))
      || (r.conclusion === 'no_matching_candidates' && r.status !== 'evaluated')
      || (r.status === 'not_evaluated' && (r.evaluatedResources > 0 || r.candidates.length > 0))) throw invalid();
  }
  const expectedStatus = result.rules.every(r => r.status === 'evaluated') ? 'evaluated'
    : result.rules.some(r => r.evaluatedResources > 0 || r.status === 'evaluated') ? 'partially_evaluated' : 'not_evaluated';
  if (result.status !== expectedStatus || (result.authentication === 'failed' && (result.status !== 'not_evaluated' || result.sources.some(s => s.status !== 'not_attempted')))) throw invalid();
  return result;
}
