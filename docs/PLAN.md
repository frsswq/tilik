# Plan: Free Online Psychological Testing Site

Status: the static test flow is shipped, and the D1 scores-only layer is implemented in a pending branch.
Owner: Faris Saifuddin.

## 1. Goal

Build a free, public, self-administered psychological testing site on the `farissaifuddin.com` domain.

The site uses open, public-domain question sets.
The site scores answers in the browser.
The site uses shadcn/ui for all interface components.
The site runs on the Cloudflare free plan with no paid services.

## 2. Constraints

- No paid services.
- No user accounts in the first release.
- No server-side storage of personal answers.
- No clinical claims and no diagnosis.
- English first, Bahasa Melayu later.

## 3. Domain and Hosting

The existing `personal-web` project already claims `farissaifuddin.com` and `www.farissaifuddin.com` as custom domains on a Cloudflare Worker.

The test site must therefore use a separate route.
Recommended route: `test.farissaifuddin.com`.

Alternative route: `farissaifuddin.com/tests/*` on the same Worker.
This alternative conflicts with the existing single-page-application fallback, so the subdomain is simpler and safer.

Hosting model:

- Build a fully static site.
- Deploy the output directory with Wrangler as Cloudflare Worker static assets.
- Requests to static assets are free and unlimited.
- Worker script invocations are billed against the free limit of 100,000 requests per day.
- Static page requests do not invoke the Worker.
- The scores-only API and retention job consume Worker and D1 quotas.
- The D1 runtime configuration is in `wrangler.jsonc` and `docs/D1-RESULTS.md`.

Wrangler configuration sketch:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "personality-test",
  "compatibility_date": "2026-10-11",
  "assets": {
    "directory": "./build/client",
    "not_found_handling": "single-page-application",
  },
  "routes": [{ "pattern": "test.farissaifuddin.com", "custom_domain": true }],
}
```

Sources:

- Cloudflare Workers static assets, billing and limitations: static asset requests are free and unlimited.
- Cloudflare free plan: 100,000 Worker requests per day.

## 4. Instrument Sourcing and Licensing

The core content is the question set.
License review comes before any code.

| Instrument                                      | Items    | License                           | Usable              | Notes                                                                                                                                                |
| ----------------------------------------------- | -------- | --------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| IPIP item pool                                  | 3,000+   | Public domain                     | Yes                 | Any purpose, no permission, no fee.                                                                                                                  |
| IPIP-NEO-120                                    | 120      | Public domain                     | Yes                 | 5 domains, 30 facets, 4 items per facet. Johnson, 2014.                                                                                              |
| IPIP Big Five Factor Markers                    | 50       | Public domain                     | Yes                 | Short general-purpose Big Five test.                                                                                                                 |
| IPIP Big Five Aspect Scales                     | 100      | Public domain                     | Yes                 | Two aspects per domain.                                                                                                                              |
| IPIP 16PF scales                                | 163      | Public domain                     | Yes                 | 16 scales keyed against Cattell's 16PF factors. Shipped. It is not the 16PF Questionnaire.                                                           |
| AMBI                                            | 181      | Public domain                     | Later               | Estimates 203 scales from 8 inventories. The scores are approximations, so the result model needs work first.                                        |
| IPIP-NEO-300                                    | 300      | Public domain                     | Later               | The long NEO form. Low priority, because it overlaps IPIP-NEO-120.                                                                                   |
| PHQ-9 / GAD-7                                   | 9 / 7    | Public domain                     | Yes                 | Screening tools. Require disclaimers and crisis contacts.                                                                                            |
| CES-D                                           | 20       | Public domain                     | Yes                 | Depression screener. The source states the document is in the public domain.                                                                         |
| AUDIT                                           | 10       | Public domain                     | Yes                 | Alcohol screening. World Health Organization instrument, no permission needed.                                                                       |
| ICAR                                            | 60 / 12  | Public domain                     | Yes                 | Cognitive ability item bank: matrix reasoning, number series, rotation, verbal reasoning. Confirm the psycharchives record before the first release. |
| K6 / K10                                        | 6 / 10   | Free with citation                | Yes                 | Cite the article and keep the copyright notice.                                                                                                      |
| WHO-5                                           | 5        | CC BY-NC-SA 3.0 IGO               | Yes, non-commercial | Attribution and share-alike apply.                                                                                                                   |
| Open-Source Psychometrics Project measures      | varies   | Creative Commons                  | Yes                 | Open Extended Jungian Type Scales, Open Hemispheric Brain Dominance Scale, Open Enneagram of Personality Scales.                                     |
| Satisfaction With Life Scale                    | 5        | Free with citation                | Yes                 | Cite Diener and colleagues.                                                                                                                          |
| Rosenberg Self-Esteem Scale                     | 10       | Free to use                       | Yes                 | Cite Rosenberg.                                                                                                                                      |
| Perceived Stress Scale                          | 10       | Free for non-commercial           | Yes                 | Cite Cohen and colleagues.                                                                                                                           |
| PCL-5                                           | 20       | United States Government work     | No                  | Terms not confirmed, so it is out of scope.                                                                                                          |
| O*NET Interest Profiler                         | 30 / 60  | CC BY-ND 4.0                      | Yes, no derivatives | Attribution is required, and no translation is allowed. Trademark rules apply.                                                                       |
| HEXACO-PI-R                                     | 60 / 100 | Non-profit academic research only | No                  | Online data collection by the general public is not allowed.                                                                                         |
| MBTI and 16Personalities                        | -        | Proprietary                       | No                  | Copyright and trademark risk.                                                                                                                        |
| Big Five Inventory (BFI-2)                      | 60       | Not public domain                 | No                  | Permission and fee may apply.                                                                                                                        |
| MMPI, STAI, BAI, BDI, Maslach Burnout Inventory | -        | Proprietary                       | No                  | Paid licences.                                                                                                                                       |

Primary source: `https://ipip.ori.org/`.
The IPIP items and scales are in the public domain.
Users may copy, edit, translate, and use them for any purpose without permission and without a fee.

Item and scoring-key source for IPIP-NEO-120: `https://ipip.ori.org/30FacetNEO-PI-RItems.htm`.
The page lists every item under its facet, with the scoring direction.

Aggregators and machine-readable sources:

- OpenScales (`https://github.com/stmueller/OpenScales`) holds 171 open scales in the Open Scale Definition (OSD) JSON format, plus PhenX and MISS collections.
  Each `.osd` file carries items, response options, scoring rules, norms, interpretation bands, and translations.
  The repository license is CC BY-NC-SA 4.0, and every scale also carries its own license field.
  Treat this as a convenience source, and verify the license of each file before use.
- The PhenX Toolkit is a catalogue of standard measures. Licenses vary by measure.
- The journal Measurement Instruments for the Social Sciences publishes instruments under CC BY 4.0.
- PsyToolkit hosts a survey library of more than 100 scales. Licenses vary by scale.
- Open Psychometrics publishes anonymous response datasets, which are useful for norms and not for items.

Data format decision:

- Adopt the Open Scale Definition as the ingestion format for scales that come from OpenScales.
- Keep one internal typed model, and parse every source into it at build time.
- Validate each source file against the supported OSD subset, and fail the build on an unsupported feature.
- Record the source, license, and attribution of every scale in a registry file.
- Prefer public-domain scales for the first release, because CC BY-NC-SA files add share-alike duties to the repository.

Behavioral norms:

- Johnson's IPIP-NEO data repository on OSF holds raw data for the 300-item and 120-item forms.
- Published descriptive statistics give facet and domain means and standard deviations.
- Some OSD files embed their own norms and interpretation bands.
- We bundle the norm table with the sample size, sample description, and citation.
- We never invent a norm table.

First-release instrument set:

1. IPIP-NEO-120 as the flagship test.
2. IPIP Big Five Factor Markers 50 as the quick test.

Later instruments, by license tier:

- Tier A, public domain: more IPIP scales, CES-D, AUDIT, ICAR.
- Tier B, free with attribution: K6 and K10, Satisfaction With Life Scale, Rosenberg Self-Esteem Scale, Perceived Stress Scale.
- Tier C, licensed with conditions: O*NET Interest Profiler.
- Screening instruments always ship with disclaimers and crisis contacts.

Test categories for the full site:

Licence policy:

Only three licence classes ship.

- `PD`, public domain. No conditions.
- `CC`, Creative Commons. The conditions depend on the variant.
- `FA`, free with attribution, and only after the licence text is on file.

`FR` and `VR` are out of scope.

- `VR` means the terms are not confirmed, so the instrument does not ship.
- `FR` means research-only, and a public site may fall outside that licence, so the instrument does not ship.

Conditions by class:

- `PD`: no conditions.
- `CC BY`: attribution.
- `CC BY-SA`: attribution and share-alike.
- `CC BY-NC` and `CC BY-NC-SA`: attribution, non-commercial use, and share-alike where present.
- `CC BY-ND`: attribution, no change to the item text, and no translation.
- `FA`: attribution, plus every restriction inside the licence text.

Registry gate:

- An instrument enters the repository only when its licence class is `PD`, `CC`, or `FA`.
- The registry entry stores the licence name, a link, and the full licence text for an `FA` instrument.
- The build fails when the licence class is missing or outside the allowed set.

### 1. Personality and temperament

- IPIP-NEO-120, `PD`. Five domains and 30 facets.
- IPIP-NEO-300, `PD`. The long form.
- IPIP Big Five Factor Markers, 50 items, `PD`.
- Mini-IPIP, 20 items, `PD`.
- IPIP Big Five Aspect Scales, 100 items, `PD`.
- IPIP 16PF scales, 163 items, `PD`. Shipped as `sixteen-factor-ipip`, with 16 scales and no facets.
  The source page states that the scales measure constructs similar to the 16PF factors, not that the site ships the 16PF Questionnaire.
- AMBI, 181 items, `PD`. Held back, because it reports approximations of eight other inventories.
  That needs a result view that says what the score is and what it is not.
- IPIP-NEO-300, 300 items, `PD`. Held back, because it repeats the 30 facets of IPIP-NEO-120 with more items per facet.
- Ten-Item Personality Inventory, 10 items, `FA`.
- Open Extended Jungian Type Scales, `CC`. A four-letter type result.
- Open Enneagram of Personality Scales, `CC`.
- Open Hemispheric Brain Dominance Scale, `CC`.
- Excluded under this policy: Dirty Dozen, Short Dark Triad, and the Narcissistic Personality Inventory, because all three are research-only.

### 2. Cognitive ability and reasoning

- ICAR 60, `PD`. The project states that the item bank is public domain. Confirm this on the psycharchives record before the first release.
- ICAR 12 sample test, `PD`. Same source.
- Generated ICAR item types: matrix reasoning, letter and number series, three-dimensional rotation, verbal reasoning, figural analogies, perceptual maze, and propositional reasoning.
- Exposure Based Face Memory Test, `CC`.
- Rules for this category: no intelligence claim, no clinical claim, and a norm table is required before any percentile is shown.

### 3. Career and vocational interests

- O*NET Interest Profiler short form, 60 items. `CC BY-ND 4.0`.
- O*NET Mini-IP, 30 items. Same licence.
- Rules for this category: follow the O*NET trademark and attribution rules exactly, and do not translate the items, because the licence is no-derivatives.

### 4. Mental health screening

- Depression: PHQ-9, PHQ-2, and CES-D. `PD`.
- Anxiety: GAD-7 and GAD-2. `PD`.
- General distress: K6 and K10. `FA`.
- Alcohol: AUDIT and AUDIT-C. `PD`.
- Well-being: WHO-5. `CC BY-NC-SA 3.0 IGO`.
- Excluded under this policy: PCL-5, the Adult ADHD Self-Report Scale, AQ-10, SCOFF, and the Insomnia Severity Index, because their terms are not confirmed.
- Rules for this category: every page carries a crisis banner, a no-diagnosis statement, and local crisis contacts.

### 5. Well-being and quality of life

- Satisfaction With Life Scale, `FA`.
- Flourishing Scale, `FA`.
- ONS4 personal well-being questions, `CC`.
- Excluded under this policy: the Positive and Negative Affect Schedule, because it is research-only.
- WHO-5, shared with the screening category.

### 6. Self, identity, and self-concept

- Rosenberg Self-Esteem Scale, `FA`.
- General Self-Efficacy Scale, `FA`.
- Excluded under this policy: the Self-Compassion Scale and the Self-Concept Clarity Scale, because both are research-only.

### 7. Stress, coping, and burnout

- Perceived Stress Scale, 10-item and 4-item forms, `FA`.
- Copenhagen Burnout Inventory, `FA`.
- Brief COPE, `FA`.
- Excluded: the Maslach Burnout Inventory, because it is proprietary.

### 8. Motivation and performance traits

- Grit Scale, `FA`.
- Need for Cognition Scale, `FA`.
- Excluded under this policy: the Academic Motivation Scale, because it is research-only.

### 9. Values and beliefs

- On hold, because no open instrument is confirmed yet.
- The Portrait Values Questionnaire and the Moral Foundations Questionnaire are research-only.
- World Values Survey items need a licence check before use.

### 10. Relationships and social functioning

- On hold, because no open instrument is confirmed yet.
- The Experiences in Close Relationships scale and the UCLA Loneliness Scale are research-only.
- The Toronto Empathy Questionnaire needs a licence check.

### 11. Knowledge and skills

- The Open Scale Definition supports knowledge tests, so this category runs on the same engine.
- Candidate sources are financial literacy, numeracy, and science literacy item sets with a clear open licence.
- This category stays out of scope until an open item set is found.

Category metadata:

- Each category has an id, a name, a description, an order, and a notice list.
- A notice list can require the crisis banner or the no-diagnosis statement.
- The home page groups instruments by category and shows the category notice.
- A category with no shipped instrument does not appear on the home page.

The engine stays generic, so each instrument declares its own category.
OpenScales also covers health and social measures, so the same engine can run non-psychology surveys.

Release order:

1. First release, shipped: category 1, with IPIP-NEO-120 and IPIP Big Five Factor Markers 50. Both are public domain, so no licence work was needed.
2. Second release, shipped: category 4, with PHQ-9 and GAD-7. Both are public domain and both publish severity bands, so they also proved the scale generalisation and the band model.
   The order changed from the plan, because a text-only screen with published bands is cheaper and more useful than the image items of ICAR, and the screening notices were already specified.
3. Third release: category 2 with ICAR, and category 3 with the O*NET Interest Profiler. Confirm the ICAR record, and follow the O*NET rules.
   ICAR needs item images for matrix reasoning and three-dimensional rotation, so it is not a text-only import.
4. Fourth release: category 5, then categories 6, 7, and 8, each after its licence text is on file.
5. Categories 9, 10, and 11 wait for a `PD`, `CC`, or `FA` instrument.

What the second release added to the model:

- A scale now carries its own `min` and `max`, so a four-point frequency scale sits beside the five-point accuracy scale.
- Mirroring an answer uses the scale bounds instead of a fixed six, so reverse keying works on any scale.
- A trait can carry severity bands, and the schema fails the build when the bands do not tile the whole range.
- The share code derives its bit width from the instrument, which also fixed a latent fault where a domain sum above 31 could not survive a scores-only link.

## 5. Architecture

Static content plus client-side scoring.

- Framework: React 19 with client-side rendering, through Vite and React Router 8.
- UI: shadcn/ui components on Tailwind CSS v4.
- Language: TypeScript with strict mode.
- Scoring: pure TypeScript functions, no network calls.
- Data: instrument files stored in the repository as typed data.
- Validation: parse instrument files at build time with a schema and fail the build on error.
- State: answers held in React state and saved to `localStorage`.
- Sharing: the result encoded in the URL fragment. See section 9 for the saving design.
- Analytics: Cloudflare Web Analytics, which is free and cookieless. Optional.

Why client-side React:

- One language and one toolchain for the whole project.
- The app is fully client-rendered, so the deploy is a static file set.
- shadcn/ui supports Vite and React Router directly.
- Oxlint and Oxfmt cover every source file, with no gap.

Static output for search:

- React Router 8 framework mode runs with `ssr: false`, so the app stays client-rendered.
- The `prerender` option renders the content routes to static HTML at build time.
- This covers the home page, the instrument pages, the methodology page, and the legal pages.
- The test runner and the result page stay client-rendered.
- Prerender is added in Phase 5, when the content pages exist.

Share previews:

- Social crawlers do not run JavaScript, so a thin shell gives them nothing to read.
- A prerendered page carries its title, its description, and the site-level preview tags in the HTML itself.
- The home page, the runner, and the result stay in the shell, because they either read the browser or hold no content worth indexing.
- A share link cannot carry a personalised preview. The payload lives in the URL fragment, and a browser never sends a fragment to a server, so a crawler cannot see which result the link holds.
- The shell therefore carries site-level Open Graph tags, and every share link shows the same preview.
- A personalised preview would need the payload in the query string, which would send the answers to the server. This site does not do that, and the privacy page says so.

Alternatives considered:

- Astro plus React islands.
  Best static performance and search output.
  Rejected because the `.astro` template layer has no formatter in the chosen Oxlint and Oxfmt toolchain.
- Next.js with a static export.
  Strong shadcn support and React-native.
  Rejected because the export removes most Next.js server features, so the gain over React Router framework mode is small.
- Next.js with a Cloudflare runtime through OpenNext.
  Full server features, including dynamic share images.
  Rejected for the first release because of the larger build and runtime surface.
- TanStack Start.
  React with server rendering on Vite.
  Rejected for the first release because the ecosystem is younger and the project gains little.
- Vite plus React Router in library mode.
  The smallest possible setup.
  Kept as the fallback if `prerender` and the share metadata route prove unnecessary.

### Toolchain and scaffolding

Ultracite is the lint and format preset.
Ultracite is not a project scaffolder, so `ultracite init` runs inside an existing project.

Scaffolding sequence:

1. Scaffold the project, for example `npx shadcn@latest init -t react-router` or `bun create vite`.
2. Add Tailwind CSS if the scaffolder did not.
3. Run `bunx ultracite init` with the `oxlint` provider and the `react` and `vitest` frameworks.
4. Run `npx shadcn@latest init` with the chosen preset.
5. Enable the Husky and lint-staged integration from Ultracite.

Provider:

- Use Oxlint plus Oxfmt.
- Oxlint covers TypeScript and TSX fully.
- Oxfmt formats every file type in this project, sorts imports, and sorts Tailwind classes.
- The provider matches the existing `personal-web` project, so the commands and the config style are the same.
- The known `.astro` gap does not apply, because this project has no `.astro` files.

Design system linting:

- shadcn ships `@shadcn/lint`, an agent-first linter for Tailwind design systems.
- The package supports ESLint 9.30 or later, and Oxlint 1.80 or later.
- It ships six rules: `no-restyle`, `no-raw-colors`, `no-arbitrary-values`, `no-inline-styles`, `no-unknown-classes`, and `require-static-classes`.
- The rules accept per-component contracts, so the design system is declared once and verified everywhere.
- Oxlint loads the package through `jsPlugins: ["@shadcn/lint"]`, which is a plain Oxlint feature.
- Ultracite does not ship this plugin in its own JS-plugin preset, so the project adds it to `oxlint.config.ts`.
- `settings.shadcn` points at the shadcn component directory and the theme file.
- `no-restyle` is off for `src/components/ui/**`, because those files define the variants.
- Oxfmt keeps sorting class strings, and `@shadcn/lint` keeps checking the policy. The two do not overlap.

This makes the design system machine-checkable.
An agent that breaks a rule gets an error that names the fix and the component to use.

### Browser support

- Tailwind CSS v4 needs Chrome 111, Safari 16.4, and Firefox 128.
- Older browsers lose the layout and the colors, because those versions gate `@property` and `color-mix()`.
- Chrome 109 is the last version for Windows 7, so a Windows 7 visitor cannot run the current stack.
- The site adds a feature check that shows a plain HTML notice on an unsupported browser.
- The check uses `CSS.supports`, so it needs no user agent parsing.
- If older Chrome becomes a hard requirement, the fallback is Tailwind CSS v3 with an older shadcn preset.

Decision needed: keep the modern baseline, or lower it to reach older Chrome on Windows 7 and older Android WebViews.

## 6. Repository Layout

```
personality-test/
  docs/                 Plan, decisions, methodology
  src/
    content/instruments/   Instrument data files (items, facets, norms)
    lib/                   Types, schema, scoring, norms
    components/ui/         shadcn components
    components/test/       Test runner and result views
    routes/                Route modules and page components
  tests/                 Scoring and data tests
  wrangler.jsonc
  vite.config.ts
  react-router.config.ts
  components.json
```

The project is its own git repository, in the same style as the sibling projects.

## 7. Data Model

The data model is the foundation, so it comes before the interface.

```ts
type LocalizedText = Record<Locale, string>;
type LikertValue = 1 | 2 | 3 | 4 | 5;
type Polarity = "positive" | "negative";

interface Item {
  id: ItemId;
  text: LocalizedText;
  facetId: FacetId;
  polarity: Polarity;
}

interface Facet {
  id: FacetId;
  domainId: DomainId;
  name: LocalizedText;
  description: LocalizedText;
}

interface Domain {
  id: DomainId;
  name: LocalizedText;
  description: LocalizedText;
}

interface Scale {
  id: string;
  labels: Record<LikertValue, LocalizedText>;
}

interface NormTable {
  sample: { n: number; description: string; citation: string };
  facet: Record<FacetId, { mean: number; sd: number }>;
  domain: Record<DomainId, { mean: number; sd: number }>;
}

interface Reference {
  id: string;
  authors: string;
  year: number;
  title: string;
  source: string;
  doi: string | null;
}

interface ReliabilityReport {
  scale: string;
  alpha: number | null;
  omega: number | null;
  testRetest: { value: number; intervalWeeks: number } | null;
  sampleN: number | null;
  referenceId: string;
}

interface ValidityReport {
  kind: "convergent" | "discriminant" | "factor" | "criterion" | "content";
  summary: LocalizedText;
  referenceId: string;
}

interface Evidence {
  reported: boolean;
  reliability: ReliabilityReport[];
  validity: ValidityReport[];
  limitations: LocalizedText | null;
  reason: LocalizedText | null;
}

interface InstrumentInfo {
  category: CategoryId;
  authors: string;
  year: number;
  originalLanguage: Locale;
  audience: LocalizedText;
  durationMinutes: { min: number; max: number };
  responseScale: LocalizedText;
  whatYouGet: LocalizedText[];
  notFor: LocalizedText[];
}

interface Instrument {
  id: InstrumentId;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  instructions: LocalizedText;
  sourceUrl: string;
  license: string;
  citation: string;
  info: InstrumentInfo;
  evidence: Evidence;
  references: Reference[];
  scale: Scale;
  items: Item[];
  facets: Facet[];
  domains: Domain[];
  norms: NormTable | null;
  reporting: ReportingSpec;
}

interface ScoreResult {
  computedAt: string;
  facets: Record<FacetId, TraitScore>;
  domains: Record<DomainId, TraitScore>;
}

interface TraitScore {
  raw: number;
  z: number | null;
  percentile: number | null;
  band: string;
}
```

Design rules:

- Reverse-keyed items carry a `polarity` of `negative`.
- Scoring never mutates input.
- A missing norm table makes percentile fields `null` instead of a guessed value.
- Item text is keyed by locale, so translation adds data and not code.
- The pre-start page reads only from `info`, `evidence`, and `references`.
- When `evidence.reported` is `false`, `reason` is required, so the page states the gap instead of hiding it.
- A `null` reliability value means "not published", while a missing row is a build error.
- Every `referenceId` must resolve to a `Reference`, and the build fails when it does not.

## 8. Scoring and Norms

Scoring algorithm:

1. Map each answer to a Likert value from 1 to 5.
2. Reverse the value for negative items, using `6 - value`.
3. Sum the items of each facet.
4. Sum the facets of each domain.

Rules:

- Report the raw score with its minimum and maximum, for example 16 of 20.
- Describe a score against its own scale midpoint, and never against other people.
- State on the result page that the IPIP publishes no population norms.
- Do not use clinical labels.

Norms decision:

- The IPIP project publishes no norms and advises against canned norms, because no internet sample is representative of a given visitor.
- The source statement is at `https://ipip.ori.org/newNorms.htm`.
- The IPIP-NEO-120 therefore ships with `norms: null` and a `reporting.mode` of `descriptive`.
- A score above the scale midpoint uses the high text, a score below it uses the low text, and an exact midpoint score says so.
- If a later instrument publishes a real norm table, the schema keeps the `normed` mode and the percentile path, but no percentile is invented for an instrument that lacks one.

Data source for the first instrument:

- The items, the facet membership, the scoring direction, and the 30 facet alpha values come from `https://ipip.ori.org/30FacetNEO-PI-RItems.htm`.
- `bun run import:ipip-neo-120` rebuilds `app/content/instruments/ipip-neo-120.json` from that page.
- The import fails when the page does not yield 30 facets, 120 items, four items per facet, and a usable alpha for every facet.
- The committed data file is sorted by key, so a regeneration diffs only where the source changed.

## 9. Flow, Pages, and UX

### The flow

Four steps, with no account at any point.

1. Home. The visitor picks a test.
2. Before you start. The page gives the general information and the psychometric evidence, then one button: Start.
3. Test. The visitor answers grouped questions. Progress is visible. Answers save automatically.
4. Result. The scores appear at once. The page offers a share link, a download, and a retake.

Rules for the flow:

- No sign-up, no email, and no login.
- No confirmation step after the test.
- The result appears without a button press and without a wait.
- The visitor can leave and return, and the test resumes where it stopped.
- The visitor can retake the test from the result page.

Public pages:

- Home, with the test list and a filter by category.
- Instrument page, which holds the general information and the psychometric evidence before the Start button.
- Test runner.
- Result page.
- Methodology page for the site, with the scoring rules and citations.
- Methodology page for each instrument, with the full item list, the scoring key, and the references.
- Licenses and attribution page.
- Privacy policy and terms.
- Optional screening section, with crisis contacts.

Test runner requirements:

- Ten items per page on every screen size, with the scale legend above the list.
- Visible progress and an estimate of questions left.
- Back and forward navigation.
- Resume of an unfinished test from `localStorage`.
- Keyboard operation for every control.
- Reduced-motion support.
- No answer is preselected.

Result page requirements:

- Domain scores first, then facet detail.
- A bar or radar chart built with shadcn chart components.
- The norm reference shown next to the numbers.
- A share link that encodes the answers.
- A retake action.

### Before you start page

Every instrument page shows this information before the Start button, in this order.

General information:

- Title, category, and a one-sentence summary.
- Authors, year, and original language.
- What the test measures.
- Who the test is for.
- Item count and the response scale.
- The estimated time range.
- Instructions for answering, including that there are no right answers.
- What the visitor gets at the end.
- What the test is not, including the no-diagnosis statement.

Psychometric evidence:

- Internal consistency for each scale, as alpha or omega.
- Test-retest reliability with the interval.
- Validity evidence, grouped by kind.
- The norm sample: size, description, and year.
- Known limitations.
- The full reference list, with links.

Rules for the page:

- When a value is not published, the row shows "not reported". The row stays visible.
- The evidence block can collapse, but it does not move to a second page.
- The Start button stays visible at all times.
- The same data renders the instrument methodology page, with the item list and the scoring key added.
- For IPIP-NEO-120, the facet alpha values come from the source item page, and the structure and validity evidence come from Johnson, 2014.

### Result saving without login

Saving works in three layers.
All three layers run in the browser.
No layer needs an account.

Layer 1, automatic local save.

- Every answer writes to `localStorage`, keyed by instrument.
- A finished result is appended to a local history list.
- The history list gives resume, retake, and a result list on the home page.
- Scope: one browser on one device.
- Limit: clearing the browser data removes the history.

Layer 2, share link.

- The result is encoded into the URL fragment, for example `#r=<payload>`.
- The fragment is not sent to the server, so Cloudflare logs never see it.
- The payload packs 120 answers at 3 bits each, which is 45 bytes. With the header and the instrument id, the code is 80 base64url characters.
- A scores-only payload packs 30 facet sums at 5 bits each, so its code is 46 characters.
- A share link is therefore short enough for chat and social media.
- The link is the private key. Anyone with the link can read the result.
- The result page offers a "scores only" link that hides the raw answers.

Layer 3, export and import.

- A "Download result" action writes a small JSON file.
- An "Import result" action reads that file back.
- This moves a result between devices and keeps a result after the browser data is cleared.
- A printable or PDF layout can reuse the same result view later.

Layer 4, automatic scores-only D1 save.

- A completed local test saves derived scores under a random private code.
- A stored link uses `#s=<code>` and retrieves scores through a same-origin API.
- No account, email, name, raw answer, or IP address is stored in the result database.
- All shipped instruments are covered, including screening tests.
- Access expires at midnight UTC no later than 90 days after saving.
- A daily bounded job deletes expired rows.
- Anyone with the code can read or delete the stored copy.
- The instrument and privacy pages disclose collection before the test starts.
- The result renders without waiting for the database.

This changes the former browser-only result promise, but not the browser-only answer promise.
The detailed implementation and release steps are in `docs/D1-RESULTS.md`.
There is still no account-based recovery, cross-device unfinished-test sync, or recovery without a link or export.

## 10. Privacy, Ethics, and Legal

Privacy:

- No account and no login.
- Answers stay in the browser.
- `localStorage` holds the current test state and a local result history.
- The share link carries the result in the URL fragment, which the server never receives.
- No answer is sent to a server.
- Completed scores are automatically stored in D1 for up to 90 days.
- Scores can be sensitive even without contact information.
- Infrastructure request logs and D1 recovery copies have separate retention.
- A plain privacy page states all of the above.

Ethics:

- State clearly that the tests are for education and self-reflection.
- State clearly that the tests are not a diagnosis.
- State clearly that the tests use self-report and that results can change.
- Provide crisis contacts on any mental-health screen, including local Malaysian lines.
- Do not rank users against each other.

Legal and attribution:

- Attribute IPIP and the named authors on every instrument page.
- Keep the public-domain status note with the item data.
- Keep a licenses page that records the source and status of every instrument.

## 11. Search and Languages

Search:

- One static page per instrument with a descriptive title and description.
- Structured data for each test page.
- A sitemap and a robots file.
- Fast static HTML with no blocking JavaScript.

Languages:

- English in the first release.
- Bahasa Melayu in a later release.
- Locale-keyed item text makes the addition data-only.

## 12. Testing and Verification

- Unit tests for scoring, reverse keying, z-scores, percentiles, and bands.
- A build-time check for item counts, facet counts, and duplicate identifiers.
- A design system lint check from `@shadcn/lint` that runs inside the normal lint command.
- A completeness check that fails the build when a required pre-start field is empty.
- A reference check that fails the build when a reliability or validity row points at a missing reference.
- A data test that recomputes each facet from its declared items.
- Component tests for the test runner and the result view.
- End-to-end tests that complete a full test and assert the result.
- A check against the published IPIP-NEO-120 key on a fixed answer set.
- Lighthouse checks for performance, accessibility, and best practices.
- A browser check of the live deployment at desktop and mobile width.

## 13. Phases

Each phase ends in a state that can be checked.

Phase 0, foundation. Status: complete.
Initialize the repository, the React Router project, TypeScript, Tailwind, shadcn, Ultracite, `@shadcn/lint`, and tests.
Check: build, lint, test, and typecheck all pass.
The repository now holds the React Router SPA, the shadcn base components, the Ultracite setup, the Vitest setup, the Cloudflare Worker configuration, and one smoke test.
The site is deployed to `test.farissaifuddin.com` on Cloudflare Workers static assets.

Phase 1, data and scoring.
Define the types and schema, add the IPIP-NEO-120 items and key, add the norm table, and write the scoring functions with tests.
Check: scoring matches the published key, and all data checks pass.

Phase 2, shell, pre-start page, and content pages.
Build the layout, the before-you-start page with its information and evidence blocks, and the shared components from shadcn.
Check: pages render, the completeness check passes, accessibility checks pass, and the pages look correct at desktop and mobile width.

Phase 3, test runner and the first result view. Status: complete.
Build the question flow, the progress bar, resume, keyboard support, and a result view with the raw scores and the midline descriptions.
Check: a full test run completes end to end and shows a score for every domain and facet.
The runner keeps ten items per page, saves every answer to local storage, and disables Next until the page is answered.

Phase 4, saving and sharing. Status: complete.
Add the share link that encodes the result, a scores-only variant, the download and import of a result file, the result history on the home page, and a bar for each domain score.
Check: a share link opens the same result in another browser, and a downloaded file imports back.
The bars come from the progress component. A chart library was left out, because five bars do not earn the extra dependency.

Phase 5, second test, content, and prerender. Status: complete.
Add the IPIP Big Five Factor Markers 50, the site methodology page, the per-instrument item list and scoring key, and the licence review.
Add `prerender` for the content routes, and keep `index.html` a content-free shell for the client-rendered routes.
Check: both instruments pass all data and scoring tests, and the content routes are static HTML at build time.

Phase 6, preview tags, headers, and analytics. Status: complete.
Publish the site-level preview tags, serve the security headers from `public/_headers`, and document analytics.
Check: the security headers arrive on every response, a prerendered page carries its preview tags, and the console has no errors.
Cloudflare Web Analytics is switched on from the dashboard with no code change, and the privacy page states that it is cookieless.

Phase 7, outreach and iteration. Status: in progress.
Shipped: PHQ-9 and GAD-7 in the screening category, with the published severity bands and the crisis notice.
Shipped: the IPIP sixteen-factor scales in the personality category, imported from the published items, keying, and alphas.
The share code now decodes against the instrument's own item or scale count, so a four-point scale round trips.
Remaining: ICAR and the O*NET Interest Profiler, the well-being, self, stress, and motivation categories, and a saved-reading history view.

Bahasa Melayu, if it is wanted:

- The audience is Malaysian, and the data model already allows an optional `ms` value on every item and label, so the change is additive.
- Scoring and the share payload use numbers, so a translation never touches the key.
- The IPIP items are public domain, and the IPIP site states that users may translate them.
- A Bahasa Malaysia translation of the 50-item markers already exists. Hazalizah Hamzah at UPSI translated and back-translated it, under Aminuddin Mohd Yusof, and `https://ipip.ori.org/newItemTranslations.htm` lists the project with contact details.
- The IPIP site does not publish the translated text, so the item wording must be requested from the translator, or produced here.
- A machine translation is not acceptable for a published scale. It changes what the items measure, which is a validity problem and not a style problem.
- Malay translations of the Mini-IPIP and of 11 IPIP narrow traits have been validated in Malaysia, so a reviewed translation is feasible.
- A no-derivatives licence forbids translation. The O*NET Interest Profiler is the first example, so language support is decided per instrument.

## 14. Open Decisions

Decided:

1. Subdomain: `test.farissaifuddin.com`. It is deployed.
2. React Router framework mode with `ssr: false`. Prerender arrives in Phase 5.
3. shadcn style `base-nova` on Base UI.

Open:

4. Language scope for the first release.
5. Whether the first release includes the PHQ-9 and GAD-7 screening section.
6. Browser baseline: keep the Tailwind v4 floor of Chrome 111, Safari 16.4, and Firefox 128, or lower it.
   The D1 branch implements automatic scores-only saving, up to 90-day retention, and screening coverage.
   See `docs/D1-RESULTS.md` for the release and verification gaps.

## 15. Risks

- Search risk: a client-rendered site can rank below static content and can show a generic social preview.
  Mitigation: prerender the content routes, and carry site-level preview tags in the shell.
- Norm risk: a wrong or misapplied norm table gives misleading percentiles.
  Mitigation: bundle published statistics only, cite the sample, and test the math.
- Legal risk: an instrument may look open but may not be.
  Mitigation: keep the license table and require a check before each addition.
- Perception risk: users may treat a screening score as a diagnosis.
  Mitigation: clear disclaimers and crisis contacts on every result.
- Trust risk: a public test site invites scrutiny of its methods.
  Mitigation: publish the items, the key, the norms, and the citations.
