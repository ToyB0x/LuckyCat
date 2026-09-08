import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { collectInventory, collectionLimits } from '../src/google-cloud/inventory.ts';
import { evaluateInventory } from '@luckycat/core';
const project = 'debug-example';
const prefix = `https://www.googleapis.com/compute/v1/projects/${project}`;
const disk = (name = 'disk-a', extra = {}) => ({ selfLink: `${prefix}/zones/zone-a/disks/${name}`, type: `${prefix}/zones/zone-a/diskTypes/pd-balanced`, status: 'READY', sizeGb: '10', ...extra });
const page = (rows, extra = {}) => ({ items: { 'zones/zone-a': { disks: rows } }, ...extra });
const collect = (fetcher, source = 'disks', signal = new AbortController().signal) => collectInventory(project, source, 'test-token', signal, fetcher);

test('paginates fixed endpoints and normalizes only selected data; omitted repeated users means no reported users', async () => {
  const urls = [];
  const result = await collect(async (url, init) => {
    urls.push(url); const u = new URL(url);
    assert.equal(u.origin, 'https://compute.googleapis.com'); assert.equal(init.redirect, 'manual');
    assert.equal(init.headers.Authorization, 'Bearer test-token'); assert.equal(u.searchParams.get('maxResults'), '100');
    assert.equal(u.searchParams.get('includeAllScopes'), 'true'); assert.ok(u.searchParams.get('fields').includes('users'));
    if (urls.length === 1) return Response.json(page([disk('disk-a', { labels: { secret: 'do-not-return' }, description: 'do-not-return' })], { nextPageToken: 'next' }));
    assert.equal(u.searchParams.get('pageToken'), 'next');
    return Response.json(page([disk('disk-b', { users: [`${prefix}/zones/zone-a/instances/vm-a`] })]));
  });
  assert.equal(urls.length, 2); assert.equal(result.status, 'complete'); assert.equal(result.records.length, 2);
  assert.equal(result.records[0].referenceCount, 0); assert.equal(result.records[0].referencesOmitted, true);
  assert.equal(evaluateInventory(result).candidates.length, 1);
  assert.ok(!JSON.stringify(result).includes('do-not-return')); assert.ok(!JSON.stringify(result).includes('test-token'));
});
test('partial warnings, malformed rows and identities never masquerade as clean empty inventory', async () => {
  for (const [data, reason] of [
    [page([], { warning: { code: 'SOME_WARNING' } }), 'provider_warning'],
    [{ items: { 'zones/zone-a': { warning: { code: 'SOME_WARNING' }, disks: [disk()] } } }, 'scope_warning'],
    [page([], { unreachables: ['zones/zone-b'] }), 'unreachable_scope'],
    [page([disk('disk-a', { selfLink: 'https://example.invalid/resource' })]), 'invalid_resource_identity'],
    [{ items: { 'zones/zone-a': {} } }, 'missing_resource_list'], [null, 'invalid_response'], [{}, 'invalid_response'], [{ unreachables: [] }, 'invalid_response'],
  ]) {
    const result = await collect(async () => Response.json(data));
    assert.ok(result.issues.some(i => i.reason === reason)); assert.equal(evaluateInventory(result).conclusion, 'incomplete');
  }
  const empty = await collect(async () => Response.json({ items: { 'zones/zone-a': { warning: { code: 'NO_RESULTS_ON_PAGE' } } } }));
  assert.equal(empty.status, 'complete'); assert.equal(evaluateInventory(empty).conclusion, 'no_matching_candidates');
});
test('preserves independent findings when a later page fails; classifies HTTP failures without provider details', async () => {
  for (const [status, reason] of [[401, 'authentication_rejected'], [403, 'access_denied_or_api_disabled'], [429, 'quota_limited'], [307, 'retrieval_failed'], [500, 'retrieval_failed']]) {
    let requests = 0;
    const result = await collect(async () => ++requests === 1 ? Response.json(page([disk()], { nextPageToken: 'next' })) : new Response('secret-error', { status }));
    assert.equal(result.status, 'partial'); assert.equal(result.issues[0].reason, reason);
    assert.equal(evaluateInventory(result).candidates.length, 1); assert.equal(requests, 2); assert.ok(!JSON.stringify(result).includes('secret-error'));
  }
});
test('page, record, response-byte and deadline limits preserve incomplete status', async () => {
  let requests = 0;
  const pages = await collect(async () => Response.json(page([disk(`disk-${++requests}`)], { nextPageToken: `next-${requests}` })));
  assert.equal(requests, collectionLimits.pagesPerSource); assert.equal(pages.issues.at(-1).reason, 'page_limit');
  const records = await collect(async () => Response.json(page(Array.from({ length: 501 }, (_, i) => disk(`disk-${i}`)))));
  assert.equal(records.records.length, 500); assert.equal(records.issues.at(-1).reason, 'record_limit');
  const bytes = await collect(async () => new Response('x'.repeat(collectionLimits.bytesPerResponse + 1)));
  assert.equal(bytes.status, 'failed'); assert.equal(bytes.issues[0].reason, 'response_size_limit');
  const controller = new AbortController(); controller.abort();
  const timed = await collect(async () => { throw new Error('should not fetch'); }, 'disks', controller.signal);
  assert.equal(timed.issues[0].reason, 'collection_timeout');
});
test('repeated pagination tokens stop, and contradictory duplicate resources cannot remain candidates', async () => {
  let requests = 0;
  const result = await collect(async () => Response.json(page([disk('disk-a', ++requests === 1 ? {} : { users: [`${prefix}/zones/zone-a/instances/vm-a`] })], { nextPageToken: 'same' })));
  assert.equal(requests, 2); assert.equal(result.records.length, 0);
  assert.ok(result.issues.some(i => i.reason === 'conflicting_resource')); assert.ok(result.issues.some(i => i.reason === 'repeated_page_token'));
  assert.equal(evaluateInventory(result).conclusion, 'incomplete');
});
test('null users and missing type remain unknown; malformed sources fail without leaking exceptions', async () => {
  const result = await collect(async () => Response.json(page([disk('disk-a', { users: null }), disk('disk-b', { type: null })])));
  assert.equal(evaluateInventory(result).unevaluated.length, 2);
  const failed = await collect(async () => { throw new Error('secret'); });
  assert.equal(failed.status, 'failed'); assert.ok(!JSON.stringify(failed).includes('secret'));
});
test('regional and global external IPv4 are evaluated without returning actual IP addresses', async () => {
  const result = await collect(async () => Response.json({ items: Object.fromEntries(['regions/region-a', 'global'].map(scope => [scope, { addresses: [{ selfLink: `${prefix}/${scope}/addresses/address-a`, status: 'RESERVED', addressType: 'EXTERNAL', ipVersion: 'IPV4', address: '203.0.113.10' }] }])) }), 'addresses');
  assert.equal(result.status, 'complete'); assert.equal(evaluateInventory(result).candidates.length, 2);
  assert.ok(!JSON.stringify(result).includes('203.0.113.10'));
});

test('empty global disk scope is harmless, while unrecognized nonempty disk scopes stay incomplete', async () => {
  const empty = await collect(async () => Response.json({ ...page([disk()]), items: { ...page([disk()]).items, global: { warning: { code: 'NO_RESULTS_ON_PAGE' } } } }));
  assert.equal(empty.status, 'complete'); assert.equal(evaluateInventory(empty).candidates.length, 1);
  const unsupported = await collect(async () => Response.json({ items: { global: { disks: [] } } }));
  assert.equal(unsupported.issues[0].reason, 'unsupported_scope');
});
test('omitted IP metadata uses documented defaults and a validated IPv4 value, never arbitrary missing data', async () => {
  for (const [raw, expected] of [
    [{ address: '203.0.113.10' }, 'candidates_found'],
    [{ address: '999.0.0.1' }, 'incomplete'], [{ address: '020.0.0.1' }, 'incomplete'], [{ address: '2001:db8::1' }, 'incomplete'],
    [{ address: '203.0.113.10', addressType: null }, 'incomplete'], [{ address: '203.0.113.10', ipVersion: null }, 'incomplete'], [{}, 'incomplete'],
  ]) {
    const result = await collect(async () => Response.json({ items: { global: { addresses: [{ selfLink: `${prefix}/global/addresses/address-a`, status: 'RESERVED', ...raw }] } } }), 'addresses');
    assert.equal(evaluateInventory(result).conclusion, expected);
    assert.ok(!JSON.stringify(result).includes('203.0.113.10'));
    if (expected === 'candidates_found') { assert.equal(result.records[0].ipVersionInferred, true); assert.equal(result.records[0].addressTypeDefaulted, true); }
  }
});

test('a scope marked unreachable cannot contribute findings even if a prior page returned resources there', async () => {
  let calls = 0;
  const result = await collect(async () => ++calls === 1 ? Response.json(page([disk()], { nextPageToken: 'next' })) : Response.json(page([disk()], { unreachables: ['zones/zone-a'] })));
  assert.equal(result.records.length, 0);
  assert.equal(evaluateInventory(result).conclusion, 'incomplete');
});
