import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';

/** The host supplies its D1 binding; no database is provisioned here. */
export function createDatabase(binding: D1Database): DrizzleD1Database {
  return drizzle(binding);
}

export * from './diagnostic-history';
