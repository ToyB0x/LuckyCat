export type SourceKind = 'disks' | 'addresses';
export interface ResourceObservation {
  resource: string;
  observedAt: string;
  state: string | null;
  referenceCount: number | null;
  referencesOmitted: boolean;
  diskType?: string | null;
  sizeGb?: string | null;
  replicating?: boolean;
  addressType?: string | null;
  ipVersion?: string | null;
  ipVersionInferred?: boolean;
  addressTypeDefaulted?: boolean;
}
export interface CollectionIssue { reason: string; scope?: string }
export interface Inventory {
  source: SourceKind;
  status: 'complete' | 'partial' | 'failed' | 'not_attempted';
  startedAt: string;
  completedAt: string;
  pages: number;
  scopes: string[];
  issues: CollectionIssue[];
  records: ResourceObservation[];
}
export interface Finding {
  resource: string;
  evidence: ResourceObservation;
  amount: { status: 'unknown'; reason: 'pricing_not_collected' };
  requiresHumanReview: true;
}
export interface RuleResult {
  rule: 'unattached-persistent-disk' | 'unassigned-static-external-ipv4';
  version: '1';
  source: SourceKind;
  status: 'evaluated' | 'partially_evaluated' | 'not_evaluated';
  conclusion: 'candidates_found' | 'no_matching_candidates' | 'incomplete';
  evaluatedResources: number;
  candidates: Finding[];
  unevaluated: { resource: string; reason: string }[];
  collectionIssues: CollectionIssue[];
}

function assess(source: SourceKind, r: ResourceObservation): string {
  if (r.referenceCount === null || !Number.isInteger(r.referenceCount) || r.referenceCount < 0 || !r.state) return 'missing_or_invalid_evidence';
  if (source === 'disks') {
    if (!r.diskType) return 'missing_disk_type';
    if (!['pd-standard', 'pd-balanced', 'pd-ssd', 'pd-extreme'].includes(r.diskType)) return 'unsupported_disk_type';
    if (r.replicating) return 'replication_requires_review';
    if (!['READY', 'CREATING', 'RESTORING', 'FAILED', 'DELETING'].includes(r.state)) return 'unknown_disk_state';
    return r.state === 'READY' && r.referenceCount === 0 ? 'candidate' : 'not_candidate';
  }
  if (!['EXTERNAL', 'INTERNAL'].includes(r.addressType ?? '') || !['IPV4', 'IPV6'].includes(r.ipVersion ?? '')) return 'missing_or_invalid_address_type';
  if (r.addressType === 'INTERNAL' || r.ipVersion === 'IPV6') return 'not_candidate';
  if (!['RESERVED', 'IN_USE', 'RESERVING'].includes(r.state)) return 'unknown_address_state';
  if ((r.state === 'RESERVED' && r.referenceCount > 0) || (r.state === 'IN_USE' && r.referenceCount === 0)) return 'contradictory_address_state';
  return r.state === 'RESERVED' && r.referenceCount === 0 ? 'candidate' : 'not_candidate';
}

/** Pure evaluation: incomplete collection never proves absence. */
export function evaluateInventory(inventory: Inventory): RuleResult {
  const result: RuleResult = {
    rule: inventory.source === 'disks' ? 'unattached-persistent-disk' : 'unassigned-static-external-ipv4',
    version: '1', source: inventory.source, status: 'not_evaluated', conclusion: 'incomplete',
    evaluatedResources: 0, candidates: [], unevaluated: [], collectionIssues: inventory.issues,
  };
  if (inventory.status === 'failed' || inventory.status === 'not_attempted') return result;
  for (const resource of inventory.records) {
    const outcome = assess(inventory.source, resource);
    if (outcome === 'candidate' || outcome === 'not_candidate') {
      result.evaluatedResources++;
      if (outcome === 'candidate') result.candidates.push({ resource: resource.resource, evidence: resource,
        amount: { status: 'unknown', reason: 'pricing_not_collected' }, requiresHumanReview: true });
    } else result.unevaluated.push({ resource: resource.resource, reason: outcome });
  }
  const complete = inventory.status === 'complete' && !inventory.issues.length && !result.unevaluated.length;
  result.status = complete ? 'evaluated' : result.evaluatedResources > 0 ? 'partially_evaluated' : 'not_evaluated';
  result.conclusion = result.candidates.length ? 'candidates_found' : complete ? 'no_matching_candidates' : 'incomplete';
  return result;
}
