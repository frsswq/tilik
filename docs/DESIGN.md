# Design Direction

Status: active.
Owner: Faris Saifuddin.

This document records the visual direction for Tilik.
It holds the reference set and the rules that follow from it.

## Light mode only

The site ships light mode only.

- There is no theme toggle, no stored theme, and no dark palette.
- The stylesheet carries no `.dark` block and no `prefers-color-scheme` block, so a visitor whose operating system prefers dark still sees the light theme.
- The `dark:` utilities inside `app/components/ui` stay as they are.
  They are inert without a `.dark` ancestor, and removing them would break the `shadcn add --diff` merge.
- Do not add a dark palette back without a full pass over every surface, border, and chart colour.

## Reference set

The reference set is a landing page and product-page group.
Read them for structure, typography, and restraint, not for copy.

| Reference              | Take from it                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `visitors.now`         | A plain, factual landing page. One sentence that says what the product does, then feature cards, then a comparison table. |
| `family.co`            | Consumer polish. A single product artefact on screen, large type, and motion that serves the story.                       |
| `elevenlabs.io`        | Editorial typography and generous whitespace around media.                                                                |
| `wordware.ai`          | Short sections with bold headlines and a clear order of ideas.                                                            |
| `heyclicky.com`        | Voice and personality in the copy, product shots inside window chrome, and a clean three-tier feature block.              |
| `apple.com/iphone-duo` | Product-page storytelling: one idea per section, large imagery, no clutter.                                               |
| `x.ai`                 | Near-monochrome restraint. Very little colour, and hierarchy from type and space alone.                                   |

Audited from the live page in this pass: `visitors.now`, `wordware.ai`, `heyclicky.com`, and `apple.com/iphone-duo`.
The other three are listed from the chosen set and still need a reading pass before a redesign.

## Visual rules

- One accent colour, from the semantic tokens. No raw Tailwind palette in application code. The test avatars are the only exception.
- Hierarchy from type size, weight, and space. Not from borders, shadows, or colour alone.
- Geist for text, from `@fontsource-variable/geist`. No second family without a reason.
- The radius scale comes from the shadcn preset. Change it in one place.
- Generous whitespace on the marketing pages, tighter spacing inside an instrument.
- Motion is small and purposeful. No scroll-driven effects, no parallax, no autoplay video.
- Every surface comes from a shadcn component. Custom markup is for layout only.
- A screenshot of a product state carries more weight than a paragraph about it.

## Selected landing page

The selected direction is the centered product-window collage in plum.
The headline is "Meet yourself. Again."
The header and footer use the Tilik mark, with matching browser and touch icons.
Two opposing profiles use positive and negative space to suggest recognition through another perspective.
The production geometry lives in `app/components/site-logo.tsx` and `public/favicon.svg`.
Use these files as the reference for the selected mark.
The accent is `#8A3F6D`, and every tint derives from it.
The background, accent, borders, and muted text use semantic tokens in `app/app.css`.

The desktop collage uses positioned, rotated windows only at widths of at least 1280 pixels.
Below that width, the report and question stay in document flow with no rotation.
Decorative privacy and reminder cards appear only when the full desktop composition fits.
The main copy keeps the privacy message visible at every width.

Design explorations and screenshots stay local in the Git-ignored `docs/design-studies/` directory.
They are not required to run or deploy the site.
Run `bun run test:e2e` to check the production landing page in a browser.

## What this means for the test pages

- The instrument page is the product page. Lead with the name, the size, and the time, then the evidence.
- The runner is a form. It stays plain: one statement per row, five or four clear options, a visible progress bar.
- The result page is a report. Scores first, then detail, then the caveats.
- The crisis block on a screening result is the loudest element on the page on purpose.

## How to check a visual change

1. `bun run check`, `bun run test`, and `bun run typecheck`.
2. Look at the page in a browser at desktop and mobile width, in light mode only.
3. Check for console errors, a horizontal scrollbar, and a stuck sticky element.
4. Compare the hierarchy against the reference set: one clear headline, one clear action.

## Test avatars

Every test has an avatar.
This rule has no exceptions.

- The reference set is in `reference/test-icon/`.
  The folder is local and Git ignores it.
- Take these properties from the reference set: a flat, simple body shape, two dark eyes in the upper part of the body, and one optional accessory such as glasses, a beret, or a bow tie.
- `app/components/instrument-avatar.tsx` draws each avatar on a 100 unit grid.
  To add a shape, an eye style, or an accessory, add it to that file and to `avatarSchema` in `app/lib/instruments/schema.ts`.
- Each instrument data file declares its avatar in the `avatar` field.
  The import script for the instrument writes that field, so put the avatar in the script, not only in the JSON file.
- The schema rejects an instrument without an avatar, so the test run and the build fail.
- The registry rejects two instruments with the same shape and colour.
- Show the avatar next to the instrument title on the home page, the instrument page, the runner, and the result page.
- The avatar colours are the `--avatar-*` tokens in `app/app.css`.
  They are the only colours outside the plum accent, and only avatars use them.
