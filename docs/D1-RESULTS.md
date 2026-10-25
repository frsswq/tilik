# Completed Results in D1

Status: implemented in this branch, not deployed.
Related: `docs/PLAN.md` sections 5, 9, and 10.

## Outcome

A completed local test renders at once and automatically saves derived scores through a same-origin Worker API.
The registry holds every shipped instrument, including PHQ-9, GAD-7, and the IPIP sixteen-factor scales.
The result database holds no name, email address, account, IP address, cookie, user agent, location, or raw answers.
Scores can still be sensitive personal information.
This design reduces collected data, but does not guarantee anonymity.
The instrument page discloses the automatic save before the test starts.

Existing local history, answer links, scores-only links, JSON downloads, and imports still work.
A network failure does not hide the local report.
A failed save can be retried from the result page or on its next visit.
A shared link never creates another stored completion.

## Data flow

```text
complete test
  render local report
  persist random operation code in browser
  POST /api/results with revision and derived scores
    validate body and instrument bounds
    insert immutable row in D1
    return the original expiry, including on retries
  offer stored link and delete action

open /tests/<slug>/result#s=<random-code>
  GET /api/results/<random-code>
  verify instrument and revision
  rebuild the scores-only report
```

The code has 128 random bits and stays in the page URL fragment.
The subsequent retrieval API request sends that code to the server.
API paths can appear in infrastructure logs.
The application does not log result bodies or codes.
Anyone with the stored link can read or delete that copy.
There is no public listing endpoint.

## Schema and lifecycle

`migrations/0001_results.sql` creates a strict SQLite table without a rowid.
The columns are `id`, `instrument_id`, `content_hash`, `scale_kind`, `scores`, `created_day`, and `expires_at`.
The `scores` field holds facet sums for an instrument with facets, or domain sums otherwise.
The timestamps use UTC day precision, including the expiry, to avoid storing the completion time indirectly.

Rows expire at midnight UTC no later than 90 days after creation.
Reads reject expired rows immediately.
The daily cron at 04:23 UTC deletes at most five batches of 1,000 expired rows.
A backlog can delay physical deletion, but never extends link access.
The delete action removes the active row immediately.
Cloudflare Time Travel recovery copies have a separate retention period, currently seven days on the free plan.

The browser records successful deletion and does not automatically upload that answer set again.
Clearing browser data removes this local suppression and does not delete a server row.
There is no identity-based recovery or cross-device unfinished-test sync.
Identical answer sets in one browser reuse their operation record rather than counting another completion.
These rows are therefore saved-result counts, not verified people or verified attempts.

## API contract

| Method and path           | Behavior                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `POST /api/results`       | Accepts `contentHash`, `id`, `instrumentId`, `scaleKind`, and `scores` only. Returns `{ id, expiresAt }`. |
| `GET /api/results/:id`    | Returns the revision, instrument, kind, sums, and expiry. Missing and expired codes return 404.           |
| `DELETE /api/results/:id` | Returns 204 even if already deleted. The code authorizes deletion.                                        |
| `GET /api/health`         | Checks database reachability without exposing row data.                                                   |

The POST parser reads at most 4 KB before rejecting an oversized body.
Strict schemas reject unknown fields, including answers and profile information.
The Worker validates all score keys, integers, and instrument-specific bounds.
Old client revisions return 409 rather than writing a row with a new interpretation.
A code cannot overwrite a different row.
Retries return the persisted expiry and do not extend retention.
Database failures return a generic 503 response.
API responses use `Cache-Control: no-store`.
Cross-origin writes and deletes are rejected.
Origin checks are not bot authentication.
Self-reported scores cannot be verified without receiving the answers, which this design forbids.

## Files and runtime

- `worker/index.ts` owns Worker fetch and scheduled entry points.
- `worker/api.ts` owns API validation, retention, and routing.
- `worker/store.ts` owns prepared SQL statements and D1 mapping.
- `worker/scoring-key.json` is generated with `bun run build:scoring-key`.
- `scripts/build-scoring-key.ts` produces SHA-256 revisions from item text, polarity, membership, scale bounds, domain and facet definitions, clinical bands, and reporting guidance.
- A focused freshness test fails when committed instrument data and the key diverge.
- `app/lib/remote-result.ts` owns browser transport and persistent operation records.
- `app/lib/use-stored-result.ts` synchronizes completed results with the external store.
- The result page owns stored-link loading, failure notices, sharing, and deletion.

The static SPA and prerendered content routes remain unchanged.
Only `/api/*` uses Worker-first routing.
The API is not a React Router server action and does not require SSR.
The React Router development server alone does not expose the D1 API.

## Database and rollout

A database named `personality-test-results` was created in the Cloudflare account during implementation.
Its binding is `DB` and its identifier is recorded in `wrangler.jsonc`.
Creating the database does not deploy this branch or publish result collection.
The production migration and Worker deployment must be coordinated as one release with the privacy text.

```sh
bun run build:scoring-key
bun run db:migrate:local
# After an authorized production build, serve the static output and API together:
bunx wrangler dev

# Release operations, only when authorized:
bun run deploy
```

`bun run deploy` builds, applies the remote migration, then deploys the Worker and assets.
`bun run typecheck` regenerates the ignored Cloudflare runtime types before checking TypeScript.
Keep preview and production D1 targets separate if preview environments are added.
Do not send real visitor results to a development database.

## Aggregates and quotas

`docs/sql/result-counts.sql` provides completion counts and score histograms over unexpired rows.
The queries are owner-only administrative operations, not public API endpoints.
Use `bunx wrangler d1 execute DB --remote --file docs/sql/result-counts.sql` when authorized.
A small SQLite integration test checks the query outputs against known saved rows.

The free plan currently includes 5 million rows read per day, 100,000 rows written per day, and 500 MB per database.
Index maintenance and deletions also consume writes.
The API uses indexed code lookups and expiry cleanup.
Do not treat 100,000 written rows as 100,000 results.
Monitor D1 row usage, database size, Worker invocations, and cron failures before widening traffic.
A bounded sweep does not reserve a hard daily write budget.
If anonymous write abuse appears, configure an edge rate limit or Turnstile before increasing access.
No application IP tracking or unverified rate-limit guarantee is added here.

## Verification scope

Focused tests cover the real migration and SQL through SQLite, strict request rejection, immutable retries, expiry, deletion, and a score round trip.
Share payload round trips cover every shipped instrument, and the stored-result API test uses GAD-7.
Component checks cover the immediate local result, retry, stored links, deletion suppression, and expired-link behavior.
The new round-trip test first failed for PHQ-9 and GAD-7 because the existing report reconstruction hard-coded a 1-to-5 scale.
The report builder now uses each instrument's scale bounds.
The result-page scores-only link also failed a focused clipboard test because nested facet sums were omitted.
The link builder now receives those sums, and the same test passes.

Production builds, full suites, browser automation, live API deployment, and live D1 row-write accounting need separate authorization.
SQLite checks are not a claim that the deployed Cloudflare runtime was exercised.
See the PR evidence for the exact checks run and their outcomes.

## Sources

- [Static assets and Worker routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).
- [D1 platform limits and recovery retention](https://developers.cloudflare.com/d1/platform/limits/).
