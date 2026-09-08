import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { createDatabase } from '@luckycat/db';

export interface AuthOptions {
  database: ReturnType<typeof createDatabase>;
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
}

/** Server-only foundation. Configure providers and schema before exposing routes. */
export function createAuth(options: AuthOptions): ReturnType<typeof betterAuth> {
  const config: BetterAuthOptions = {
    database: drizzleAdapter(options.database, { provider: 'sqlite' }),
    baseURL: options.baseURL,
    secret: options.secret,
    trustedOrigins: options.trustedOrigins,
    emailAndPassword: { enabled: false },
  };
  return betterAuth(config);
}
