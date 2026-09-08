# Development Guidelines

The guide sites are the shared home for product direction, development plans, and usage knowledge. Following the [concept](./concept) and [business model](./business-model), this page covers design principles and acceptance conditions for implementation. Maintain it alongside the customer guide instead of creating a separate PRD with duplicate requirements.

## Design Principles

- **Low effort:** minimize setup, learning, routine upkeep, and the effort of returning after a long absence. Quiet monitoring should not require daily dashboard visits.
- **Useful decisions:** favor information worth checking over notification volume. Show reasons, evidence, estimated effects, and a clear next action.
- **Safe action:** automate preparation and organization where appropriate. Do not execute risky changes without authorization; estimates are not realized savings.
- **Low total cost:** use the selected Cloudflare-first architecture and keep scope small. Include maintenance, support, security, and trust-building in cost assessment, not just infrastructure bills.
- **Trust and choice:** make evidence inspectable and data sharing consensual. Keep the small black-cat identity unobtrusive and the wording encouraging and accurate.

Retain the [selected stack and package boundaries](./index#main-architecture): TanStack Start, oRPC, Better Auth in `packages/auth`, domain logic in `packages/core`, and Drizzle with D1 in `packages/db`; use pnpm Workspace and Vite+. Other providers and browser-side DuckDB WASM remain options when Cloudflare does not fit, not new selections.

## Development Scope and Acceptance

The repository currently contains guide sites and application/package scaffolds. There is no implemented customer FinOps workflow and no approved feature-to-version assignment. Do not treat the Hello World app, greeting endpoint, or auth/DB factories as a product release.

When a feature is approved, add its goal, planned user action, expected result, constraints, target version, and availability to the customer guide. Record the necessary design and acceptance conditions here in the same change. Connect the documented expected result to scenario tests during implementation. Only mark a feature as trial or available after verifying its actual behavior and documenting its limits.

The following are acceptance principles for future scope, not scheduled features:

| If the approved scope includes… | Verify that… |
| --- | --- |
| Onboarding or a cloud connection | Required access and setup are explained; success and failure are understandable. The installation method must first be selected. |
| An improvement finding | The user can inspect its reason, evidence, estimate assumptions, and next action; an estimate is distinct from a realized result. |
| Monitoring or notifications | The user can understand why something deserves attention and what to do next; frequency and relevance criteria are specified before release. |
| A change to cloud resources | The required authorization is enforced and risky changes cannot run without it. |
| A quote request or referral | The relationship, recipient, and shared data are clear; declining consent sends nothing. |

Use paired version and availability labels, such as `v0.1 planned · Not available` / `v0.1予定・未提供`. These are examples, not a release announcement. Keep both language versions consistent as scope and implementation change.

## Design Conditions for Virtual Classification and Simple Showback

Organizing and sharing costs without changing resources is a product direction. Refine virtual tags or labels and simple showback as candidate capabilities. They are not available; supported clouds, free scope, target versions, and allocation methods remain undecided. Turn these principles into acceptance conditions when adopting the capabilities:

- Layer LuckyCat-owned classifications over imported cost data without writing back to resource settings, tags, or Terraform. Allow virtual classification to support transitional organization and ongoing cost-management perspectives.
- Let users try rules and inspect classified totals, uncategorized amounts, and rationale. Do not present detail absent from source data as established fact; show allocation rules and rationale for shared costs.
- Keep simple showback focused on sharing team costs and rationale. Enforce viewing scope on the server and do not expose unauthorized teams' costs. Complex internal billing and accounting are out of scope.
- During implementation, verify total reconciliation before and after classification, uncategorized-cost handling, absence of resource writeback, and rejection of access outside the viewer's scope.

## Open Decisions and Validation

- **Release scope:** first customer outcome, supported cloud, detection rules, target version, and timing. “One cloud, one rule” is not an approved specification.
- **Delivery:** onboarding, permissions, data handling, notification methods, and evidence/estimate requirements. A GitHub App or team-specific settings are candidates, not selected approaches.
- **Distribution:** product license and production self-hosting support.

Resolve these as the relevant work is approved. Pricing, operating economics, and partnership validation belong in the [business model](./business-model#sustainability-and-validation).
