# Tilik

Free online psychological tests that use open, public-domain question sets.

The site is client-rendered React and scores answers in the browser.
There are no accounts and no server-side storage of answers.
The site runs on the Cloudflare free plan as Worker static assets.

Status: Phase 6 is complete.
See [docs/PLAN.md](docs/PLAN.md) for the full plan.

## Deployment

The site deploys as Worker static assets, and `wrangler.jsonc` binds `tilik.farissaifuddin.com`.

Static HTML is published for the content routes: the methodology, licences, and privacy pages, plus each instrument and its item list.
The home page, the runner, and the result stay client-rendered, so `index.html` remains a content-free shell that Cloudflare can serve for any other path.

`wrangler.redirect.jsonc` deploys a small second Worker that sends every request for the old `test.farissaifuddin.com` host to the current address.
It keeps links shared before the rename working, and it preserves the path, the query, and the fragment.
Run `bun run deploy:redirect` after a change to that Worker.
Delete the Worker, its config, and its custom domain when the old links no longer matter.

Cloudflare Web Analytics is switched on from the Cloudflare dashboard, which needs no code change.

## Stack

- React 19 with React Router 8 in framework mode, `ssr: false`.
- Vite and Tailwind CSS v4.
- shadcn/ui with the Base UI base and the `base-nova` style.
- Ultracite with Oxlint, Oxfmt, and `@shadcn/lint`.
- Vitest and React Testing Library.
- Cloudflare Workers static assets.

## Commands

| Command                                 | Purpose                                      |
| --------------------------------------- | -------------------------------------------- |
| `bun install`                           | Install dependencies.                        |
| `bun run dev`                           | Start the dev server.                        |
| `bun run build`                         | Build the client bundle into `build/client`. |
| `bun run test`                          | Run the tests once.                          |
| `bun run test:e2e -- --workers=1`       | Build once and run browser tests.            |
| `bun run test:e2e:built -- --workers=1` | Run browser tests without a build.           |
| `bun run typecheck`                     | Run React Router typegen and TypeScript.     |
| `bun run check`                         | Run the lint and format check.               |
| `bun run fix`                           | Apply lint and format fixes.                 |
| `bun run deploy`                        | Build and deploy to the Worker.              |
| `bun run deploy:redirect`               | Deploy the old-host redirect Worker.         |

Use `test:e2e:built` only after a successful build of the current code.
Playwright starts a preview server for that build without rebuilding it.

## Sources

The question sets come from the International Personality Item Pool (IPIP), which is in the public domain.
See section 4 of the plan for the licence review of every instrument.
