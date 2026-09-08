# Initial Diagnostic Design

::: info v0.1 planned · Not available
Google Cloud setup → connection and permission checks → scoped collection → rule evaluation → candidates and evidence is the approved experience. The following rule choices are recommendations pending adoption, not implemented capabilities.
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

LuckyCat has no implemented collector, evaluator, or diagnostic tests yet. Required tests cover positive matches, valid non-matches, missing fields, permissions/API errors, partial lists, and unknown pricing for each adopted rule. Additional cases include disk attachment changes, internal/IPv6 address exclusions, mixed running/stopped VM attachments, invalid stop times, retention exceptions, and gaps in metric history. Test source alone does not establish readiness; verify the actual LuckyCat implementation and runtime before provision.

## Result Contract and Acceptance

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
