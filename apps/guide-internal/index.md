# Internal Guide

Keep the customer experience and internal design knowledge aligned as LuckyCat evolves.

## Main Architecture

The following stack is selected for LuckyCat. The guide sites and minimal application/package scaffolds exist. Authentication, persistence, and FinOps workflows remain to be implemented.

| Area | Technology / responsibility |
| --- | --- |
| Guide sites | VitePress, with English and Japanese content |
| Web application | TanStack Start for the user interface and application routing |
| API | [oRPC](https://orpc.dev/) for typed client-server communication |
| Authentication and authorization | Encapsulate [Better Auth](https://better-auth.com/docs/adapters/drizzle) in `packages/auth`, preferring its authentication, session, and access-control capabilities over custom implementations |
| Business logic | A `core` package for FinOps domain logic and use cases |
| Persistence | [Drizzle ORM with Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1) for schema definitions and database access |

The web application calls the API through oRPC. The API delegates session validation and authorization to `packages/auth` before invoking core use cases. Keep core logic independent of UI, HTTP, authentication, and database libraries; supply persistence through interfaces. Keep D1 access and server-side authentication code out of browser bundles.

### Authentication Boundary

Keep Better Auth configuration, plugin selection, session handling, roles, permissions, and authorization checks in `packages/auth`. Prefer Better Auth's available capabilities; add custom logic only for product requirements they do not cover. Applications consume the package's interfaces rather than duplicating Better Auth-specific knowledge.

`packages/auth` integrates with `packages/db` through the Drizzle adapter. The DB package owns schema storage, migrations, and D1 access; authentication and authorization policy belongs to the auth package. Expose browser-safe client integration separately from server-only functionality, and enforce authorization on the server.

## Monorepo Foundation

| Path | Purpose | Availability |
| --- | --- | --- |
| `apps/guide` | Customer-facing VitePress site and landing page | Existing |
| `apps/guide-internal` | Internal VitePress site | Existing |
| `apps/web` | TanStack Start application and oRPC client | Scaffold |
| `apps/api` | oRPC endpoints and composition of auth, core, and DB packages | Scaffold |
| `packages/auth` | Better Auth integration, authentication, sessions, roles, permissions, and authorization interfaces | Scaffold |
| `packages/core` | FinOps domain logic, use cases, and persistence interfaces | Scaffold |
| `packages/db` | Drizzle schemas, migrations, and D1 access, including authentication persistence | Scaffold |

Use pnpm Workspace for `apps/*` and `packages/*`. Keep app-specific wiring in `apps/` and reusable responsibilities in `packages/`. Both guide sites continue to build from Markdown.

### Development Tooling

Use **Vite+ (VitePlus)** instead of Turborepo for workspace task execution and caching. Retain pnpm for package management. [Vite+ Run](https://viteplus.dev/guide/run) supports dependency-ordered workspace tasks; caching for package scripts must be explicitly enabled.

The root development dependency provides Vite+ locally; no global installation is required. `pnpm dev`, `pnpm typecheck`, and `pnpm build` run workspace tasks through `vp run`. Type checks and builds enable caching. The guide packages retain their VitePress scripts; the web app uses Vite+ for its TanStack Start build.

### Starter and CI

- `pnpm dev` starts both guides, the web app, and the API together through Vite+.
- Web: TanStack Start Hello World at `http://127.0.0.1:3000`.
- API: local Cloudflare Worker at `http://127.0.0.1:8787`. `GET /` returns a greeting; `/rpc/hello` is an unauthenticated oRPC example.
- `packages/core` supplies the greeting. `packages/db` provides a D1 client factory; no database, schema, or migrations are created yet.
- `packages/auth` provides a server-only Better Auth factory requiring a database, base URL, secret, and trusted origins. No authentication routes, login methods, roles, or permissions are enabled. It is not yet wired into the API.
- The web starter does not yet call oRPC. All protected product endpoints and workflows remain to be designed.
- Shared packages export TypeScript source for workspace consumers and emit JavaScript/declarations during builds. The generated web route tree is checked in so type checks work on a fresh checkout.
- GitHub Actions runs a frozen-lockfile install, `pnpm typecheck`, and `pnpm build` on pull requests and pushes to `main`. API builds use Wrangler dry-run; CI needs no Cloudflare account, secrets, or deployment access.

## Infrastructure Selection Criteria

Actively use **Cloudflare infrastructure** to keep operating costs low and offer the service free of charge wherever possible. Treat free availability as a design goal, not a guarantee that every feature or workload can be supported at no cost.

Database: **Cloudflare D1**, accessed through Drizzle ORM. Keep database schema and migrations in `packages/db`.

For application hosting, evaluate D1 binding access, TanStack Start and Better Auth runtime compatibility, operating cost, and deployment simplicity. Validate database migrations and authentication behavior against D1 during implementation.

When Cloudflare's specifications or limits cannot meet a requirement, consider other cloud providers for the affected component. Also consider browser-side processing, such as **DuckDB WASM**, to reduce server-side computation where appropriate. Evaluate these alternatives against workload needs, browser resource usage, user experience, and total operating cost; they are options to assess, not additional selected infrastructure.

Specific Cloudflare services for application and guide hosting, deployment configuration, operating budget, and any exceptions: [UNDECIDED]. Make these choices within the Cloudflare-first direction above.

---

This guide addresses the team and AI contributors. Its source is public in this repository.
