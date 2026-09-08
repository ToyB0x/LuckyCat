# LuckyCat

LuckyCat is a streamlined, minimalist FinOps tool. It is designed primarily for engineering organizations of up to 100–300 members.

## Product Philosophy

This project aspires to the exceptional product development ethos of the Japanese appliance manufacturer, TWINBIRD. I deeply resonate with their approach: despite possessing the advanced technical capabilities to build cooling systems for space stations, they consistently deliver "simple, affordable, and user-friendly" products, offering a stark alternative to today’s overly complex, feature-bloated, and expensive appliance market.

Similarly, this tool is backed by solid technology but goes beyond simply being "free or cheap." It delivers **refined design and usability that provide tangible, practical benefits to your daily operations**.

## Purpose and Vision

This repository is not just a platform to share a tool; it is a space for my own hands-on practice and growth. I view this solo project as a vital opportunity to earnestly dedicate myself to the craft of building software, hone my technical skills, and continue evolving as an engineer.

## Local Development

Use Node.js 22 or later and pnpm 11.18.0.

```sh
pnpm install
pnpm dev
```

- Customer guide: http://127.0.0.1:5173 (`apps/guide`)
- Internal guide: http://127.0.0.1:5174 (`apps/guide-internal`)

Both sites support English at `/` and Japanese at `/ja/`. Use the language menu to switch between corresponding pages. Keep paired Markdown pages synchronized when editing either language.

`pnpm dev` starts both guides, the web app (port 3000), and the API (port 8787) together through Vite+.

Run `pnpm typecheck` and `pnpm build` for all workspace packages through the locally installed Vite+ task runner. VitePress remains the guide-site builder. GitHub Actions runs these checks on PRs and pushes to `main`; Worker builds are dry-runs and do not deploy.

The web and API apps are Hello World starters. Auth and DB packages expose initialization factories only; no sign-in, D1 database, or product workflow is configured. See the internal guide for the package boundaries.

The guides start small and grow alongside the product. Product workflows and infrastructure choices remain to be defined.

## Guide Deployment

On pushes to `main`, a separate GitHub Actions workflow deploys both guide sites to Cloudflare Workers Static Assets in parallel with CI. Each guide deploys after its own typecheck and build pass, without waiting for the repository-wide CI result. PRs only validate the deployment configuration. Configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the GitHub `production` environment before the first deployment. Both guides, including the internal guide, are published on workers.dev.

See [the internal guide](apps/guide-internal/index.md#guide-deployment) for setup and Worker names.
