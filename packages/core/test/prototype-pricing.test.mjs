import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { evaluateInventory } from '../src/diagnostics.ts';
import { estimatePrototypeAmount } from '../src/prototype-pricing.ts';

const disk = { resource: 'projects/debug-example/zones/zone-a/disks/disk-a', state: 'READY', referenceCount: 0, referencesOmitted: true, observedAt: '2026-01-01T00:00:00Z', diskType: 'pd-balanced', sizeGb: '100' };

test('fixed disk rates use capacity; regional disks use the prototype multiplier', () => {
  for (const [diskType, monthlyUsd] of [['pd-standard', 4], ['pd-balanced', 10], ['pd-ssd', 17]]) {
    assert.equal(estimatePrototypeAmount('disks', { ...disk, diskType }).monthlyUsd, monthlyUsd);
    assert.equal(estimatePrototypeAmount('disks', { ...disk, diskType, resource: 'projects/debug-example/regions/region-a/disks/disk-a' }).monthlyUsd, monthlyUsd * 2);
  }
});
test('regional and global IPv4 use the same approximate 730-hour price', () => {
  for (const scope of ['regions/region-a', 'global']) {
    const result = estimatePrototypeAmount('addresses', { ...disk, resource: `projects/debug-example/${scope}/addresses/ip-a` });
    assert.deepEqual(result, { status: 'estimated', basis: 'prototype-fixed-rates', monthlyUsd: 7.3, unitPriceUsd: 0.01, quantity: 730, unit: 'IP-hour' });
  }
});
test('missing capacity and unsupported prices do not remove a finding or become zero cost', () => {
  for (const sizeGb of [null, undefined, '', '0', '-1', 'invalid']) {
    const result = evaluateInventory({ source: 'disks', status: 'complete', records: [{ ...disk, sizeGb }], issues: [] });
    assert.equal(result.conclusion, 'candidates_found');
    assert.deepEqual(result.candidates[0].amount, { status: 'unknown', reason: 'invalid_capacity' });
  }
  assert.deepEqual(estimatePrototypeAmount('disks', { ...disk, diskType: 'pd-extreme' }), { status: 'unknown', reason: 'unsupported_prototype_price' });
});
