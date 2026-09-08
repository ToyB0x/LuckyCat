---
name: guide-bilingual-sync
description: Add or maintain English and Japanese versions of the LuckyCat guide sites. Use when enabling bilingual guides, translating pages, or synchronizing guide changes in either direction, including Japanese additions into English.
---

# Bilingual Guide Sync

Maintain equivalent English and Japanese guides in both `apps/guide` and `apps/guide-internal`. Either language can be the source of a change; neither is permanently authoritative. Keep this practice small and evolve it with the guides.

## Initial Setup

- Preserve an existing locale structure. For the current English-only sites, keep English at `/` and add Japanese at `/ja/`, pairing `page.md` with `ja/page.md` within each site.
- Configure VitePress `locales.root` and `locales.ja` with language names, `lang`, translated navigation, and page metadata. Keep the landing-page design shared across languages.
- Translate the existing pages and visible interface text. Keep links within the reader's language and make the language switch lead to the corresponding page.
- Use the [VitePress internationalization documentation](https://vitepress.dev/guide/i18n) matching the installed version when implementing setup.

## Sync Cycle

1. Identify changed pages and their counterparts using the request and available Git diff. Compare against a known shared baseline when possible; do not infer authority from language or file modification time.
2. Translate additions and edits from whichever language changed into the other. Preserve intent, factual details, uncertainty, and scope while using natural phrasing. Keep code, commands, identifiers, and URLs intact except for necessary locale link changes.
3. If both languages changed, retain compatible contributions from each. When meanings conflict or the intended source cannot be established, ask about that passage and continue unrelated sync work. Do not silently overwrite either version.
4. Mirror intentional page or section removals and renames, updating counterpart links and navigation. A missing counterpart alone is not evidence that the existing page should be deleted; create the translation for a newly added page.

For example, adding a section to `ja/getting-started.md` updates `getting-started.md`; editing the English comparison updates `ja/comparison.md`. Limit translations to the affected content instead of rewriting unrelated pages.

## Review

Check meaning and page coverage in both languages, including headings, metadata, navigation, locale links, and translated heading anchors. Build affected sites and check language switching and mobile layout when changed. Summarize synchronized pages and unresolved passages.
