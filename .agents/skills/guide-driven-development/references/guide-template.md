# Minimal Guide Template

Start small. Keep only the structure below; add pages and detail as the developer expands the guide.

## Setup

- Use VitePress for both sites and pnpm workspaces.
- Place the sites at `apps/guide` and `apps/guide-internal`.
- Add the package manifests and VitePress configuration needed to run and build both sites.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
```

## Customer Guide: `apps/guide`

- `index.md`: a simple but deliberately designed landing page with a value proposition and a link to the guide. Customize typography, spacing, and layout; do not use a guide-wide index or an unchanged VitePress starter.
- `getting-started.md`: `[TEMPLATE: prerequisites, first action, expected result]`.
- `comparison.md`: a matrix comparing predecessor or similar products. Start with a clearly labeled mock:

```markdown
# Product Comparison

MOCK TEMPLATE - not factual claims or agreed product scope.

| Capability             | This product | [MOCK: predecessor] | [MOCK: similar product] |
| ---------------------- | ------------ | ------------------- | ----------------------- |
| [TEMPLATE: capability] | UNDECIDED    | NOT RESEARCHED      | NOT RESEARCHED          |
```

## Internal Guide: `apps/guide-internal`

Start with these three sections in `index.md`; split them into pages only when needed.

```markdown
# Internal Guide

## Main Architecture

[UNDECIDED: main components, technologies, and responsibilities]

## Monorepo Foundation

- apps/guide: customer-facing VitePress site.
- apps/guide-internal: internal VitePress site.
- Package management: pnpm workspace.

## Infrastructure Selection Criteria

[UNDECIDED: requirements and criteria for choosing infrastructure]
Provider: [UNDECIDED]
```

## Placeholder Rule

Preserve explicit decisions and established repository facts. For everything else, use visible `[TEMPLATE: ...]`, `[MOCK: ...]`, or `[UNDECIDED: ...]` labels. Do not invent product claims, competitor facts, architecture choices, or infrastructure selections. This template does not establish those decisions.

Files in `guide-internal` are still public when committed to this public repository.
