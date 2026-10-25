/**
 * Builds `app/content/instruments/ipip-bffm-50.json`.
 *
 * Two source pages are combined:
 * - the sample questionnaire carries the 50 items in presentation order, each
 *   with a `(scale and key)` marker,
 * - the scoring key carries the 10-item alpha value for each of the five
 *   factors.
 *
 * Both pages are UTF-16 without a byte-order mark, so the decoder picks the
 * encoding that yields readable text.
 *
 * Run with: `bun run import:ipip-bffm-50`
 */

import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const ITEMS_URL = "https://ipip.ori.org/New_IPIP-50-item-scale.htm";
const KEY_URL = "https://ipip.ori.org/newBigFive5broadKey.htm";
const OUTPUT_PATH = new URL(
  "../app/content/instruments/ipip-bffm-50.json",
  import.meta.url
).pathname;

type Polarity = "negative" | "positive";

interface ParsedItem {
  domainId: string;
  id: string;
  polarity: Polarity;
  text: string;
}

const FACTORS: Record<
  string,
  { description: string; high: string; id: string; low: string; name: string }
> = {
  "1": {
    description:
      "The tendency to seek company, activity, and positive emotion.",
    high: "High scorers tend to be talkative, energetic, and sociable.",
    id: "extraversion",
    low: "Low scorers tend to be quiet, reserved, and comfortable alone.",
    name: "Extraversion",
  },
  "2": {
    description:
      "The tendency to trust other people, to cooperate with them, and to feel concern for them.",
    high: "High scorers tend to be trusting, helpful, and willing to compromise.",
    id: "agreeableness",
    low: "Low scorers tend to be direct, sceptical, and competitive.",
    name: "Agreeableness",
  },
  "3": {
    description:
      "The tendency to order, to self-discipline, and to goal-directed effort.",
    high: "High scorers tend to be organised, dependable, and persistent.",
    id: "conscientiousness",
    low: "Low scorers tend to be flexible, spontaneous, and less orderly.",
    name: "Conscientiousness",
  },
  "4": {
    description:
      "The tendency to stay calm and steady, rather than to experience anxiety, anger, and low mood.",
    high: "High scorers tend to stay calm and steady under stress.",
    id: "emotional-stability",
    low: "Low scorers tend to feel tense, worry often, and react strongly to stress.",
    name: "Emotional Stability",
  },
  "5": {
    description:
      "The tendency to imagination, aesthetic interest, and intellectual curiosity.",
    high: "High scorers tend to be curious, imaginative, and open to new ideas.",
    id: "intellect",
    low: "Low scorers tend to prefer the familiar, the concrete, and the conventional.",
    name: "Intellect and Imagination",
  },
};

const FACTOR_IDS = ["1", "2", "3", "4", "5"] as const;

const readableRatio = (text: string) => {
  const sample = text.slice(0, 3000);
  let letters = 0;

  for (const character of sample) {
    if (/[A-Za-z0-9 .,;:'()-]/u.test(character)) {
      letters += 1;
    }
  }

  return letters / Math.max(1, sample.length);
};

/** The pages are UTF-16 without a byte-order mark. */
const decodePage = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const candidates = [
    new TextDecoder("utf-16le").decode(bytes),
    new TextDecoder("utf-16be").decode(bytes),
    new TextDecoder("utf-8").decode(bytes),
  ];
  const [best = ""] = candidates.toSorted(
    (left, right) => readableRatio(right) - readableRatio(left)
  );

  return best.replaceAll("\u0000", "");
};

const stripTags = (value: string) =>
  value
    .replaceAll(/<[^>]+>/gu, "\n")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

const toLines = (html: string) =>
  stripTags(html)
    .split("\n")
    .map((line) => line.replaceAll(/\s+/gu, " ").trim())
    .filter((line) => line.length > 0);

const ITEM_NUMBER = /^(?<number>\d{1,2})\.$/u;
const ITEM_MARKER = /^\((?<factor>\d)(?<key>[+-])\)$/u;

const parseItems = (html: string): ParsedItem[] => {
  const lines = toLines(html);
  const items: ParsedItem[] = [];

  for (const [index, line] of lines.entries()) {
    const numberMatch = ITEM_NUMBER.exec(line);

    if (!numberMatch?.groups?.number) {
      continue;
    }

    const text = lines[index + 1] ?? "";
    let marker: { factor: string; key: string } | undefined;

    for (let offset = 1; offset <= 12; offset += 1) {
      const candidate = lines[index + offset];
      const match = candidate ? ITEM_MARKER.exec(candidate) : null;

      if (match?.groups?.factor && match.groups.key) {
        marker = { factor: match.groups.factor, key: match.groups.key };
        break;
      }
    }

    if (!(marker && text) || text === "О") {
      continue;
    }

    items.push({
      domainId: FACTORS[marker.factor]?.id ?? marker.factor,
      id: `bffm-${String(items.length + 1).padStart(2, "0")}`,
      polarity: marker.key === "+" ? "positive" : "negative",
      text,
    });
  }

  return items;
};

const parseAlphas = (html: string): number[] => {
  const flat = stripTags(html).replaceAll(/\s+/gu, " ");
  const matches = [
    ...flat.matchAll(/10-item\s*scale\s*\(Alpha\s*=\s*\.(?<alpha>\d+)\)/giu),
  ];

  return matches.flatMap((match) =>
    match.groups?.alpha ? [Number(`0.${match.groups.alpha}`)] : []
  );
};

const assertParsed = (items: ParsedItem[], alphas: number[]) => {
  const problems: string[] = [];

  if (items.length !== 50) {
    problems.push(`expected 50 items, found ${items.length}`);
  }

  if (alphas.length !== 5) {
    problems.push(`expected 5 alpha values, found ${alphas.length}`);
  }

  for (const factorId of FACTOR_IDS) {
    const own = items.filter((item) => item.domainId === FACTORS[factorId]?.id);

    if (own.length !== 10) {
      problems.push(`factor ${factorId} has ${own.length} items, expected 10`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Source pages did not parse as expected:\n- ${problems.join("\n- ")}`
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

const fetchText = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return decodePage(await response.arrayBuffer());
};

const itemsHtml = await fetchText(ITEMS_URL);
const keyHtml = await fetchText(KEY_URL);

const parsedItems = parseItems(itemsHtml);
const alphas = parseAlphas(keyHtml);

assertParsed(parsedItems, alphas);

const domains = FACTOR_IDS.map((factorId) => {
  const factor = FACTORS[factorId];
  const id = factor?.id ?? factorId;

  return {
    bands: [],
    description: factor?.description ?? "",
    facetIds: [] as string[],
    high: factor?.high ?? "",
    id,
    low: factor?.low ?? "",
    name: factor?.name ?? factorId,
  };
});

const instrument = {
  avatar: {
    accessory: "none",
    colour: "blue",
    eyes: "slant",
    shape: "round",
  },
  category: "personality",
  citation:
    "Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure. Psychological Assessment, 4(1), 26-42.",
  description:
    "A short public-domain inventory that measures the five broad domains of personality with ten items each.",
  domains,
  evidence: {
    limitations:
      "The alpha values come from the published source. Self-report answers change with mood and context. The IPIP project publishes no population norms, so this site reports raw scores only.",
    referenceIds: ["goldberg-1992", "ipip-key"],
    reliability: domains.map((domain, index) => ({
      alpha: alphas[index] ?? null,
      referenceId: "ipip-key",
      sampleN: null,
      scale: domain.id,
    })),
    reported: true,
    validity: [
      {
        kind: "factor",
        referenceId: "goldberg-1992",
        summary:
          "The 50 markers were selected to define the five broad factors, and they reproduce that structure across samples.",
      },
      {
        kind: "convergent",
        referenceId: "goldberg-1992",
        summary:
          "The marker scales correlate with other established measures of the same five factors.",
      },
    ],
  },
  facets: [] as {
    description: string;
    domainId: string;
    id: string;
    name: string;
  }[],
  id: "ipip-bffm-50",
  info: {
    audience:
      "Adults who want a quick picture of their personality across the five-factor model.",
    authors: "Lewis R. Goldberg",
    durationMinutes: { max: 10, min: 5 },
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
      "A short description of what a high score and a low score mean.",
      "A link that shares your result and a file that saves it.",
    ],
    year: 1992,
  },
  instructions:
    "Describe yourself as you generally are now, not as you wish to be in the future. Describe yourself as you honestly see yourself in relation to other people you know of the same sex as you are, and roughly your same age. There are no right or wrong answers.",
  items: parsedItems,
  license: "Public domain",
  licenseNotes:
    "The IPIP items are in the public domain. Copy, edit, translate, and use them for any purpose without permission and without a fee.",
  norms: null,
  references: [
    {
      authors: "Goldberg, L. R.",
      doi: "10.1037/1040-3590.4.1.26",
      id: "goldberg-1992",
      source: "Psychological Assessment, 4(1), 26-42",
      title: "The development of markers for the Big-Five factor structure",
      year: 1992,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip-key",
      source: KEY_URL,
      title: "Big-Five Factor Markers scoring key",
      year: 2026,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip",
      source: "https://ipip.ori.org/",
      title: "IPIP item pool and scales",
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
  slug: "big-five-ipip-50",
  sourceUrl: ITEMS_URL,
  summary: "50 items across the 5 broad domains.",
  title: "Big Five short test (IPIP-50)",
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(instrument, null, 2)}\n`);
formatOutput();

console.log(
  `Wrote ${OUTPUT_PATH}\n` +
    `  domains: ${instrument.domains.length}\n` +
    `  items: ${instrument.items.length}\n` +
    `  alphas: ${instrument.evidence.reliability.map((entry) => entry.alpha).join(", ")}`
);
