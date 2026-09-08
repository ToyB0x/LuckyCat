import type { Inventory, ResourceObservation, SourceKind } from '@luckycat/core';

export const collectionLimits = {
  pageSize: 100,
  pagesPerSource: 5,
  recordsPerSource: 500,
  bytesPerResponse: 2 * 1024 * 1024,
  requestMs: 10_000,
  totalMs: 30_000,
} as const;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

/** Accept only identities within the explicitly requested project and returned scope. */
function identity(
  value: unknown,
  project: string,
  scope: string,
  collection: string,
): string | null {
  if (typeof value !== 'string') return null;
  const prefix = `projects/${project}/${scope}/${collection}/`;
  const path = value.replace(/^https:\/\/(?:www|compute)\.googleapis\.com\/compute\/v1\//, '');
  return path.startsWith(prefix) && /^[a-z][a-z0-9-]{0,62}$/.test(path.slice(prefix.length))
    ? path
    : null;
}
function normalize(
  raw: unknown,
  project: string,
  scope: string,
  source: SourceKind,
  observedAt: string,
): ResourceObservation | null {
  if (!object(raw)) return null;
  const resource = identity(raw.selfLink, project, scope, source);
  if (!resource) return null;
  // Compute omits empty repeated fields. Explicit null/malformed values remain unknown.
  const users = raw.users === undefined ? [] : raw.users;
  const referenceCount =
    Array.isArray(users) &&
    users.every(
      (u) =>
        typeof u === 'string' &&
        /^https:\/\/(?:www|compute)\.googleapis\.com\/compute\/v1\/projects\/[^\s]+$/.test(u),
    )
      ? users.length
      : null;
  const common = {
    resource,
    observedAt,
    state: text(raw.status),
    referenceCount,
    referencesOmitted: raw.users === undefined,
  };
  if (source === 'addresses') {
    const ipv4 =
      typeof raw.address === 'string' &&
      /^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(raw.address) &&
      raw.address.split('.').every((part) => Number(part) <= 255);
    return {
      ...common,
      // Compute documents EXTERNAL as the omitted addressType default.
      addressType: raw.addressType === undefined ? 'EXTERNAL' : text(raw.addressType),
      addressTypeDefaulted: raw.addressType === undefined,
      ipVersion: raw.ipVersion === undefined && ipv4 ? 'IPV4' : text(raw.ipVersion),
      ipVersionInferred: raw.ipVersion === undefined && ipv4,
    };
  }
  const type = identity(raw.type, project, scope, 'diskTypes');
  return {
    ...common,
    diskType: type?.split('/').at(-1) ?? null,
    sizeGb: typeof raw.sizeGb === 'string' && /^\d+$/.test(raw.sizeGb) ? raw.sizeGb : null,
    replicating: raw.asyncPrimaryDisk !== undefined || raw.asyncSecondaryDisks !== undefined,
  };
}

class ResponseLimit extends Error {}
async function readPage(response: Response): Promise<unknown> {
  if (!response.body) throw new Error();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > collectionLimits.bytesPerResponse) throw new ResponseLimit();
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function collectInventory(
  project: string,
  source: SourceKind,
  token: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Inventory> {
  const result: Inventory = {
    source,
    status: 'failed',
    startedAt: new Date().toISOString(),
    completedAt: '',
    pages: 0,
    scopes: [],
    issues: [],
    records: [],
  };
  const records = new Map<string, ResourceObservation>();
  const conflicts = new Set<string>();
  const scopes = new Set<string>();
  const unreachableScopes = new Set<string>();
  const seenTokens = new Set<string>();
  let next: string | undefined;
  let receivedRecords = 0;
  const issue = (reason: string, scope?: string) =>
    result.issues.push({ reason, ...(scope ? { scope } : {}) });
  try {
    for (let page = 0; page < collectionLimits.pagesPerSource; page++) {
      if (signal.aborted) {
        issue('collection_timeout');
        break;
      }
      const endpoint = new URL(
        `https://compute.googleapis.com/compute/v1/projects/${project}/aggregated/${source}`,
      );
      endpoint.searchParams.set('maxResults', String(collectionLimits.pageSize));
      endpoint.searchParams.set('returnPartialSuccess', 'true');
      endpoint.searchParams.set('includeAllScopes', 'true');
      const fields =
        source === 'disks'
          ? 'selfLink,status,type,sizeGb,users,asyncPrimaryDisk,asyncSecondaryDisks'
          : 'selfLink,status,addressType,ipVersion,address,users';
      endpoint.searchParams.set(
        'fields',
        `nextPageToken,warning/code,unreachables,items/*/warning/code,items/*/${source}(${fields})`,
      );
      if (next) endpoint.searchParams.set('pageToken', next);
      const response = await fetcher(endpoint.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
        signal: AbortSignal.any([signal, AbortSignal.timeout(collectionLimits.requestMs)]),
      });
      if (!response.ok) {
        issue(
          response.status === 401
            ? 'authentication_rejected'
            : response.status === 403
              ? 'access_denied_or_api_disabled'
              : response.status === 429
                ? 'quota_limited'
                : 'retrieval_failed',
        );
        await response.body?.cancel();
        break;
      }
      const data = await readPage(response);
      if (!object(data)) {
        issue('invalid_response');
        break;
      }
      if (
        data.items === undefined &&
        (!object(data.warning) || data.warning.code !== 'NO_RESULTS_ON_PAGE')
      ) {
        issue('invalid_response');
        break;
      }
      result.pages++;
      if (
        data.warning !== undefined &&
        (!object(data.warning) || data.warning.code !== 'NO_RESULTS_ON_PAGE')
      )
        issue('provider_warning');
      if (data.unreachables !== undefined) {
        if (!Array.isArray(data.unreachables)) issue('invalid_response');
        else
          for (const scope of data.unreachables) {
            const knownScope =
              typeof scope === 'string' && /^(zones|regions)\/[a-z0-9-]+$/.test(scope)
                ? scope
                : undefined;
            issue('unreachable_scope', knownScope);
            if (knownScope) {
              unreachableScopes.add(knownScope);
              for (const id of records.keys())
                if (id.startsWith(`projects/${project}/${knownScope}/`)) records.delete(id);
            }
          }
      }
      if (data.items !== undefined && !object(data.items)) {
        issue('invalid_response');
        break;
      }
      for (const [scope, group] of Object.entries(data.items ?? {})) {
        if (scope !== 'global' && !/^(zones|regions)\/[a-z0-9-]+$/.test(scope)) {
          issue('unsupported_scope');
          continue;
        }
        scopes.add(scope);
        if (unreachableScopes.has(scope)) continue;
        if (!object(group)) {
          issue('invalid_scope_response', scope);
          continue;
        }
        const rows = group[source];
        if (group.warning !== undefined) {
          if (
            !object(group.warning) ||
            group.warning.code !== 'NO_RESULTS_ON_PAGE' ||
            (rows !== undefined && (!Array.isArray(rows) || rows.length > 0))
          )
            issue('scope_warning', scope);
          continue;
        }
        if (
          (source === 'disks' && scope === 'global') ||
          (source === 'addresses' && scope.startsWith('zones/'))
        ) {
          issue('unsupported_scope', scope);
          continue;
        }
        if (!Array.isArray(rows)) {
          issue('missing_resource_list', scope);
          continue;
        }
        for (const raw of rows) {
          if (++receivedRecords > collectionLimits.recordsPerSource) {
            issue('record_limit');
            break;
          }
          const record = normalize(raw, project, scope, source, new Date().toISOString());
          if (!record) {
            issue('invalid_resource_identity', scope);
            continue;
          }
          const previous = records.get(record.resource);
          if (
            previous &&
            JSON.stringify({ ...previous, observedAt: '' }) !==
              JSON.stringify({ ...record, observedAt: '' })
          ) {
            records.delete(record.resource);
            conflicts.add(record.resource);
            issue('conflicting_resource', record.resource);
          } else if (!conflicts.has(record.resource)) records.set(record.resource, record);
        }
        if (receivedRecords > collectionLimits.recordsPerSource) break;
      }
      if (receivedRecords > collectionLimits.recordsPerSource) break;
      if (data.nextPageToken === undefined || data.nextPageToken === '') {
        next = undefined;
        break;
      }
      if (typeof data.nextPageToken !== 'string' || data.nextPageToken.length > 8192) {
        issue('invalid_page_token');
        break;
      }
      next = data.nextPageToken;
      if (seenTokens.has(next)) {
        issue('repeated_page_token');
        break;
      }
      seenTokens.add(next);
      if (page + 1 === collectionLimits.pagesPerSource) issue('page_limit');
    }
  } catch (error) {
    issue(
      error instanceof ResponseLimit
        ? 'response_size_limit'
        : signal.aborted
          ? 'collection_timeout'
          : 'retrieval_failed',
    );
  }
  result.records = [...records.values()];
  result.scopes = [...scopes].sort();
  result.completedAt = new Date().toISOString();
  result.status = result.issues.length ? (result.pages ? 'partial' : 'failed') : 'complete';
  return result;
}
