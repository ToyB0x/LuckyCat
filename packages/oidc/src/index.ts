/** Server-only credentials. Never return these objects from an API or Workflow step. */
export interface AccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export class CredentialError extends Error {
  readonly code: 'disabled' | 'invalid_credentials' | 'token_exchange_failed';
  constructor(code: CredentialError['code']) {
    super(code);
    this.code = code;
    this.name = 'CredentialError';
  }
}

const tokenEndpoint = 'https://oauth2.googleapis.com/token';
const scope = 'https://www.googleapis.com/auth/compute.readonly';

export interface LocalCredentialOptions {
  mode: string | undefined;
  serviceAccountJson: string | undefined;
  fetcher?: typeof fetch;
  now?: () => number;
}

/** An explicit debug adapter, not an OIDC issuer or the customer WIF implementation. */
export function createLocalServiceAccountProvider(options: LocalCredentialOptions): AccessTokenProvider {
  if (options.mode !== 'local-service-account') throw new CredentialError('disabled');
  let email: string;
  let pem: string;
  let keyId: string | undefined;
  try {
    const parsed = JSON.parse(options.serviceAccountJson ?? '');
    if (parsed.type !== 'service_account'
      || typeof parsed.client_email !== 'string'
      || !/^[^\s@]+@[^\s@]+\.gserviceaccount\.com$/.test(parsed.client_email)
      || typeof parsed.private_key !== 'string'
      || !parsed.private_key.startsWith('-----BEGIN PRIVATE KEY-----')
      || (parsed.token_uri !== undefined && parsed.token_uri !== tokenEndpoint)
      || (parsed.private_key_id !== undefined && typeof parsed.private_key_id !== 'string')) {
      throw new Error();
    }
    email = parsed.client_email;
    pem = parsed.private_key;
    keyId = parsed.private_key_id;
  } catch {
    throw new CredentialError('invalid_credentials');
  }
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  // Isolated to this credential-provider instance, never shared by email or key ID.
  let cached: { token: string; expiresAt: number } | undefined;
  let pending: Promise<string> | undefined;

  async function exchange(): Promise<string> {
    const issuedAt = Math.floor(now() / 1000);
    let assertion: string;
    try {
      const encodedKey = pem.replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
      const keyBytes = Uint8Array.from(atob(encodedKey), c => c.charCodeAt(0));
      const key = await crypto.subtle.importKey('pkcs8', keyBytes,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
      const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', ...(keyId ? { kid: keyId } : {}) }));
      const payload = base64url(JSON.stringify({ iss: email, aud: tokenEndpoint, scope, iat: issuedAt, exp: issuedAt + 3600 }));
      const input = `${header}.${payload}`;
      const signed = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
      assertion = `${input}.${base64url(new Uint8Array(signed))}`;
    } catch {
      throw new CredentialError('invalid_credentials');
    }
    try {
      const response = await fetcher(tokenEndpoint, {
        method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10_000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
      });
      if (!response.ok) throw new Error();
      const result = await response.json() as { access_token?: unknown; expires_in?: unknown; token_type?: unknown };
      if (typeof result.access_token !== 'string' || !result.access_token || /\s/.test(result.access_token)
        || result.token_type !== 'Bearer' || typeof result.expires_in !== 'number'
        || !Number.isFinite(result.expires_in) || result.expires_in <= 60 || result.expires_in > 3600) throw new Error();
      const expiresAt = issuedAt * 1000 + result.expires_in * 1000;
      if (expiresAt <= now() + 60_000) throw new Error();
      cached = { token: result.access_token, expiresAt };
      return cached.token;
    } catch {
      // Provider bodies and exception messages may contain credentials. Never propagate them.
      throw new CredentialError('token_exchange_failed');
    }
  }

  return {
    getAccessToken() {
      if (cached && cached.expiresAt > now() + 60_000) return Promise.resolve(cached.token);
      pending ??= exchange().finally(() => { pending = undefined; });
      return pending;
    },
  };
}

function base64url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
