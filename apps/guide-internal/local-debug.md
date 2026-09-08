# Local Google Cloud Debugging

The development-only connection checker uses a **service account JSON key**, not a standard Google API key. It needs no OIDC server. This is an implemented development foundation; the customer diagnosis remains **v0.1 planned · Not available**.

## Configuration

Use Node.js 24 for development and tests. In the ignored `apps/api/.dev.vars` file, set:

```dotenv
GOOGLE_AUTH_MODE="local-service-account"
GOOGLE_DEBUG_PROJECTS="your-debug-project"
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","client_email":"reader@your-debug-project.iam.gserviceaccount.com","private_key":"REPLACE_WITH_YOUR_LOCAL_KEY"}'
```

These are placeholders. Supply the complete JSON from an existing authorized development service account as one JSON string; preserve escaped newlines in the PEM. Keep actual keys outside tracked files and do not paste them into browser forms, source code, commands, or logs. No key is bundled or automatically discovered from another checkout. Leave the mode unset to disable checks. No IAM changes or API activation happen automatically.

Explicitly allow only the projects approved for testing, separated by commas. The service account needs the Compute API list permissions described in [diagnostic design](./diagnostics); a read-only OAuth scope does not restrict other uses of the original key. Use development credentials with appropriately limited IAM access. The key's home project does not implicitly authorize a target project.

## Run and Inspect

Run `pnpm dev` at the repository root. The local API uses `wrangler.local.jsonc` on `127.0.0.1:8787`, and the development Web page on `127.0.0.1:3000` exposes a Google Cloud check panel. Ordinary API builds use `wrangler.jsonc`, which has no debug routes or Workflow binding. Do not deploy the local configuration or expose these unauthenticated debugging tools beyond your machine.

After loading the configured status, choose an allowed project and explicitly request either a direct API check or a local Workflow check. Fetch the Workflow result using its status button. Starting the servers, loading status, or viewing a result does not contact Google Cloud. Clicking a check with valid credentials does contact Google's token endpoint and Compute API, consuming read quotas even though Workers and Workflows run locally.

The check exchanges the JSON-key assertion for a short-lived token and makes at most one list-page probe each for disks, addresses, and instances. Each request has a timeout; there are no automatic retries or full inventory scans. Results distinguish authentication failure, successful or incomplete probes, access denied/API disabled, quota limits, and other retrieval failure. A successful probe is not a completed diagnosis, full permission audit, or proof of no findings. No resource contents or inventory are returned to the browser.

## Boundaries and Verification

- The adapter uses standard Web Crypto and fetch; Workers and Workflow steps share the same credential interface. No subprocess or filesystem access is required inside the Worker.
- Tokens are cached only within a provider instance and expire conservatively. Keys, tokens, and raw Google errors are not API results or Workflow inputs/outputs. Token acquisition happens inside a Workflow step, never as a separate persisted step result.
- Local Workflows persist the selected project, sanitized check result, and time under `.wrangler/`. Treat this as development data; remove local state after stopping the server when it is no longer needed.
- `packages/auth` and the production WIF design remain separate. Debug mode does not implement customer onboarding or tenant authorization.
- `pnpm test` runs the workspace tests through Vite+ and its bundled Vitest (`vp test run`, with APIs from `vite-plus/test`); no separate Vitest dependency is needed. Each package configures tests in `vite.config.ts`. These are Node-environment unit tests; Worker and Workflow runtime checks remain separate.
- The tests check credential signing, expiry, errors, project restrictions, and read-probe semantics using generated test keys and mocked Google responses. It requires no real key or cloud access. Actual Google Cloud connectivity and least-privilege IAM must be verified separately for an explicitly approved project.

Google documents [service account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account); Cloudflare documents [local secrets](https://developers.cloudflare.com/workers/configuration/secrets/) and [local Workflows](https://developers.cloudflare.com/workflows/build/local-development/).
