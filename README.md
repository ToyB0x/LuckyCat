# LuckyCat

LuckyCat is a streamlined, minimalist FinOps tool. It is designed primarily for engineering organizations of up to 100–300 members.

## Product Philosophy

LuckyCat takes inspiration from the Japanese appliance maker TWINBIRD, whose [cooling technology is used aboard the International Space Station](https://www.twinbird.jp/wordpress/wp-content/uploads/2021/11/ir_other_news_2021_8.pdf) and whose [appliance philosophy emphasizes essential functions, lasting quality, and design](https://www.twinbird.jp/brand/). We admire how technical depth can become everyday usability.

LuckyCat aims to apply that lesson to simple, affordable, easy-to-use FinOps, with **refined design and usability that bring tangible benefits to day-to-day work**. Read the [product philosophy](apps/guide/product.md#product-philosophy) for how this shapes the product.

## Purpose and Vision

This independent project is a place to build and share a practical tool and a place for the author’s hands-on practice and growth. By taking software craftsmanship seriously and developing technical and design skills, the author aims to turn learning into quality and usability for users. See the [internal concept](apps/guide-internal/concept.md#project-purpose-and-vision) for this development purpose.

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

The guides are the shared home for product direction and development plans. See the [product direction](apps/guide/product.md), [availability](apps/guide/getting-started.md), and [internal design rationale](apps/guide-internal/product-strategy.md). The direction and core stack are selected. Google Cloud connection setup and a first diagnosis are planned for v0.1 and are not available; authentication and individual rule adoption remain undecided.

## Guide Deployment

On pushes to `main`, a separate GitHub Actions workflow deploys both guide sites to Cloudflare Workers Static Assets in parallel with CI. Each guide deploys after its own typecheck and build pass, without waiting for the repository-wide CI result. PRs only validate the deployment configuration. Configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the GitHub `production` environment before the first deployment. Both guides, including the internal guide, are published on workers.dev.

See [the internal guide](apps/guide-internal/index.md#guide-deployment) for setup and Worker names.
