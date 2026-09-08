import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkGoogleConnection } from '../src/debug/check.ts';
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const der = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
const env = { GOOGLE_AUTH_MODE: 'local-service-account', GOOGLE_DEBUG_PROJECTS: 'debug-example', GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: 'service_account', client_email: 'reader@debug-example.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${Buffer.from(der).toString('base64')}\n-----END PRIVATE KEY-----` }) };

test('no network request before explicit mode, valid credentials and allowed project', async () => {
  const noNetwork = async () => { throw new Error('should not run'); };
  await assert.rejects(checkGoogleConnection({}, 'debug-example', noNetwork), { message: 'debug_disabled' });
  await assert.rejects(checkGoogleConnection(env, 'other-project', noNetwork), { message: 'project_not_allowed' });
  const result = await checkGoogleConnection({ ...env, GOOGLE_SERVICE_ACCOUNT_JSON: 'secret' }, 'debug-example', noNetwork);
  assert.equal(result.authentication, 'failed'); assert.equal(result.reason, 'invalid_credentials'); assert.deepEqual(result.sources, []);
});

test('separates authentication and bounded read probes, preserving partial failure', async () => {
  const urls = [];
  const result = await checkGoogleConnection(env, 'debug-example', async (url, init) => {
    urls.push(url);
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'secret-test-token', token_type: 'Bearer', expires_in: 3600 });
    assert.equal(init.headers.Authorization, 'Bearer secret-test-token');
    assert.equal(init.redirect, 'error'); assert.equal(new URL(url).searchParams.get('maxResults'), '1');
    assert.ok(!init.method || init.method === 'GET');
    if (url.includes('/disks?')) return Response.json({ items: { 'zones/example': {} } });
    if (url.includes('/addresses?')) return new Response('sensitive-provider-error', { status: 403 });
    return Response.json({ unreachables: ['zones/example'] });
  });
  assert.equal(urls.length, 4); assert.equal(result.authentication, 'succeeded'); assert.equal(result.diagnosis, 'not_run');
  assert.deepEqual(result.sources.map(s => s.status), ['read_probe_succeeded', 'access_denied_or_api_disabled', 'read_probe_incomplete']);
  assert.ok(!JSON.stringify(result).includes('secret-test-token')); assert.ok(!JSON.stringify(result).includes('sensitive-provider-error'));
});

test('quotas, malformed response and invalidated credentials remain failures, never zero findings', async () => {
  let probe = 0;
  const result = await checkGoogleConnection(env, 'debug-example', async url => {
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    return [new Response('', { status: 429 }), Response.json(null), new Response('', { status: 401 })][probe++];
  });
  assert.deepEqual(result.sources.map(s => s.status), ['quota_limited', 'retrieval_failed', 'authentication_rejected']);
  assert.equal(result.diagnosis, 'not_run');
});

test('regular Worker entrypoint does not import local debug code', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.main, 'src/index.ts'); assert.equal(config.workflows, undefined);
  const main = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8');
  assert.ok(!main.includes('./local')); assert.ok(!main.includes('./debug'));
});
