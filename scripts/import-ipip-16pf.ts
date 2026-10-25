/**
 * Builds `app/content/instruments/ipip-16pf.json`.
 *
 * The source page lists the 16 preliminary IPIP scales that measure constructs
 * similar to Cattell's 16 Personality Factor Questionnaire. Each scale heading
 * carries the published alpha value, and each item row carries its scoring
 * direction in the first cell.
 *
 * The page is Latin-1, so it is decoded as windows-1252.
 *
 * Run with: `bun run import:ipip-16pf`
 */
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

import { JSDOM } from "jsdom";

const ITEMS_URL = "https://ipip.ori.org/new16PFKey.htm";
const TABLE_URL = "https://ipip.ori.org/new16PFTable.htm";
const OUTPUT_PATH = new URL(
  "../app/content/instruments/ipip-16pf.json",
  import.meta.url
).pathname;

type Polarity = "negative" | "positive";

interface ParsedItem {
  domainId: string;
  polarity: Polarity;
  text: string;
}

interface ParsedScale {
  alpha: number;
  domainId: string;
  items: ParsedItem[];
}

interface ScaleCopy {
  description: string;
  high: string;
  low: string;
  name: string;
}

const SCALE_COPY: Record<string, ScaleCopy> = {
  anxiety: {
    description:
      "The tendency to worry, to feel threatened, and to hold on to mistakes.",
    high: "High scorers tend to worry, to feel easily hurt, and to dwell on past mistakes.",
    low: "Low scorers tend to feel at ease, to shake off setbacks, and to worry little.",
    name: "Anxiety",
  },
  assertiveness: {
    description:
      "The tendency to take charge, to state a position, and to lead.",
    high: "High scorers tend to lead, to take charge, and to say what they think.",
    low: "Low scorers tend to defer, to follow, and to let others decide.",
    name: "Assertiveness",
  },
  complexity: {
    description:
      "The tendency to look for new ideas, variety, and a deeper meaning.",
    high: "High scorers tend to enjoy new ideas, variety, and abstract questions.",
    low: "Low scorers tend to prefer routine, familiar answers, and practical questions.",
    name: "Complexity",
  },
  distrust: {
    description:
      "The tendency to suspect other people and to stay watchful of them.",
    high: "High scorers tend to be wary, to look for hidden motives, and to hold back trust.",
    low: "Low scorers tend to trust people, to assume good will, and to take what they say at face value.",
    name: "Distrust",
  },
  dutifulness: {
    description:
      "The tendency to follow rules, to respect authority, and to keep to a duty.",
    high: "High scorers tend to follow rules, to respect authority, and to take duties seriously.",
    low: "Low scorers tend to question rules, to resist authority, and to make their own terms.",
    name: "Dutifulness",
  },
  "emotional-stability": {
    description:
      "The tendency to stay steady, rather than to swing with mood and stress.",
    high: "High scorers tend to stay calm, to recover from setbacks, and to keep an even mood.",
    low: "Low scorers tend to feel their moods move quickly, and to be shaken by setbacks.",
    name: "Emotional Stability",
  },
  emotionality: {
    description:
      "The tendency to irritation, anger, and impatience with others.",
    high: "High scorers tend to be quick to irritation, anger, and impatience.",
    low: "Low scorers tend to stay even-tempered and to forgive easily.",
    name: "Emotionality",
  },
  friendliness: {
    description:
      "The tendency to approach other people with confidence and to start contact.",
    high: "High scorers tend to approach people easily, to start conversations, and to enjoy attention.",
    low: "Low scorers tend to hold back in unfamiliar company and to stay in the background.",
    name: "Friendliness",
  },
  gregariousness: {
    description:
      "The tendency to seek lively company, amusement, and high spirits.",
    high: "High scorers tend to be lively, playful, and drawn to a crowd.",
    low: "Low scorers tend to be subdued, quiet, and less drawn to noisy company.",
    name: "Gregariousness",
  },
  imagination: {
    description:
      "The tendency to live in thought, fantasy, and unconventional ideas.",
    high: "High scorers tend to daydream, to think in images, and to be drawn to the unusual.",
    low: "Low scorers tend to stay practical, conventional, and grounded in the present.",
    name: "Imagination",
  },
  intellect: {
    description: "The tendency to reason, to analyse, and to work with ideas.",
    high: "High scorers tend to think quickly, to analyse problems, and to work well with ideas.",
    low: "Low scorers tend to prefer the concrete and the familiar over abstract reasoning.",
    name: "Intellect",
  },
  introversion: {
    description: "The tendency to prefer your own company and to work alone.",
    high: "High scorers tend to want quiet, to prefer working alone, and to enjoy solitude.",
    low: "Low scorers tend to seek company, to prefer teamwork, and to enjoy company.",
    name: "Introversion",
  },
  orderliness: {
    description:
      "The tendency to order your surroundings and to want things exactly right.",
    high: "High scorers tend to be neat, exacting, and quick to finish a task properly.",
    low: "Low scorers tend to tolerate disorder and to put off tasks that do not hold their interest.",
    name: "Orderliness",
  },
  reserve: {
    description:
      "The tendency to keep your own thoughts and feelings to yourself.",
    high: "High scorers tend to reveal little about themselves and to keep their feelings private.",
    low: "Low scorers tend to talk openly about themselves and to show their feelings.",
    name: "Reserve",
  },
  sensitivity: {
    description:
      "The tendency to notice feeling and aesthetic qualities, in yourself and in what you read or watch.",
    high: "High scorers tend to notice feeling and aesthetic detail, and to respond to art and to others.",
    low: "Low scorers tend to stay practical, unsentimental, and unmoved by artistic detail.",
    name: "Sensitivity",
  },
  warmth: {
    description:
      "The tendency to feel concern for other people and to show it in how you treat them.",
    high: "High scorers tend to be attentive, warm, and interested in other people.",
    low: "Low scorers tend to keep their distance, and to stay formal and reserved with others.",
    name: "Warmth",
  },
};

const domainIdOf = (label: string) =>
  label.toLowerCase().replaceAll(/[^a-z]+/gu, "-");

/** The first cell of an item row holds "+ keyed" or the en dash form. */
const polarityOf = (key: string): Polarity | null => {
  if (key.startsWith("+")) {
    return "positive";
  }
  if (key.startsWith("\u2013") || key.startsWith("-")) {
    return "negative";
  }
  return null;
};

const readable = (value: string) => value.replaceAll(/\s+/gu, " ").trim();

interface TableRow {
  expectedItems: number;
  label: string;
  name: string;
}

/** The comparison table states the item count and the 16PF factor name. */
const parseTable = (html: string): TableRow[] =>
  [...new JSDOM(html).window.document.querySelectorAll("tr")].flatMap((row) => {
    const cells = [...row.querySelectorAll("td")].map((cell) =>
      readable(cell.textContent ?? "")
    );

    if (cells.length < 2) {
      return [];
    }

    const [name, factor, counts] = cells;
    const countMatch =
      /(?<positive>\d+)\s*\+\s*(?<negative>\d+)\s*=\s*(?<total>\d+)/u.exec(
        counts ?? ""
      );

    if (!(name && factor && countMatch?.groups)) {
      return [];
    }

    return [
      {
        expectedItems: Number(countMatch.groups.total),
        label: name,
        name: factor.replaceAll(/\s*\([A-Z0-9]+\)\s*/gu, "").trim(),
      },
    ];
  });

const parseScales = (html: string): ParsedScale[] => {
  const { document } = new JSDOM(html).window;

  // The source nests each item table inside the scale heading cell, so the
  // innermost tables in document order follow the heading order.
  return [...document.querySelectorAll("table")].flatMap((table) => {
    if (table.querySelector("table")) {
      return [];
    }

    const heading = readable(table.closest("td")?.textContent ?? "");
    const headingMatch =
      /^(?<label>[A-Z][A-Z ]+?)\s*\(.*?\)\s*\[(?:IPIP Scale Alpha\s*=\s*)?\.(?<alpha>\d+)\]/u.exec(
        heading
      );

    if (!(headingMatch?.groups?.label && headingMatch.groups.alpha)) {
      return [];
    }

    const domainId = domainIdOf(headingMatch.groups.label);
    // Only the first row of a keyed group repeats the marker, so the last
    // marker seen applies to the rows below it.
    let polarity: Polarity | null = null;
    const items: ParsedItem[] = [];

    for (const row of table.querySelectorAll("tr")) {
      const cells = [...row.querySelectorAll("td")];
      const text = readable(cells[1]?.textContent ?? "");

      polarity = polarityOf(readable(cells[0]?.textContent ?? "")) ?? polarity;

      if (polarity && text) {
        items.push({ domainId, polarity, text });
      }
    }

    return [
      { alpha: Number(`0.${headingMatch.groups.alpha}`), domainId, items },
    ];
  });
};

const assertParsed = (scales: ParsedScale[], table: TableRow[]) => {
  const problems: string[] = [];
  const texts = new Set<string>();

  if (scales.length !== 16) {
    problems.push(`expected 16 scales, found ${scales.length}`);
  }
  if (table.length !== 16) {
    problems.push(`expected 16 comparison rows, found ${table.length}`);
  }

  for (const [index, scale] of scales.entries()) {
    const expected = table[index];

    if (!expected) {
      problems.push(`no comparison row for ${scale.domainId}`);
      continue;
    }

    if (
      expected.label.toLowerCase().replaceAll(/[^a-z]+/gu, "-") !==
      scale.domainId
    ) {
      problems.push(
        `scale ${scale.domainId} does not match comparison row ${expected.label}`
      );
    }
    if (expected.expectedItems !== scale.items.length) {
      problems.push(
        `${scale.domainId} has ${scale.items.length} items, the table states ${expected.expectedItems}`
      );
    }
    if (!SCALE_COPY[scale.domainId]) {
      problems.push(`no wording for ${scale.domainId}`);
    }

    for (const item of scale.items) {
      if (texts.has(item.text)) {
        problems.push(`duplicate item text: ${item.text}`);
      }
      texts.add(item.text);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Sources did not parse as expected:\n- ${problems.join("\n- ")}`
    );
  }
};

const formatOutput = () => {
  execFileSync("bunx", ["oxfmt", "--write", OUTPUT_PATH], { stdio: "inherit" });
};

const fetchText = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return new TextDecoder("windows-1252").decode(await response.arrayBuffer());
};

const [itemsHtml, tableHtml] = await Promise.all([
  fetchText(ITEMS_URL),
  fetchText(TABLE_URL),
]);

const parsed = parseScales(itemsHtml);
const table = parseTable(tableHtml);

assertParsed(parsed, table);

const domains = parsed.map((scale) => ({
  bands: [],
  description: SCALE_COPY[scale.domainId]?.description ?? "",
  facetIds: [] as string[],
  high: SCALE_COPY[scale.domainId]?.high ?? "",
  id: scale.domainId,
  low: SCALE_COPY[scale.domainId]?.low ?? "",
  name: SCALE_COPY[scale.domainId]?.name ?? scale.domainId,
}));

const items = parsed.flatMap((scale) =>
  scale.items.map((item, index) => ({
    ...item,
    id: `${scale.domainId}-${String(index + 1).padStart(2, "0")}`,
  }))
);

const instrument = {
  category: "personality",
  citation:
    "Goldberg, L. R. (1999). A broad-bandwidth, public domain, personality inventory measuring the lower-level facets of several five-factor models. In I. Mervielde, I. Deary, F. De Fruyt, & F. Ostendorf (Eds.), Personality psychology in Europe (Vol. 7, pp. 7-28). Tilburg University Press.",
  description:
    "A public-domain inventory with sixteen scales, built from IPIP items that measure constructs similar to the 16 Personality Factor Questionnaire.",
  domains,
  evidence: {
    limitations:
      "These are IPIP scales that resemble the 16PF scales. They are not the 16PF Questionnaire and are not a substitute for it. The scales come from an older factor model, and the IPIP project publishes no population norms, so this site reports raw scores only.",
    referenceIds: ["goldberg-1999", "ipip-key", "ipip", "ipip-table"],
    reliability: parsed.map((scale) => ({
      alpha: scale.alpha,
      referenceId: "ipip-key",
      sampleN: null,
      scale: scale.domainId,
    })),
    reported: true,
    validity: [
      {
        kind: "convergent",
        referenceId: "ipip-table",
        summary:
          "Each IPIP scale correlates with the matching 16PF scale in the Eugene-Springfield community sample.",
      },
      {
        kind: "factor",
        referenceId: "goldberg-1999",
        summary:
          "The scales were keyed from an item pool built to cover the lower-level facets of several five-factor models.",
      },
    ],
  },
  facets: [] as {
    description: string;
    domainId: string;
    id: string;
    name: string;
  }[],
  id: "ipip-16pf",
  info: {
    audience:
      "Adults who want a detailed look at sixteen traits, rather than a short summary.",
    authors: "Lewis R. Goldberg; IPIP contributor John A. Johnson",
    durationMinutes: { max: 15, min: 10 },
    notFor: [
      "A diagnosis.",
      "A clinical assessment.",
      "A measure of ability or intelligence.",
      "A replacement for the commercial 16 Personality Factor Questionnaire.",
      "A comparison against a population.",
    ],
    originalLanguage: "en",
    responseScale:
      "A five-point accuracy scale, from Very Inaccurate to Very Accurate.",
    whatYouGet: [
      "A score for each of the 16 scales.",
      "A short description of what a high score and a low score mean.",
      "A link that shares your result and a file that saves it.",
    ],
    year: 1999,
  },
  instructions:
    "Describe yourself as you generally are now, not as you wish to be in the future. Describe yourself as you honestly see yourself in relation to other people you know of the same sex as you are, and roughly your same age. There are no right or wrong answers.",
  items,
  license: "Public domain",
  licenseNotes:
    "The IPIP items are in the public domain. Copy, edit, translate, and use them for any purpose without permission and without a fee.",
  norms: null,
  references: [
    {
      authors: "Goldberg, L. R.",
      doi: null,
      id: "goldberg-1999",
      source:
        "In I. Mervielde, I. Deary, F. De Fruyt, & F. Ostendorf (Eds.), Personality psychology in Europe (Vol. 7, pp. 7-28). Tilburg University Press",
      title:
        "A broad-bandwidth, public domain, personality inventory measuring the lower-level facets of several five-factor models",
      year: 1999,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip-key",
      source: ITEMS_URL,
      title: "16PF preliminary IPIP items and scoring key",
      year: 2026,
    },
    {
      authors: "International Personality Item Pool",
      doi: null,
      id: "ipip-table",
      source: TABLE_URL,
      title: "16PF comparison table",
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
  slug: "sixteen-factor-ipip",
  sourceUrl: ITEMS_URL,
  summary: "163 items across 16 personality scales.",
  title: "Sixteen-factor personality test (IPIP)",
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(instrument, null, 2)}\n`);
formatOutput();

console.log(
  `Wrote ${OUTPUT_PATH}\n` +
    `  domains: ${instrument.domains.length}\n` +
    `  items: ${instrument.items.length}\n` +
    `  alphas: ${instrument.evidence.reliability.map((entry) => entry.alpha).join(", ")}`
);
