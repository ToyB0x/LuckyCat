# Availability and Getting Started

::: info Product workflows are not available yet
LuckyCat's product direction is decided; customer-facing FinOps workflows are not implemented. There is no supported signup, cloud connection, detection, notification, referral, or production self-hosting procedure yet.
:::

## What Exists Today

The English and Japanese guides describe the product direction. The repository also contains Hello World web and API starters and initialization factories for authentication and database access. These are development foundations, not a working FinOps service or a trial release.

Start with [product direction](./product) and [fit comparison](./comparison) to understand who LuckyCat is for. No cloud credentials or customer data are needed to read these guides.

## Development Plans

**v0.1 planned · Not available:** the next scope is Google Cloud connection setup and a first diagnosis: configure the connection → check access → retrieve data within the selected scope → evaluate rules → inspect improvement candidates and evidence.

See the [connection plan](./google-cloud) for preparation, access, and disconnection, and [diagnosis and rule candidates](./diagnostics) for results and limits. Google Cloud and this experience are decided; authentication, individual rule adoption, thresholds, and exact permissions remain undecided. There are no executable product setup steps yet.

Automatic changes, AWS/Azure support, reseller referrals, tree planting, thanks, badges, profiles, advanced allocation/internal billing, implementation of every mock screen or rule, scheduled runs, and Slack notifications are outside this v0.1 scope. The three value pillars remain the longer-term direction.

### Features Under Consideration

Organizing and sharing costs without changing resources remains a product direction. The following candidates have lower priority than the first diagnosis and are not v0.1 prerequisites; implementation scope, free allowances, and target versions remain undecided.

| Candidate              | Goal and intended experience                                                                                   | Constraints and availability                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Virtual tags or labels | Define classification rules for imported cost data and inspect team or product totals and uncategorized costs. | Keep classifications within LuckyCat; do not write back to resource tags or Terraform. Detail depends on available data. Not available; target version undecided. |
| Simple showback        | Share classified costs and their rationale with stakeholders within a limited viewing scope.                   | Internal billing and accounting are out of scope. Shared-cost allocation methods are undecided. Not available; target version undecided.                          |

### How to Read Release Status

The planned label applies to the Google Cloud flow above. Trial and available labels below illustrate later states and do not announce availability:

| Example                      | Meaning                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| v0.1 planned · Not available | Assigned to that release, but cannot be used yet.            |
| v0.1 · Trial                 | Verified as available for trial use, with documented limits. |
| v0.1 · Available             | Verified as available within the documented scope.           |

A version alone never means a feature is available. Dates, prices, free allowances, installation methods, and the product license remain undecided.
