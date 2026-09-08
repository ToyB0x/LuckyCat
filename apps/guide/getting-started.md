# Availability and Getting Started

::: info Product workflows are not available yet
LuckyCat's product direction is decided; customer-facing FinOps workflows are not implemented. There is no supported signup, cloud connection, detection, notification, referral, or production self-hosting procedure yet.
:::

## What Exists Today

The English and Japanese guides describe the product direction. The repository also contains Hello World web and API starters and initialization factories for authentication and database access. These are development foundations, not a working FinOps service or a trial release.

Start with [product direction](./product) and [fit comparison](./comparison) to understand who LuckyCat is for. No cloud credentials or customer data are needed to read these guides.

## Development Plans

No customer feature has an approved target version yet. In particular, the first supported cloud and detection rule are undecided. The three value pillars describe the longer-term direction; they are not an approved v0.1 scope.

When a feature is approved, this page will describe its user goal, planned actions, expected result, and constraints, together with both a target version and availability. Until then, there are no product setup steps to follow.

### Features Under Consideration

Organizing and sharing costs without changing resources is a product direction. The following capabilities are candidates for that experience; implementation scope, free allowances, and target versions remain undecided.

| Candidate | Goal and intended experience | Constraints and availability |
| --- | --- | --- |
| Virtual tags or labels | Define classification rules for imported cost data and inspect team or product totals and uncategorized costs. | Keep classifications within LuckyCat; do not write back to resource tags or Terraform. Detail depends on available data. Not available; target version undecided. |
| Simple showback | Share classified costs and their rationale with stakeholders within a limited viewing scope. | Internal billing and accounting are out of scope. Shared-cost allocation methods are undecided. Not available; target version undecided. |

### How to Read Release Status

These are notation examples, not announced releases:

| Example | Meaning |
| --- | --- |
| v0.1 planned · Not available | Assigned to that release, but cannot be used yet. |
| v0.1 · Trial | Verified as available for trial use, with documented limits. |
| v0.1 · Available | Verified as available within the documented scope. |

A version alone never means a feature is available. Dates, prices, free allowances, installation methods, and the product license remain undecided.
