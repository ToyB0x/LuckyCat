import { createLocalServiceAccountProvider, CredentialError } from '@luckycat/oidc';

export interface DebugSettings {
  GOOGLE_AUTH_MODE?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_DEBUG_PROJECTS?: string;
}

export function allowedProjects(env: DebugSettings): string[] {
  return [
    ...new Set(
      (env.GOOGLE_DEBUG_PROJECTS ?? '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  ].filter((p) => /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(p));
}

export function debugEnabled(env: DebugSettings): boolean {
  return env.GOOGLE_AUTH_MODE === 'local-service-account';
}

export async function checkGoogleConnection(
  env: DebugSettings,
  project: string,
  fetcher: typeof fetch = fetch,
) {
  if (!debugEnabled(env)) throw new Error('debug_disabled');
  if (!allowedProjects(env).includes(project)) throw new Error('project_not_allowed');
  const checkedAt = new Date().toISOString();
  let token: string;
  try {
    token = await createLocalServiceAccountProvider({
      mode: env.GOOGLE_AUTH_MODE,
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON,
      fetcher,
    }).getAccessToken();
  } catch (error) {
    return {
      project,
      checkedAt,
      authentication: 'failed',
      reason: error instanceof CredentialError ? error.code : 'authentication_failed',
      sources: [],
      diagnosis: 'not_run',
    };
  }
  const sources = [];
  // Bounded access probes only: no pagination, inventory persistence, or diagnosis.
  for (const source of ['disks', 'addresses', 'instances'] as const) {
    try {
      const endpoint = new URL(
        `https://compute.googleapis.com/compute/v1/projects/${project}/aggregated/${source}`,
      );
      endpoint.searchParams.set('maxResults', '1');
      endpoint.searchParams.set('returnPartialSuccess', 'true');
      endpoint.searchParams.set('fields', 'warning,unreachables,items/*/warning');
      const response = await fetcher(endpoint.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });
      let status: string;
      if (!response.ok) {
        status =
          response.status === 401
            ? 'authentication_rejected'
            : response.status === 403
              ? 'access_denied_or_api_disabled'
              : response.status === 429
                ? 'quota_limited'
                : 'retrieval_failed';
      } else {
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
        // Warnings require further inspection; do not claim full access from HTTP 200.
        status = hasIncompleteCoverage(data as Record<string, unknown>)
          ? 'read_probe_incomplete'
          : 'read_probe_succeeded';
      }
      sources.push({ source, status });
    } catch {
      sources.push({ source, status: 'retrieval_failed' });
    }
  }
  return { project, checkedAt, authentication: 'succeeded', sources, diagnosis: 'not_run' };
}

function hasIncompleteCoverage(data: Record<string, unknown>): boolean {
  if (
    data.unreachables !== undefined &&
    (!Array.isArray(data.unreachables) || data.unreachables.length > 0)
  )
    return true;
  const warningNeedsReview = (warning: unknown) =>
    warning !== undefined &&
    (!warning ||
      typeof warning !== 'object' ||
      !('code' in warning) ||
      warning.code !== 'NO_RESULTS_ON_PAGE');
  if (warningNeedsReview(data.warning)) return true;
  if (data.items === undefined) return false;
  if (!data.items || typeof data.items !== 'object' || Array.isArray(data.items)) return true;
  return Object.values(data.items).some(
    (value) =>
      !value ||
      typeof value !== 'object' ||
      warningNeedsReview((value as Record<string, unknown>).warning),
  );
}
