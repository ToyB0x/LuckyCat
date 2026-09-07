---
name: guide-driven-development
description: Use Guide-Driven Development (GDD) as an ongoing approach to product planning, implementation, and review. Keep customer guides, internal design knowledge, implementation, and tests aligned as the repository evolves.
---

# Guide-Driven Development

Treat guides as living product and design knowledge. Describe the intended experience before building it, then keep the guides useful as the product changes. This skill captures the repository's GDD approach and should evolve with practical experience.

## Principles

- The customer guide explains what users can accomplish and how.
- The internal guide explains why and how the product is built, including constraints and reasons for design choices.
- Keep Markdown as the source for both AI reference and the rendered guide sites.
- Let documented user outcomes guide implementation and tests.

## Development Cycle

1. Read the relevant customer and internal guides before changing a feature.
2. Describe the intended outcome and necessary design changes in the guides first.
3. Implement the behavior and verify it against the guide. Use guide outcome wording for relevant scenario tests.
4. Keep guides, implementation, and tests aligned in the same change. Feed reusable lessons back into the guides or this skill, keeping additions small.

For initial guide setup, use the [minimal guide template](references/guide-template.md). Expand it incrementally as the product needs become clearer.

## Review

Check that the changed behavior matches the guides. Run relevant tests and guide builds when affected, and summarize any remaining gaps.
