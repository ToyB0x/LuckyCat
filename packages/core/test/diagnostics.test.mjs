import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { evaluateInventory } from '../src/diagnostics.ts';
const record = {
  resource: 'projects/debug-example/zones/zone-a/disks/example',
  observedAt: '2026-01-01T00:00:00Z',
  state: 'READY',
  referenceCount: 0,
  referencesOmitted: false,
  diskType: 'pd-balanced',
  sizeGb: '10',
  replicating: false,
};
const inventory = (source, records, extra = {}) => ({
  source,
  status: 'complete',
  records,
  issues: [],
  scopes: [],
  pages: 1,
  startedAt: record.observedAt,
  completedAt: record.observedAt,
  ...extra,
});

test('unattached disks produce current-state evidence with prototype money and mandatory human review', () => {
  const result = evaluateInventory(inventory('disks', [record]));
  assert.equal(result.status, 'evaluated');
  assert.equal(result.conclusion, 'candidates_found');
  assert.deepEqual(result.candidates[0], {
    resource: record.resource,
    evidence: record,
    amount: {
      status: 'estimated',
      basis: 'prototype-fixed-rates',
      monthlyUsd: 1,
      unitPriceUsd: 0.1,
      quantity: 10,
      unit: 'GiB-month',
    },
    requiresHumanReview: true,
  });
});
test('attached and non-ready disks do not match; missing or unsupported evidence stays unevaluated', () => {
  const cases = [
    [{ referenceCount: 1 }, 'no_matching_candidates'],
    [{ state: 'CREATING' }, 'no_matching_candidates'],
    [{ referenceCount: null }, 'incomplete'],
    [{ state: null }, 'incomplete'],
    [{ state: 'NEW_STATE' }, 'incomplete'],
    [{ diskType: null }, 'incomplete'],
    [{ diskType: 'hyperdisk-balanced' }, 'incomplete'],
    [{ replicating: true }, 'incomplete'],
  ];
  for (const [change, conclusion] of cases)
    assert.equal(
      evaluateInventory(inventory('disks', [{ ...record, ...change }])).conclusion,
      conclusion,
    );
});
test('only reserved external IPv4 without references matches; contradictions are not evaluated', () => {
  const ip = { ...record, state: 'RESERVED', addressType: 'EXTERNAL', ipVersion: 'IPV4' };
  for (const [change, conclusion] of [
    [{}, 'candidates_found'],
    [{ addressType: 'INTERNAL' }, 'no_matching_candidates'],
    [{ ipVersion: 'IPV6' }, 'no_matching_candidates'],
    [{ state: 'IN_USE', referenceCount: 1 }, 'no_matching_candidates'],
    [{ state: 'RESERVING' }, 'no_matching_candidates'],
    [{ state: 'RESERVED', referenceCount: 1 }, 'incomplete'],
    [{ state: 'IN_USE' }, 'incomplete'],
    [{ ipVersion: null }, 'incomplete'],
    [{ addressType: null }, 'incomplete'],
    [{ referenceCount: null }, 'incomplete'],
  ])
    assert.equal(
      evaluateInventory(inventory('addresses', [{ ...ip, ...change }])).conclusion,
      conclusion,
    );
});
test('empty complete lists differ from failures and partial lists; valid partial findings remain visible', () => {
  assert.equal(evaluateInventory(inventory('disks', [])).conclusion, 'no_matching_candidates');
  for (const status of ['partial', 'failed', 'not_attempted']) {
    const result = evaluateInventory(
      inventory('disks', [], { status, issues: [{ reason: 'retrieval_failed' }] }),
    );
    assert.equal(result.conclusion, 'incomplete');
    assert.equal(result.status, 'not_evaluated');
  }
  const result = evaluateInventory(
    inventory('disks', [record, { ...record, resource: 'other', state: null }], {
      status: 'partial',
      issues: [{ reason: 'page_limit' }],
    }),
  );
  assert.equal(result.status, 'partially_evaluated');
  assert.equal(result.candidates.length, 1);
  assert.equal(result.unevaluated.length, 1);
  assert.equal(result.collectionIssues[0].reason, 'page_limit');
});
