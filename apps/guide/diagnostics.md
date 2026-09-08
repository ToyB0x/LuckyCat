# First Diagnosis and Rule Candidates

::: info v0.1 planned · Not available
The planned first diagnosis collects data from explicitly selected Google Cloud projects and shows improvement candidates with evidence. Individual rules and thresholds are not yet approved for release. A customer diagnosis service is not available yet.
:::

Start with the [Google Cloud connection plan](./google-cloud). Once provided, the intended flow is to confirm the connection and scope, explicitly start a diagnosis, then review the result for that run.

The next development scope prioritizes unattached disks and unassigned static external IPv4. Start with candidates and evidence from current state, leaving amounts unknown. Disks on stopped VMs follow a decision on stop duration and exclusions.

## Initial Candidates

Prioritize rules that share Compute Engine metadata and keep setup small. These are adoption recommendations, not a promise to provide every candidate.

| Candidate | What it helps you review | Evidence and limits |
| --- | --- | --- |
| Unattached persistent disks | Whether disks with no current attachment still need to be retained. | Attachment and resource state at collection time. Creation age does not establish how long a disk has been unattached; recovery and migration needs still matter. |
| Unassigned static external IPv4 addresses | Whether reserved addresses without current resource references are still needed. | Address type, reservation state, and references. Exclude internal addresses and IPv6 from this candidate; planned reuse and recovery requirements need review. |
| Disks retained on stopped VMs | Whether storage attached to VMs that have remained stopped warrants review. | Disk-to-VM relationships, VM state, and stop time. Running or unobserved attachments prevent a conclusion that every attachment is stopped. Retained data may be necessary. |

The first two candidates use current inventory. A claim about a continuous unused period requires history; creation time is not a substitute. The stopped-VM candidate needs reliable stop timestamps and an agreed duration. Exact grace periods, exclusions, and supported resource types must be finalized before release.

Snapshot retention review remains a separate candidate requiring an agreed retention purpose and period. Low-utilization or rightsizing rules are lower priority because they need additional monitoring data and observation windows. None of these candidates guarantees that a resource can safely be deleted.

## Reading Results

The planned results screen presents candidates with resource names, locations, observation times, and evidence. Collection gaps and unevaluated reasons remain visible so readers can understand candidates and limitations without reading JSON.

| State | Meaning |
| --- | --- |
| Authenticated | The connection obtained credentials; data access is checked separately. |
| Data retrieved | The stated source and scope were read at the recorded time; other sources may have failed. |
| Evaluated | The rule had sufficient data for the stated scope and observation period. |
| Candidate found / no match in evaluated scope | The rule matched, or it did not match within the evaluated scope. This is not an assurance that the whole environment has no issues. |
| Not evaluated | Data is missing, access is insufficient, an API is disabled, retrieval failed, or another prerequisite is unmet. The reason remains visible. |
| Amount calculated / amount unknown | A separate result from detection. Valid findings and their evidence remain visible even when amounts are unknown. |

Each run should show selected projects and resources, retrieval times, observation periods, rule conditions, and unevaluated scope. Partial failures must distinguish evaluated and unevaluated rules. Missing data must never become “no issues,” “0 findings,” or “zero spend.” A completed, empty inventory can indicate no eligible resources only within its verified scope.

## Evidence Before Amounts

Billing exports and BigQuery are not prerequisites for the three initial metadata-based candidates. Calculating money may additionally require current prices, resource configuration, a clear time basis, or correctly matched billing data. Unknown amounts stay unknown; partial amounts are not presented as totals.

An estimated resource cost, an amount that might be saved by a particular change, and a saving already realized are different. Show assumptions, currency, and period; avoid double-counting shared resources. A candidate is a prompt to review ownership, intended use, and recovery needs, not an instruction to delete it.

Automatic deletion or modification, scheduled runs, and Slack notifications are outside the first diagnosis scope. [Virtual classification and simple showback](./getting-started#features-under-consideration) remain separate candidates with unassigned target versions.
