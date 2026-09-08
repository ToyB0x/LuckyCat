# Provisional Frontend Direction

::: warning Provisional baseline · Design is not finalized
Use **the plain, light earth-tone direction (Option 1)** as the working baseline. The visual style, brand expression, and detailed interaction concept are not fully settled. Expect frequent frontend changes; deeper design work is deferred. This is not a frozen design system or a claim of product readiness.
:::

## What This Handoff Provides

[Open the interactive HTML reference](./design/plain/index.html?lang=en). It works without Google Cloud, the API, a build, credentials, or external assets. The files are in `apps/guide-internal/public/design/plain/`; opening `index.html` directly also works. Switch between English and Japanese and between synthetic result states. All identifiers and amounts are fabricated.

This is a **design reference, not the application frontend**. It adapts the light direction to the initial Google Cloud diagnosis; it is not a pixel-identical archive of the earlier full-suite concept. Do not maintain a second business-logic implementation in this reference. Once an application preview represents this experience, retire the HTML reference or explicitly mark it historical.

The dark treasure-chest direction (Option 2) is deferred, not rejected permanently. Do not implement two themes now. Do not infer approved features from either earlier mock's menus.

## Stable Constraints and Changeable Choices

| Keep stable during visual iterations                                    | Provisional and replaceable                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Findings and their evidence, uncertainty, and collection coverage       | Colors, typography, spacing, layout, copy, mascot placement      |
| Distinguish estimates, unknown amounts, and realized savings            | Table, disclosure, drawer, or dedicated detail-page presentation |
| Explicit diagnosis; no automatic resource changes                       | Navigation structure and eventual light/dark theme support       |
| Current result contract and separation of UI / acquisition / evaluation | Component boundaries as the application grows                    |

The broader product purpose in [Concept](./concept) remains in place. This provisional decision concerns the frontend and how that purpose is expressed, not a reset of the product's safety requirements or target audience.

## Visual Baseline

- Pale background `#f7f9f6`, white working surfaces, quiet sidebar `#f2f5ef`, text `#293630`, forest-green primary `#285642`, borders `#e0e6dd`. The CSS reference groups these as replaceable semantic tokens.
- Use system fonts, 16px body text, 14px regular labels, and tabular numbers. Keep focus indicators and keyboard access visible; support narrow screens and enlarged text.
- Prefer a compact summary, rows, separators, and progressively disclosed evidence to repeated oversized cards, heavy shadows, gradients, and large illustrations.
- A small, resting cat is a secondary accent. It must not be necessary to interpret findings. Avoid decorative celebration for errors or incomplete collection. Green does not imply an environmental-impact promise.
- Show useful facts before decorative copy. Use “review candidates,” not “safe to delete” or “money already earned.”

## Reference Scope

The reference covers **run summary → candidate list → evidence**, with mock states for findings, many findings, no matches, partial collection, unknown pricing, authentication failure, transport failure, and loading. Details show identity, location, observed state, references, a rule/version, pricing basis, unknown unused duration, and human-review requirements. The sample displays a selected project; it does not implement onboarding or connection settings.

No live connection, storage, history, searching, filtering, scheduled diagnosis, Slack integration, charts, annual savings promises, or resource changes are introduced. The sample does not call the real result renderer yet; it is deliberately isolated reference HTML/CSS/JavaScript.

## Application Preview — v0.1 Planned, Not Available to Customers

1. Keep existing local diagnostic behavior working while iterating on the preview.
2. Provide a development-only preview inside `apps/web` using the existing stack. No new UI framework or mandatory component explorer is needed.
3. Reuse `DiagnosticResults` in `apps/web/src/diagnostics/results.tsx` for both real and synthetic results. Extract only the presentational pieces needed; remove dependence on a debug-panel CSS wrapper as necessary.
4. Keep `DiagnosticResult` in `packages/core/src/diagnostics.ts` as the result contract. Validate synthetic results with the same boundary checks as real responses. Loading and transport errors are request states, not fabricated successful results. Authentication failure is representable by the current result contract.
5. Keep acquisition, credentials, diagnosis, and pricing out of presentation components. Apply visual tokens in the web app's own styles; do not copy this standalone renderer or earlier mock framework dependencies into the application.
6. Use the same result display for saved snapshots. [Local storage and history](./local-debug#local-diagnostic-storage-and-history) use the API and D1, but are not prerequisites for the UI preview. Diagnostic Workflow execution remains a separate change.

Current pricing is fixed-rate **USD/month**, not verified billing or achieved savings. Unknown amounts remain visible and are excluded from the priced subtotal. An annual projection or currency conversion requires an explicit basis; do not import fictional yen values or “30 days unused” claims from previous mock data. See [Diagnostic design](./diagnostics) and [Local debugging](./local-debug).

## Using the Development Preview

Run `pnpm --filter @luckycat/web dev` from the repository root and open `/dev/diagnostics` on the web server. The root `pnpm dev` command also starts it alongside the other applications. No API server or Google Cloud credentials are required. Switch between eight states and English/Japanese, then expand candidate rows to inspect evidence. The preview shares `DiagnosticResults` with real diagnostics and labels synthetic data, provisional design, and prototype prices. Loading and transport failure are request states. Production builds do not expose the preview or include its synthetic data.

Keep the standalone HTML as the handoff reference. Business logic belongs in the application; retiring the HTML or formally designating it historical remains a separate decision.

## Acceptance Checklist

- The reference opens without cloud access; its controls only change synthetic presentation state.
- The provisional-design and mock notices remain visible in all states.
- Partial collection can coexist with findings; missing data never becomes “no matches.”
- A no-match state describes only evaluated scope, not the entire environment.
- Unknown amounts are not zero, and subtotals identify what was priced.
- Fifty candidates remain usable as rows; long identifiers wrap in evidence.
- In the application preview, real and synthetic results use the same renderer and retain current safety tests.

These guide assets are eligible for the existing **public** internal-guide deployment after a future approved merge. Keep them synthetic and self-contained. This handoff does not authorize a commit, push, deployment, or the inclusion of private discussion, credentials, customer results, or private reference URLs.
