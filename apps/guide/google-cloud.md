# Google Cloud Connection

::: info v0.1 planned · Not available
Google Cloud is the first supported-cloud target. This page describes the planned setup and first diagnosis; there are no working connection controls or setup commands yet. Authentication and exact permissions remain under review.
:::

## Who Prepares What

A customer administrator authorized to configure Google Cloud access will prepare the connection, working with the engineer responsible for the selected projects. A user authorized within the LuckyCat organization will register the connection and start a diagnosis. Connecting and viewing results will each require appropriate access.

Choose the project IDs and resource scope to inspect explicitly. Organization-wide discovery, other projects, and billing accounts will not be included automatically. The initial rule candidates use Compute Engine resource metadata; disk contents and application data are not needed.

## Authentication and Access

The preferred proposal is **Workload Identity Federation with short-lived credentials**, potentially using a dedicated customer-owned service account for read access. It avoids handing LuckyCat a long-lived Google Cloud service account key. The final method, trust configuration, and required roles are not yet selected. Google describes [federation for customer-facing services](https://docs.cloud.google.com/iam/docs/use-workload-identity-federation-to-let-customers-access-their-cloud-resources).

Under this proposal, the administrator would approve a trust relationship and grant the connection only the access required to list the selected resources. Google Cloud setup may require IAM changes and enabling relevant APIs. Setup permissions belong to the administrator; they are distinct from the limited permissions used during diagnosis. Signing into LuckyCat will not by itself grant access to Google Cloud. Local CLI login credentials are not a customer connection method.

Before release, this guide will provide the selected authentication procedure, API list, exact permission requirements, and removal procedure. Do not create or upload a key based on this planned guide.

## Planned Setup and First Run

| Step                  | Customer preparation or LuckyCat action                                                                                | Expected result                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1. Choose scope       | Agree on projects, resource types, who may run a diagnosis, and who may see results.                                   | A visible, explicit scope.                                                                                              |
| 2. Prepare access     | The administrator configures the approved authentication method, APIs, and least-privilege access.                     | Access sufficient for the selected rules, without resource-modification permissions.                                    |
| 3. Register and check | Register the connection in LuckyCat and request an authentication and required-read check.                             | Separate status for authentication and each checked data source, with the check time and actionable errors.             |
| 4. Start diagnosis    | Review scope, selected rules, data collection, and cost/quota implications, then explicitly start the first diagnosis. | Data is retrieved for the approved scope and eligible rules are evaluated. Connecting alone does not start a diagnosis. |
| 5. Review findings    | Open the run result and inspect candidates, evidence, and coverage.                                                    | Evaluated rules, unevaluated rules, and unknown amounts are distinguishable.                                            |

A successful connection check only establishes that the checked operations worked at that time. It does not prove complete collection, sufficient observation history, absence of issues, or that an amount can be calculated. Permission changes and later retrieval failures can still prevent evaluation. See [diagnosis and rule candidates](./diagnostics).

## Resource Changes, Charges, and Quotas

Diagnosis will not modify or delete cloud resources. This differs from administrator-approved IAM/API setup and from executing read queries. Read access does not mean zero cost or zero side effects.

Compute Engine reads consume [API quotas](https://docs.cloud.google.com/compute/api-quota). Requests, retries, and any optional data services must be accounted for before running a diagnosis. If billing exports and BigQuery queries are added for a particular rule or amount calculation, customer-side [storage and query charges](https://cloud.google.com/bigquery/pricing) may apply. They are not required for all diagnoses. LuckyCat's free-pricing direction does not cover or waive Google Cloud charges.

Collection limits, retry limits, and cost controls must be defined and shown before the service accepts real data; their numerical values remain undecided.

## Disconnecting and Revoking Access

The planned disconnect action will stop new retrieval and token renewal in LuckyCat. The customer administrator will also be able to revoke the dedicated trust or access grants in Google Cloud. Disconnecting in LuckyCat, revoking cloud permissions, and deleting stored results are separate actions; a UI status change is not proof that an already-issued token is invalid everywhere immediately.

Before accepting real data, LuckyCat will publish how active runs, token expiry, stored results, retention, and deletion requests are handled after disconnection. These details remain undecided. Removal instructions must identify only LuckyCat-specific grants so shared access is not removed accidentally.
