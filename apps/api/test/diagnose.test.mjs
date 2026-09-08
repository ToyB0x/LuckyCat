import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { diagnoseGoogleCloud } from '../src/debug/diagnose.ts';
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const der = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
const env = { GOOGLE_AUTH_MODE: 'local-service-account', GOOGLE_DEBUG_PROJECTS: 'debug-example', GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: 'service_account', client_email: 'reader@debug-example.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${Buffer.from(der).toString('base64')}\n-----END PRIVATE KEY-----` }) };

test('authentication and allowlist gates prevent collection; failed authentication leaves both rules unevaluated', async () => {
  const noNetwork = async () => { throw new Error('unexpected'); };
  await assert.rejects(diagnoseGoogleCloud({}, 'debug-example', noNetwork), { message: 'debug_disabled' });
  await assert.rejects(diagnoseGoogleCloud(env, 'other-project', noNetwork), { message: 'project_not_allowed' });
  const result = await diagnoseGoogleCloud({ ...env, GOOGLE_SERVICE_ACCOUNT_JSON: 'invalid' }, 'debug-example', noNetwork);
  assert.equal(result.authentication, 'failed'); assert.equal(result.status, 'not_evaluated');
  assert.ok(result.sources.every(s => s.status === 'not_attempted'));
  assert.ok(result.rules.every(r => r.status === 'not_evaluated' && r.conclusion === 'incomplete'));
});
test('end-to-end JSON keeps one source failure separate from valid findings and never includes tokens or raw inventory', async () => {
  const urls = [];
  const result = await diagnoseGoogleCloud(env, 'debug-example', async url => {
    urls.push(url);
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'do-not-expose-token', token_type: 'Bearer', expires_in: 3600 });
    if (url.includes('/disks?')) return new Response('do-not-expose-error', { status: 403 });
    return Response.json({ items: { 'regions/region-a': { addresses: [{ selfLink: 'https://www.googleapis.com/compute/v1/projects/debug-example/regions/region-a/addresses/address-a', status: 'RESERVED', addressType: 'EXTERNAL', ipVersion: 'IPV4', address: '203.0.113.10', description: 'do-not-expose-description' }] } } });
  });
  assert.equal(urls.length, 3); assert.equal(result.authentication, 'succeeded'); assert.equal(result.status, 'partially_evaluated');
  assert.equal(result.rules[0].conclusion, 'incomplete'); assert.equal(result.rules[1].candidates.length, 1);
  assert.equal(result.schemaVersion, '2');
  assert.deepEqual(result.rules[1].candidates[0].amount, { status: 'estimated', basis: 'prototype-fixed-rates', monthlyUsd: 7.3, unitPriceUsd: 0.01, quantity: 730, unit: 'IP-hour' });
  const serialized = JSON.stringify(result);
  for (const secret of ['do-not-expose', '203.0.113.10', 'private_key']) assert.ok(!serialized.includes(secret));
  assert.ok(result.sources.every(s => !('records' in s)));
  assert.deepEqual(JSON.parse(serialized), result);
});
