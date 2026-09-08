# Initial Diagnostic Design

::: info v0.1 planned · Not available
Google Cloud setup → connection and permission checks → scoped collection → rule evaluation → candidates and evidence is the approved experience. Customer capabilities remain unavailable. Local development implements the first two rules below; the stopped-VM rule follows a decision on stop duration and exclusions.
:::

## Small Initial Rule Set

Prioritize three candidates sharing Compute Engine metadata. Their detection must work without billing exports or BigQuery; money is an independent enrichment. Do not limit the release to one rule or commit to an exhaustive catalog.

| Candidate and recommendation | Data and API permission candidates | Observation and condition | Exclusions and missing evidence |
| --- | --- | --- | --- |
| Unattached persistent disks — recommend | Disk state, identity, location, type, capacity, and attachments; `disks.aggregatedList`, `compute.disks.list`. | Current inventory establishes no attachment. Any continuous-unused-period condition requires history; creation age is only resource age. | Exclude attached disks and non-ready transitions. Unknown attachment/state is unevaluated, subject to documented API field semantics. Recovery/migration retention needs human review. |
| Unassigned static external IPv4 — recommend | Address scope, type, IP version, reservation state, and references; `addresses.aggregatedList`, `compute.addresses.list`. | Current external IPv4 reservation with no references. A grace period or continuous-unused claim needs a defined time basis. | Exclude internal addresses, IPv6, and in-use addresses. Missing or contradictory state/reference data is unevaluated. Planned reuse is not observable from inventory alone. |
| Disks retained on stopped VMs — recommend subject to stop-duration decision | Disk inventory plus VM identity, state, stop timestamp, and attachments; `instances.aggregatedList`, `compute.instances.list`, plus disk reads. | All attachments resolve to eligible stopped VMs and meet an agreed stop-duration threshold. Use observed transition times, never disk creation age. | Running attachments exclude the candidate. Unknown, out-of-scope, or unresolved attachments and missing/invalid stop times prevent a complete evaluation. Suspend states and retention exceptions require explicit policy. |

The official references describe [disk reads](https://docs.cloud.google.com/compute/docs/reference/rest/v1/disks/aggregatedList), [address reads](https://docs.cloud.google.com/compute/docs/reference/rest/v1/addresses/aggregatedList), and [instance reads](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/aggregatedList). These are permission candidates, not a complete installation policy. Validate regional/zonal/global coverage, pagination, partial-success warnings, and any additional calls before selecting roles. Read scopes do not replace IAM authorization.

### Other Candidates

| Candidate | Data, observation, and permissions | Decision and reason |
| --- | --- | --- |
| Snapshot retention review | Snapshot identity, creation time, storage information, and retention intent; Compute [`snapshots.list`](https://docs.cloud.google.com/compute/docs/reference/rest/v1/snapshots/list) / `compute.snapshots.list`. Age is observable; lack of recovery value is not. | Needs confirmation; recommend deferring until a retention policy and exceptions for backups, recovery, and compliance are defined. Age alone is insufficient. |
| Low-utilization VM / rightsizing | Compute inventory plus Monitoring time series ([`monitoring.timeSeries.list`](https://docs.cloud.google.com/monitoring/access-control)), metric definitions, aggregation, and a sufficient observation window. CPU alone does not establish workload or memory headroom. | Defer: additional data/permissions and workload-aware thresholds are needed. Missing samples, periodic workloads, and unavailable memory measurements cannot mean idle. |

### Amounts and Remaining Work

| Candidate | Additional basis for money | Required work before adoption |
| --- | --- | --- |
| Unattached disks | Verified type/location/capacity prices and a stated time basis, or correctly matched billing data. | Decide grace-period semantics and retention exclusions; validate complete attachment collection and unknown-state handling. |
| Unassigned IPv4 | Applicable regional/global price and allocation type, with a justified duration. | Confirm supported address scopes and state consistency. Current reservation plus creation age must not become an invented historical charge. |
| Disks on stopped VMs | Disk prices or billing evidence; VM stop time alone does not price retained storage. | Decide stop threshold and eligible states; resolve attachments by full resource identity, including project and zone. Avoid shared-disk double counting and partial totals. |
| Snapshot retention | Storage basis, location, pricing or billing attribution; age alone cannot determine savings. | Decide retention purpose/period first; validate recoverability constraints and cost basis before inclusion. |
| Low utilization / rightsizing | Valid target configuration, price difference, discounts, and utilization coverage. | Define metric windows, completeness, peak handling, and workload exclusions; validate target suitability before estimating a change. |

Local diagnostics separate collection/normalization in `apps/api`, pure evaluation and result types in `packages/core`, and credential acquisition in `packages/oidc`. Required tests cover positive matches, valid non-matches, missing fields, permissions/API errors, partial lists, and unknown pricing for each adopted rule. Additional cases include disk attachment changes, internal/IPv6 address exclusions, mixed running/stopped VM attachments, invalid stop times, retention exceptions, and gaps in metric history. Test source alone does not establish readiness; verify the actual LuckyCat implementation and runtime before provision.

## Local Diagnostic Scope

- Read disks and addresses for one explicitly selected project through Compute aggregated lists. Evaluate zonal/regional `pd-standard`, `pd-balanced`, `pd-ssd`, and `pd-extreme` disks and regional/global static external IPv4 addresses included in those lists. Do not discover additional scope through other APIs. Show returned scopes and collection gaps; this is not an organization-wide completeness guarantee.
- Candidates are `READY` disks without references and `EXTERNAL`, `IPV4`, `RESERVED` addresses without references. Replicating disks and unsupported disk types remain unevaluated. Grace periods and retention exceptions are not automatically applied yet.
- Request explicit fields. Normalize an omitted repeated `users` field in Google's list response as zero references, retaining the omission in evidence. Null/malformed references, missing state/type/identity, and contradictions remain unevaluated. An omitted `addressType` uses the documented `EXTERNAL` default. An omitted `ipVersion` becomes `IPV4` only when the actual address strictly validates as IPv4. Record both normalization decisions in evidence, excluding the actual IP from results. Other missing values and explicit nulls remain unevaluated. The generic core never converts missing data into empty arrays.
- Development limits are 100 items per page, 5 pages and 500 items per source, 2 MiB per response, 10 seconds per request, and 30 seconds for collection overall. No automatic retries. Limits, warnings, and failed pages preserve incomplete status. Conflicting observations of the same resource are not evaluated. These are not production limits.
- JSON includes rule ID/version, target, collection start/end times, returned scopes, candidates/evidence, and unevaluated reasons. Observation is current state only, continuous unused duration is unknown, and money is a prototype fixed-rate estimate as described below, or `unknown`. Partial collection cannot yield a complete no-match conclusion.
- Run diagnostics directly through the local API. Results can be explicitly saved to local D1; diagnostic Workflow execution remains separate. Resource identifiers appear in the local UI; do not paste results into public files. The existing Workflow remains a connection probe only.

## Prototype Price Estimates

Price estimation is currently a prototype for evaluating the screen and user experience. Keep fixed rates in `packages/core/src/prototype-pricing.ts`, use ordinary numeric arithmetic, and round monthly amounts to cents. Do not add a pricing API, price-expiry management, or billing-data connection at this stage.

- Multiply zonal disk capacity by `pd-standard: $0.04`, `pd-balanced: $0.10`, or `pd-ssd: $0.17` per GiB-month. Approximate regional disks at twice those rates. Unknown/invalid capacity and `pd-extreme` retain unknown amounts.
- Approximate both regional and global unassigned static external IPv4 at `$0.01 × 730 hours = $7.30/month`. Regional differences, discounts, free tiers, BYOIP, and other special conditions are not reflected.
- API and UI use result format v2. Each estimate includes a prototype marker, USD monthly amount, rate, quantity, and unit. Keep detection unchanged and preserve candidates with unknown amounts. Show the subtotal of priced candidates with priced and unknown counts.
- Label the screen “Price estimation is a prototype.” Amounts approximate the cost of continuing the current state and indicate potential savings only if deletion/release is possible without replacement costs. They are not actual bills, historical spend, or realized savings.

Rates are UI approximations informed by [disk pricing](https://cloud.google.com/compute/disks-image-pricing) and [IPv4 pricing](https://cloud.google.com/vpc/network-pricing#ipaddress). Before formal adoption, validate region/SKU matching, additional charges, BYOIP, and discounts; improve estimates using BigQuery Billing Export, pricing REST APIs, and other sources as appropriate.

## Result Contract and Acceptance

`DiagnosticResult` in `packages/core` is the shared API/UI result type. The UI separates candidate presence from evaluation completeness; partial evaluation, unevaluated scope, and authentication failure must not appear as no matches. UI tests use mocked responses without live cloud access.

Keep authentication, source retrieval, rule evaluation, findings, and money as separate states. Every run records the requested scope, actual coverage, retrieval times, observation periods, rule conditions/version, and unevaluated reasons.

| Scenario | Required result |
| --- | --- |
| Credentials work but a required source is denied, disabled, or fails | Authentication can succeed while that source and dependent rules remain unevaluated. Never convert the failure to no issues, zero findings, or zero spend. |
| One source or page fails, or collection reaches a limit | Preserve valid findings from independently complete evidence. Mark dependent rules/resources unevaluated and show incomplete coverage; do not infer absence from a partial list. |
| Complete inventory is empty, or an evaluable rule does not match | Report no eligible resources or no match only within the verified scope; do not imply a healthy whole environment. |
| Detection succeeds but pricing/billing is unavailable | Show the finding and evidence with amount unknown. Missing values are not zero; partial amounts are not full totals. |
| A finding has a financial estimate | Distinguish resource cost, possible savings from a stated change, and realized savings. Include currency, period, assumptions, and shared-resource handling. |
| Inventory suggests unused or low use | Present a review candidate, not proof of safe deletion. No automatic deletion or resource change in v0.1. |

Billing data or BigQuery must be required only for rules or amount calculations that actually need them. A monetary-data failure must not suppress an otherwise valid metadata-based finding. Admission also depends on the [connection and data-management gates](./google-cloud#release-gates).
