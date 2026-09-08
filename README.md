# LuckyCat

LuckyCat is a streamlined, minimalist FinOps tool. It is designed primarily for engineering organizations of up to 100–300 members.

## Product Philosophy

This project aspires to the exceptional product development ethos of the Japanese appliance manufacturer, TWINBIRD. I deeply resonate with their approach: despite possessing the advanced technical capabilities to build cooling systems for space stations, they consistently deliver "simple, affordable, and user-friendly" products, offering a stark alternative to today’s overly complex, feature-bloated, and expensive appliance market.

Similarly, this tool is backed by solid technology but goes beyond simply being "free or cheap." It delivers **refined design and usability that provide tangible, practical benefits to your daily operations**.

## Purpose and Vision

This repository is not just a platform to share a tool; it is a space for my own hands-on practice and growth. I view this solo project as a vital opportunity to earnestly dedicate myself to the craft of building software, hone my technical skills, and continue evolving as an engineer.

## Guide Development

Use Node.js 22 or later and pnpm 11.18.0.

```sh
pnpm install
pnpm dev
```

- Customer guide: http://127.0.0.1:5173 (`apps/guide`)
- Internal guide: http://127.0.0.1:5174 (`apps/guide-internal`)

Both sites support English at `/` and Japanese at `/ja/`. Use the language menu to switch between corresponding pages. Keep paired Markdown pages synchronized when editing either language.

Run one site with `pnpm guide:dev` or `pnpm guide-internal:dev`. Build both with `pnpm build`.

The guides start small and grow alongside the product. Product workflows and infrastructure choices remain to be defined.
