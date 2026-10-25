import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

/**
 * Builds `app/content/instruments/ipip-neo-120.json` from the source page.
 *
 * The IPIP-NEO-120 items, their facet membership, their scoring direction, and
 * the facet alpha values all come from one HTML table at ipip.ori.org. This
 * script transcribes that table, so the committed data file can be rebuilt and
 * diffed instead of edited by hand.
 *
 * Object keys are sorted, so a regenerated file diffs only where the source
 * changed.
 *
 * Run with: `bun run import:ipip-neo-120`
 */

const SOURCE_URL = "https://ipip.ori.org/30FacetNEO-PI-RItems.htm";
const OUTPUT_PATH = new URL(
  "../app/content/instruments/ipip-neo-120.json",
  import.meta.url
).pathname;

const DOMAIN_IDS = ["N", "E", "O", "A", "C"] as const;

type DomainId = (typeof DOMAIN_IDS)[number];
type Polarity = "negative" | "positive";

interface ParsedFacet {
  alpha: number;
  domainId: string;
  id: string;
  items: { id: string; polarity: Polarity; text: string }[];
  name: string;
}

const isDomainId = (value: string): value is DomainId =>
  (DOMAIN_IDS as readonly string[]).includes(value);

const DOMAIN_CONTENT: Record<
  DomainId,
  { description: string; high: string; low: string; name: string }
> = {
  A: {
    description:
      "The tendency to trust other people, to cooperate with them, and to feel concern for them.",
    high: "High scorers tend to be trusting, helpful, and willing to compromise.",
    low: "Low scorers tend to be direct, sceptical, and competitive.",
    name: "Agreeableness",
  },
  C: {
    description:
      "The tendency to order, to self-discipline, and to goal-directed effort.",
    high: "High scorers tend to be organised, dependable, and persistent.",
    low: "Low scorers tend to be flexible, spontaneous, and less orderly.",
    name: "Conscientiousness",
  },
  E: {
    description:
      "The tendency to seek company, activity, and positive emotion.",
    high: "High scorers tend to be talkative, energetic, and sociable.",
    low: "Low scorers tend to be quiet, reserved, and comfortable alone.",
    name: "Extraversion",
  },
  N: {
    description:
      "The tendency to experience negative emotions, such as anxiety, anger, and sadness.",
    high: "High scorers tend to feel tense, worry often, and react strongly to stress.",
    low: "Low scorers tend to stay calm and steady under stress.",
    name: "Neuroticism",
  },
  O: {
    description:
      "The tendency to imagination, aesthetic interest, and intellectual curiosity.",
    high: "High scorers tend to be curious, imaginative, and open to new ideas.",
    low: "Low scorers tend to prefer the familiar, the concrete, and the conventional.",
    name: "Openness to Experience",
  },
};

const FACET_DESCRIPTIONS: Record<string, string> = {
  A1: "The tendency to believe that other people mean well.",
  A2: "The tendency to be straightforward and to avoid deception.",
  A3: "The tendency to help other people and to show concern.",
  A4: "The tendency to avoid conflict and to work with other people.",
  A5: "The tendency to be humble and to avoid self-promotion.",
  A6: "The tendency to feel the emotions of other people.",
  C1: "The belief in your own ability to get things done.",
  C2: "The tendency to keep things tidy and organised.",
  C3: "The tendency to keep promises and to follow rules.",
  C4: "The tendency to set high goals and to work towards them.",
  C5: "The tendency to start tasks and to finish them.",
  C6: "The tendency to think before you act.",
  E1: "The tendency to show warmth and interest in other people.",
  E2: "The tendency to enjoy crowds and company.",
  E3: "The tendency to speak up and to take charge.",
  E4: "The tendency to be busy, fast-moving, and energetic.",
  E5: "The tendency to seek stimulation and thrills.",
  E6: "The tendency to feel joy, enthusiasm, and good humour.",
  N1: "The tendency to worry and to feel fear or tension.",
  N2: "The tendency to feel irritation and to lose your temper.",
  N3: "The tendency to feel sad, discouraged, and low in mood.",
  N4: "The tendency to feel shy and uneasy around other people.",
  N5: "The tendency to give in to urges and cravings.",
  N6: "The tendency to feel overwhelmed by stress and pressure.",
  O1: "The tendency to a vivid imagination and to fantasy.",
  O2: "The tendency to enjoy art, music, and beauty.",
  O3: "The tendency to notice and to value your own feelings.",
  O4: "The tendency to try new activities and to welcome change.",
  O5: "The tendency to enjoy ideas, analysis, and debate.",
  O6: "The tendency to question authority and to favour change in society.",
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");

const decodeEntities = (value: string) =>
  value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

const stripTags = (value: string) =>
  decodeEntities(value.replaceAll(/<[^>]+>/gu, ""))
    .replaceAll(/\s+/gu, " ")
    .trim();

const parseRows = (html: string) =>
  [...html.matchAll(/<tr[^>]*>(?<row>[\S\s]*?)<\/tr>/giu)].map((match) =>
    [
      ...(match.groups?.row ?? "").matchAll(
        /<t[dh][^>]*>(?<cell>[\S\s]*?)<\/t[dh]>/giu
      ),
    ].map((cell) => stripTags(cell.groups?.cell ?? ""))
  );

const FACET_HEADER =
  /^(?<domain>[A-Z])(?<number>\d)\s*:\s*(?<name>.+?)\s*\((?:Alpha\s*=\s*)?(?<alpha>\d*\.\d+)\)$/u;

const parseFacets = (html: string): ParsedFacet[] => {
  const facets: ParsedFacet[] = [];
  let currentFacet: ParsedFacet | undefined;
  let currentPolarity: Polarity = "positive";
  let itemIndex = 0;

  for (const cells of parseRows(html)) {
    const single = cells.length === 1 ? cells[0] : undefined;

    if (single) {
      const match = FACET_HEADER.exec(single);
      if (match?.groups) {
        const { alpha, domain, name, number } = match.groups;
        if (!(domain && number && name && alpha)) {
          continue;
        }
        currentFacet = {
          alpha: Number(alpha),
          domainId: domain,
          id: `${domain}${number}`,
          items: [],
          name: titleCase(name),
        };
        currentPolarity = "positive";
        itemIndex = 0;
        facets.push(currentFacet);
      }
      continue;
    }

    const [marker = "", text = ""] = cells;
    if (!(text && currentFacet)) {
      continue;
    }

    if (marker.includes("keyed")) {
      currentPolarity = marker.startsWith("+") ? "positive" : "negative";
    }

    itemIndex += 1;
    currentFacet.items.push({
      id: `${currentFacet.id.toLowerCase()}-${itemIndex}`,
      polarity: currentPolarity,
      text,
    });
  }

  return facets;
};

const assertParsed = (facets: ParsedFacet[]) => {
  const problems: string[] = [];
  const known = facets.filter((facet) => isDomainId(facet.domainId));

  if (known.length !== 30) {
    problems.push(`expected 30 facets, found ${known.length}`);
  }

  const itemCount = known.reduce((sum, facet) => sum + facet.items.length, 0);
  if (itemCount !== 120) {
    problems.push(`expected 120 items, found ${itemCount}`);
  }

  for (const facet of known) {
    if (facet.items.length !== 4) {
      problems.push(`${facet.id} has ${facet.items.length} items, expected 4`);
    }
    if (!FACET_DESCRIPTIONS[facet.id]) {
      problems.push(`${facet.id} has no description`);
    }
    if (!(facet.alpha > 0 && facet.alpha <= 1)) {
      problems.push(`${facet.id} has an unusable alpha (${facet.alpha})`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Source page did not parse as expected:\n- ${problems.join("\n- ")}`
    );
  }
};

/**
 * The committed data file is formatter output, so a regeneration never leaves a
 * formatting diff behind.
 */
const formatOutput = () => {
  execFileSync("bunx", ["oxfmt", "--write", OUTPUT_PATH], { stdio: "inherit" });
};

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`);
}

const parsedFacets = parseFacets(await response.text());
assertParsed(parsedFacets);

const domains = DOMAIN_IDS.map((domainId) => {
  const content = DOMAIN_CONTENT[domainId];
  return {
    bands: [],
    description: content.description,
    facetIds: parsedFacets
      .filter((facet) => facet.domainId === domainId)
      .map((facet) => facet.id),
    high: content.high,
    id: domainId,
    low: content.low,
    name: content.name,
  };
});

const instrument = {
  avatar: {
    colour: "slate",
    eye: "dot",
    mark: "brow",
    shape: "tall",
  },
  category: "personality",
  citation:
    "Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. Journal of Research in Personality, 51, 78-89.",
  description:
    "A public-domain inventory that measures the five broad domains of personality and the six facets inside each domain.",
  domains,
  evidence: {
    limitations:
      "The alpha values and the validity evidence come from internet samples. Self-report answers change with mood and context. The IPIP project publishes no population norms, so this site reports raw scores only.",
    referenceIds: ["johnson-2014"],
    reliability: parsedFacets.map((facet) => ({
      alpha: facet.alpha,
      referenceId: "johnson-2014",
      sampleN: null,
      scale: facet.id,
    })),
    reported: true,
    validity: [
      {
        kind: "convergent",
        referenceId: "johnson-2014",
        summary:
          "The facet scales correlate with the matching NEO PI-R facet scales and with acquaintance ratings.",
      },
      {
        kind: "factor",
        referenceId: "johnson-2014",
        summary:
          "The factor structure of the facet scores is nearly identical to the NEO PI-R factor structure.",
      },
    ],
  },
  facets: parsedFacets.map((facet) => ({
    bands: [],
    description: FACET_DESCRIPTIONS[facet.id],
    domainId: facet.domainId,
    id: facet.id,
    name: facet.name,
  })),
  id: "ipip-neo-120",
  info: {
    audience:
      "Adults who want a descriptive picture of their personality across the five-factor model.",
    authors: "John A. Johnson",
    durationMinutes: { max: 20, min: 10 },
    notFor: [
      "A diagnosis.",
      "A clinical assessment.",
      "A measure of ability or intelligence.",
      "A comparison against a population.",
    ],
    originalLanguage: "en",
    responseScale:
      "A five-point accuracy scale, from Very Inaccurate to Very Accurate.",
    whatYouGet: [
      "A score for each of the 5 domains.",
      "A score for each of the 30 facets.",
      "A short description of what a high score and a low score mean.",
      "A link that shares your result and a file that saves it.",
    ],
    year: 2014,
  },
  instructions:
    "Describe yourself as you generally are now, not as you wish to be in the future. Describe yourself as you honestly see yourself in relation to other people you know of the same sex as you are, and roughly your same age. There are no right or wrong answers.",
  items: parsedFacets.flatMap((facet) =>
    facet.items.map((item) => ({
      domainId: facet.domainId,
      facetId: facet.id,
      id: item.id,
      polarity: item.polarity,
      text: item.text,
    }))
  ),
  license: "Public domain",
  licenseNotes:
    "The IPIP items are in the public domain. Copy, edit, translate, and use them for any purpose without permission and without a fee.",
  norms: null,
  references: [
    {
      authors: "Johnson, J. A.",
      doi: "10.1016/j.jrp.2014.05.003",
      id: "johnson-2014",
      source: "Journal of Research in Personality, 51, 78-89",
      title:
        "Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120",
      year: 2014,
    },
    {
      authors: "Goldberg, L. R.",
      doi: null,
      id: "goldberg-1999",
      source: "Personality Psychology in Europe, 7, 7-28",
      title:
        "A broad-bandwidth, public domain, personality inventory measuring the lower-level facets of several five-factor models",
      year: 1999,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip",
      source: "https://ipip.ori.org/",
      title: "IPIP item pool and scales",
      year: 2026,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip-norms",
      source: "https://ipip.ori.org/newNorms.htm",
      title: "Information about Norms and Data Sets",
      year: 2026,
    },
  ],
  reporting: {
    mode: "descriptive",
    note: "This site reports raw scores. The IPIP project publishes no population norms and advises against canned norms, so no percentile is shown.",
  },
  scale: {
    id: "accuracy-5",
    labels: {
      "1": "Very Inaccurate",
      "2": "Moderately Inaccurate",
      "3": "Neither Accurate Nor Inaccurate",
      "4": "Moderately Accurate",
      "5": "Very Accurate",
    },
    max: 5,
    min: 1,
  },
  slug: "big-five-ipip-neo-120",
  sourceUrl: SOURCE_URL,
  summary: "120 items across 5 domains and 30 facets.",
  title: "Big Five personality test (IPIP-NEO-120)",
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(instrument, null, 2)}\n`);
formatOutput();

const negatives = instrument.items.filter(
  (item) => item.polarity === "negative"
).length;
console.log(
  `Wrote ${OUTPUT_PATH}\n` +
    `  facets: ${instrument.facets.length}\n` +
    `  items: ${instrument.items.length} (${negatives} reverse-keyed)\n` +
    `  alphas: ${instrument.evidence.reliability.length}\n` +
    `  domains: ${instrument.domains.length}`
);
