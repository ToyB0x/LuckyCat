import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalServiceAccountProvider } from '../src/index.ts';

const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const der = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
const credentials = JSON.stringify({ type: 'service_account', client_email: 'reader@debug-example.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${Buffer.from(der).toString('base64')}\n-----END PRIVATE KEY-----\n` });
const options = { mode: 'local-service-account', serviceAccountJson: credentials };
const success = () => Response.json({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });

test('debug is opt-in, and malformed credentials cannot select an arbitrary token endpoint', () => {
  for (const mode of [undefined, 'production', 'wif']) assert.throws(() => createLocalServiceAccountProvider({ ...options, mode }), { message: 'disabled' });
  for (const value of ['invalid-secret', 'null', '{"type":"api_key"}', JSON.stringify({ ...JSON.parse(credentials), token_uri: 'https://example.invalid/collect' })]) {
    assert.throws(() => createLocalServiceAccountProvider({ ...options, serviceAccountJson: value }), { message: 'invalid_credentials' });
  }
});

test('signs a verifiable Google OAuth assertion with a read scope and no delegated subject', async () => {
  const provider = createLocalServiceAccountProvider({ ...options, now: () => 1_000_000,
    fetcher: async (url, init) => {
      assert.equal(url, 'https://oauth2.googleapis.com/token');
      assert.equal(init.redirect, 'error');
      assert.equal(init.method, 'POST');
      const [header, payload, signature] = init.body.get('assertion').split('.');
      assert.equal(JSON.parse(Buffer.from(header, 'base64url')).alg, 'RS256');
      assert.deepEqual(JSON.parse(Buffer.from(payload, 'base64url')), {
        iss: 'reader@debug-example.iam.gserviceaccount.com', aud: url,
        scope: 'https://www.googleapis.com/auth/compute.readonly', iat: 1000, exp: 4600,
      });
      assert.equal(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(signature, 'base64url'), new TextEncoder().encode(`${header}.${payload}`)), true);
      return success();
    },
  });
  assert.equal(await provider.getAccessToken(), 'test-token');
});

test('coalesces requests, refreshes before expiry, and isolates provider caches', async () => {
  let now = 1_000_000, calls = 0;
  const config = { ...options, now: () => now, fetcher: async () => { calls++; return success(); } };
  const first = createLocalServiceAccountProvider(config);
  await Promise.all([first.getAccessToken(), first.getAccessToken()]);
  await first.getAccessToken(); assert.equal(calls, 1);
  now += 3_541_000; await first.getAccessToken(); assert.equal(calls, 2);
  await createLocalServiceAccountProvider(config).getAccessToken(); assert.equal(calls, 3);
});

test('does not leak or cache failures and rejects malformed token responses', async () => {
  let failed = true;
  const provider = createLocalServiceAccountProvider({ ...options, fetcher: async () => {
    if (failed) throw new Error('secret-must-not-escape');
    return success();
  } });
  await assert.rejects(provider.getAccessToken(), { message: 'token_exchange_failed' });
  failed = false; assert.equal(await provider.getAccessToken(), 'test-token');
  for (const result of [{}, { access_token: 'secret', token_type: 'Bearer', expires_in: 0 }, { access_token: 'secret', token_type: 'Bearer', expires_in: 7200 }]) {
    const bad = createLocalServiceAccountProvider({ ...options, fetcher: async () => Response.json(result) });
    await assert.rejects(bad.getAccessToken(), { message: 'token_exchange_failed' });
  }
  const denied = createLocalServiceAccountProvider({ ...options, fetcher: async () => new Response('secret-must-not-escape', { status: 403 }) });
  await assert.rejects(denied.getAccessToken(), { message: 'token_exchange_failed' });
});
