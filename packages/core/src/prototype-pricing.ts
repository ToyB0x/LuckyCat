import type { ResourceObservation, SourceKind } from './diagnostics';

export type PrototypeAmount =
  | {
      status: 'estimated';
      basis: 'prototype-fixed-rates';
      monthlyUsd: number;
      unitPriceUsd: number;
      quantity: number;
      unit: 'GiB-month' | 'IP-hour';
    }
  | { status: 'unknown'; reason: 'unsupported_prototype_price' | 'invalid_capacity' };

// UI prototype only: representative USD rates, without regional pricing,
// discounts, free tiers or BYOIP adjustments. No live pricing or expiry policy.
// https://cloud.google.com/compute/disks-image-pricing
// https://cloud.google.com/vpc/network-pricing#ipaddress
const diskRates: Record<string, number> = {
  'pd-standard': 0.04,
  'pd-balanced': 0.1,
  'pd-ssd': 0.17,
};

export function estimatePrototypeAmount(
  source: SourceKind,
  resource: ResourceObservation,
): PrototypeAmount {
  let unitPriceUsd: number, quantity: number, unit: 'GiB-month' | 'IP-hour';
  if (source === 'addresses') {
    unitPriceUsd = 0.01;
    quantity = 730;
    unit = 'IP-hour';
  } else {
    const rate = diskRates[resource.diskType ?? ''];
    if (rate === undefined) return { status: 'unknown', reason: 'unsupported_prototype_price' };
    quantity = Number(resource.sizeGb);
    if (!Number.isSafeInteger(quantity) || quantity <= 0)
      return { status: 'unknown', reason: 'invalid_capacity' };
    unitPriceUsd = rate * (resource.resource.split('/')[2] === 'regions' ? 2 : 1);
    unit = 'GiB-month';
  }
  return {
    status: 'estimated',
    basis: 'prototype-fixed-rates',
    monthlyUsd: Math.round(unitPriceUsd * quantity * 100) / 100,
    unitPriceUsd,
    quantity,
    unit,
  };
}
