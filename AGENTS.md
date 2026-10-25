# Agent Instructions

## Commands

Use lightweight checks that match the changed code before a commit.

- `bun run check` for lint and format.
- `bun run typecheck` for types.
- `bun run test -- <test-file>` for narrowly scoped existing unit tests.

## Test scope and compute

- Do not run Playwright, E2E tests, browser automation, production builds, or full test suites unless the user explicitly requests the relevant operation.
  A request to implement, fix, review, verify, or commit a change does not authorize these operations.
- Do not create or extend E2E testing infrastructure or Playwright tests unless the user explicitly requests it.
- Use narrowly scoped existing unit tests and lightweight checks by default.
  Do not install dependencies or start services only for verification unless the user explicitly requests it.
- When the user requests Playwright tests, use `bun run test:e2e -- --workers=1` with a test file or filter where possible.
  This command can also build the app and start a preview server through `playwright.config.ts`.
- Do not start a build or browser-test run while another thread is running either operation in this checkout.
  If shared activity cannot be established, report the limit and ask the user to coordinate the run.
- Report skipped verification and the behavior that remains unverified.
  Do not claim that a skipped check passed.
- These restrictions override broader instructions that require E2E reproduction or automatic builds for routine code changes.

## Conventions

- Commit every checkpoint with a Conventional Commit message.
- Write repository documents in ASD-STE100 Simplified Technical English.
- Put each full sentence on its own physical line in Markdown.
  Oxfmt keeps this layout through `proseWrap: "preserve"`, so never set it back to `never`.
- Never use the em dash character.
  Use a plain dash.
- Ship only instruments whose licence is public domain, Creative Commons, or free with attribution.
  The licence gate is in `docs/PLAN.md` section 4.

## Design

- The site ships light mode only.
  Do not add a dark palette, a theme toggle, or a `prefers-color-scheme` block.
  `app/lib/light-mode.test.ts` fails when one reappears.
- Read `docs/DESIGN.md` before a visual change.
  It holds the reference set and the visual rules.
- Every test must have an avatar.
  This rule is not negotiable.
  Avatars are original Tilik art.
  Never copy a shape, a colour value, a face, or an accessory from a reference image or from another brand.
  A new instrument is not complete until its import script and its data file declare an avatar with a shape and colour pair that no other instrument uses.
  The rules are in `docs/DESIGN.md` section "Test avatars".

## shadcn/ui

- The component base is Base UI.
  Use the `render` prop, not `asChild`.
- Components live in `app/components/ui`, and they keep their upstream style.
  The lint rules that conflict with that style are off for the directory in `oxlint.config.ts`.
- Update a component with `bunx --bun shadcn@latest add <name> --dry-run` and `--diff` before you apply a change.
- Run `bunx --bun shadcn@latest info` for the current aliases and the installed component list.
