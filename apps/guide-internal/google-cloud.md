# Google Cloud Connection Design

::: info v0.1 planned · Not available
The first-cloud decision is Google Cloud. Connection setup, access checks, scoped retrieval, and an initial diagnosis are the approved experience. Authentication, exact IAM configuration, and individual rule adoption remain proposals. The customer workflow is not implemented. See [local debugging](./local-debug) for the development-only connection check.
:::

## Connection Method: Proposal to Validate

Prefer Workload Identity Federation (WIF) using an OIDC identity for the LuckyCat workload and short-lived Google Cloud credentials. Evaluate customer-owned federation configuration with a dedicated read-only service account and impersonation as the initial design candidate. Google supports both direct resource access and service account impersonation; choose between them after checking the selected APIs and customer setup burden. This is a LuckyCat design proposal, not a claim that impersonation is always required. See the [WIF overview](https://docs.cloud.google.com/iam/docs/workload-identity-federation).

The proposal requires a trusted issuer, signing-key protection and rotation, and immutable organization/workload identities. Bind issuer, audience, subject, customer organization, connection, and permitted projects on the server. A caller-supplied project or service-account identifier must not select another customer's credentials. Never trust every tenant merely because it uses the same issuer. Google documents [requirements for SaaS federation](https://docs.cloud.google.com/iam/docs/use-workload-identity-federation-to-let-customers-access-their-cloud-resources) and [OIDC provider setup](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers).

Cloudflare hosting alone does not establish an OIDC issuer for this design. The issuer implementation or service, token renewal, runtime compatibility, and operating burden require validation before selecting WIF. Customer Google Cloud keys would not be stored, but LuckyCat's own signing credentials would still require protection.

| Alternative | Position |
| --- | --- |
| Delegated user OAuth | Compare only if WIF setup proves too burdensome. Consent, scope requirements, token storage/revocation, user departure, and any verification requirements need a separate design. Not selected. |
| Local CLI / application-default credentials | A local development technique, not the customer Web connection contract. |
| Uploaded long-lived service account key | Not the default onboarding path. Do not introduce key upload as a shortcut around unresolved federation design; Google recommends [avoiding user-managed keys where possible](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys). |

## Setup and Runtime Permissions

A customer administrator configures trust, service-account access, and any required APIs. The runtime identity only reads data needed by adopted rules. It must not receive project administration, IAM modification, API-enablement, or resource-mutation rights.

For the WIF proposal, review IAM, Security Token Service, Service Account Credentials, and setup-related Resource Manager APIs against the chosen flow. Compute Engine API is needed for the initial resource candidates. Publish the final API list, activation projects, trust bindings, and minimal roles only after validating the setup. Billing-export and BigQuery permissions are optional and rule-specific.

Keep authentication success separate from a limited read probe for each required source. Record the checked scope and time, and distinguish denied access, disabled API, quota limits, expired credentials, and transient failure. Do not automatically change IAM or enable an API when a check fails. A probe does not certify complete collection or future access.

## Fit Within the Existing Architecture

- `packages/auth` owns LuckyCat sessions and organization/scope authorization through Better Auth. A LuckyCat login is distinct from authority to read Google Cloud.
- `apps/api` composes authorized connection and diagnosis operations with a server-side Google Cloud adapter. Cloud tokens stay server-side; connection configuration must not enable arbitrary outbound requests.
- `packages/core` owns evaluation and result semantics behind data-source interfaces, independent of Cloudflare, Google SDKs, and HTTP.
- `packages/db` owns persistence. Data schemas, retention, and deletion are not implemented yet.

`packages/oidc` now provides a server-only credential-provider interface and a local service-account JSON adapter for short-lived tokens. An OIDC issuer and customer WIF are not implemented. `apps/api` retains resource reads, and `packages/auth` retains Better Auth sessions and authorization. Workload identity issuance/signing and federation token exchange remain candidates for this package.

## Safety and Data Management

These conditions apply before accepting real customer data:

- Limit permissions, requested fields, and stored evidence to the adopted rules. Resource inventory does not require disk contents, object bodies, environment variables, or application secrets; avoid fetching unrelated metadata fields.
- Authorize connection creation, checks, runs, and result access by organization and explicit project/resource scope. Apply the same boundary to credentials, caches, stored results, and retrieval requests.
- Explain data destinations and collection before consent. Connecting alone must not trigger broad discovery, a diagnosis, or undisclosed external transmission. An explicit check authorizes only its disclosed probes.
- Keep credentials and unnecessary raw responses out of logs, screens, errors, and support exports. Show only permitted, necessary evidence; sanitize provider errors.
- Define retention periods, storage location, deletion handling, and treatment of results/backups after disconnect before ingestion. No guessed retention values or unlimited default retention.
- Bound projects, pages, resources, elapsed time, concurrency, retries, and spend/quota exposure. Report truncation and partial collection. Use bounded backoff; do not repeatedly retry permanent permission errors.
- Disconnect stops new retrieval and token renewal, and defines how in-flight work stops. Document cloud-side revocation separately, including issued-token lifetime and propagation behavior; invalidate LuckyCat caches and prevent further use of cached credentials. Stored-result deletion is a separate lifecycle.

Read-only diagnosis excludes resource changes, not API requests, query execution, or customer-side costs. Account for [Compute read quotas](https://docs.cloud.google.com/compute/api-quota) and any optional [BigQuery storage/query charges](https://cloud.google.com/bigquery/pricing). Approve budgets and limits before allowing those queries.

## Release Gates

| Decision or verification | Required outcome before provision |
| --- | --- |
| Authentication and onboarding | Select WIF or an alternative; confirm issuer operation, customer setup effort, exact permissions/APIs, and organization-policy compatibility. |
| Isolation and revocation | Verify wrong-organization/project requests are denied, no credentials reach the browser, expiry/renewal is correct, and disconnect plus cloud revocation behave as documented. |
| Data lifecycle and limits | Approve retention, deletion, in-flight cancellation, collection/retry bounds, and cost controls. |
| End-to-end connection | Test approved setup and denied/disabled/partial/quota cases in a separately authorized environment using the actual LuckyCat runtime. Documentation or mock tests alone do not establish readiness. |

The [diagnostic design](./diagnostics) defines rule-level requirements and acceptance cases. Do not change availability until the customer flow and these gates have been verified.
