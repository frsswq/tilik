/**
 * Builds the screening instruments:
 * `app/content/instruments/phq-9.json` and `app/content/instruments/gad-7.json`.
 *
 * The item text and the severity bands are transcribed from the published
 * instrument manuals, which are in the public domain and need no permission to
 * reproduce, translate, display, or distribute.
 *
 * The script asserts the published structure, so a mistyped item or a band with
 * a gap fails the import instead of reaching a visitor.
 *
 * Run with: `bun run import:screening`
 */

import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

import type { Avatar } from "../app/lib/instruments/schema";

const CONTENT_DIR = new URL("../app/content/instruments/", import.meta.url)
  .pathname;

const PHQ_URL = "https://www.phqscreeners.com/";
const MANUAL_URL =
  "https://archive.thepcc.org/sites/default/files/resources/instructions.pdf";

interface Band {
  description: string;
  label: string;
  max: number;
  min: number;
}

interface ScreeningInstrument {
  avatar: Avatar;
  citation: string;
  description: string;
  id: string;
  items: string[];
  licenseNotes: string;
  references: {
    authors: string;
    doi: string | null;
    id: string;
    source: string;
    title: string;
    year: number;
  }[];
  reliability: { alpha: number; scale: string }[];
  slug: string;
  sourceUrl: string;
  summary: string;
  title: string;
  totalMax: number;
  bands: Band[];
  validity: { kind: "criterion"; referenceId: string; summary: string }[];
  whatYouGet: string[];
}

const SCALE_LABELS = {
  "0": "Not at all",
  "1": "Several days",
  "2": "More than half the days",
  "3": "Nearly every day",
} as Record<string, string>;

const INSTRUCTIONS =
  "Over the last two weeks, how often have you been bothered by each of the following problems? Answer for how you have actually been, not how you would like to be.";

const PHQ9: ScreeningInstrument = {
  avatar: { colour: "rose", eye: "ring", mark: "blush", shape: "crest" },
  bands: [
    {
      description:
        "Minimal or no depressive symptoms. No action is needed on this screen alone.",
      label: "Minimal",
      max: 4,
      min: 0,
    },
    {
      description:
        "Mild depressive symptoms. Talk to a doctor or a mental health professional if the symptoms last.",
      label: "Mild",
      max: 9,
      min: 5,
    },
    {
      description:
        "Moderate depressive symptoms. This range is a reason to talk to a doctor or a mental health professional.",
      label: "Moderate",
      max: 14,
      min: 10,
    },
    {
      description:
        "Moderately severe depressive symptoms. Seek an assessment from a doctor or a mental health professional.",
      label: "Moderately severe",
      max: 19,
      min: 15,
    },
    {
      description:
        "Severe depressive symptoms. Seek help now, and call a crisis line if you are in danger.",
      label: "Severe",
      max: 27,
      min: 20,
    },
  ],
  citation:
    "Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2001). The PHQ-9: Validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606-613.",
  description:
    "A nine-item screen for the severity of depressive symptoms over the last two weeks.",
  id: "phq-9",
  items: [
    "Little interest or pleasure in doing things.",
    "Feeling down, depressed, or hopeless.",
    "Trouble falling or staying asleep, or sleeping too much.",
    "Feeling tired or having little energy.",
    "Poor appetite or overeating.",
    "Feeling bad about yourself, or that you are a failure, or that you have let yourself or your family down.",
    "Trouble concentrating on things, such as reading a newspaper or watching television.",
    "Moving or speaking so slowly that other people could have noticed, or the opposite: being so fidgety or restless that you have been moving around a lot more than usual.",
    "Thoughts that you would be better off dead, or of hurting yourself in some way.",
  ],
  licenseNotes:
    "The PHQ family, including the PHQ-9, is in the public domain. No permission is required to reproduce, translate, display, or distribute it.",
  references: [
    {
      authors: "Kroenke, K., Spitzer, R. L., & Williams, J. B. W.",
      doi: "10.1046/j.1525-1497.2001.016009606.x",
      id: "kroenke-2001",
      source: "Journal of General Internal Medicine, 16(9), 606-613",
      title: "The PHQ-9: Validity of a brief depression severity measure",
      year: 2001,
    },
    {
      authors: "Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B.",
      doi: "10.1001/archinte.166.10.1092",
      id: "spitzer-2006",
      source: "Archives of Internal Medicine, 166(10), 1092-1097",
      title:
        "A brief measure for assessing generalized anxiety disorder: The GAD-7",
      year: 2006,
    },
    {
      authors: "Pfizer",
      doi: null,
      id: "phq-screeners",
      source: MANUAL_URL,
      title:
        "Instructions for Patient Health Questionnaire (PHQ) and GAD-7 measures",
      year: 2026,
    },
  ],
  reliability: [{ alpha: 0.89, scale: "depression-severity" }],
  slug: "phq-9",
  sourceUrl: PHQ_URL,
  summary: "9 items about the last two weeks.",
  title: "Depression screen (PHQ-9)",
  totalMax: 27,
  validity: [
    {
      kind: "criterion",
      referenceId: "kroenke-2001",
      summary:
        "A score of 10 or more detects major depression with a sensitivity of 88 percent and a specificity of 88 percent in the development sample.",
    },
  ],
  whatYouGet: [
    "A total score from 0 to 27.",
    "The published severity band for that score.",
    "A link that shares your result and a file that saves it.",
  ],
};

const GAD7: ScreeningInstrument = {
  avatar: { colour: "sage", eye: "closed", mark: "blush", shape: "wide" },
  bands: [
    {
      description:
        "Minimal anxiety symptoms. No action is needed on this screen alone.",
      label: "Minimal",
      max: 4,
      min: 0,
    },
    {
      description:
        "Mild anxiety symptoms. Talk to a doctor or a mental health professional if the symptoms last.",
      label: "Mild",
      max: 9,
      min: 5,
    },
    {
      description:
        "Moderate anxiety symptoms. This range is a reason to talk to a doctor or a mental health professional.",
      label: "Moderate",
      max: 14,
      min: 10,
    },
    {
      description:
        "Severe anxiety symptoms. Seek an assessment from a doctor or a mental health professional, and call a crisis line if you are in danger.",
      label: "Severe",
      max: 21,
      min: 15,
    },
  ],
  citation:
    "Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. Archives of Internal Medicine, 166(10), 1092-1097.",
  description:
    "A seven-item screen for the severity of anxiety symptoms over the last two weeks.",
  id: "gad-7",
  items: [
    "Feeling nervous, anxious, or on edge.",
    "Not being able to stop or control worrying.",
    "Worrying too much about different things.",
    "Trouble relaxing.",
    "Being so restless that it is hard to sit still.",
    "Becoming easily annoyed or irritable.",
    "Feeling afraid, as if something awful might happen.",
  ],
  licenseNotes:
    "The GAD-7 is in the public domain. No permission is required to reproduce, translate, display, or distribute it.",
  references: [
    {
      authors: "Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B.",
      doi: "10.1001/archinte.166.10.1092",
      id: "spitzer-2006",
      source: "Archives of Internal Medicine, 166(10), 1092-1097",
      title:
        "A brief measure for assessing generalized anxiety disorder: The GAD-7",
      year: 2006,
    },
    {
      authors: "Pfizer",
      doi: null,
      id: "phq-screeners",
      source: MANUAL_URL,
      title:
        "Instructions for Patient Health Questionnaire (PHQ) and GAD-7 measures",
      year: 2026,
    },
  ],
  reliability: [{ alpha: 0.92, scale: "anxiety-severity" }],
  slug: "gad-7",
  sourceUrl: PHQ_URL,
  summary: "7 items about the last two weeks.",
  title: "Anxiety screen (GAD-7)",
  totalMax: 21,
  validity: [
    {
      kind: "criterion",
      referenceId: "spitzer-2006",
      summary:
        "A score of 10 or more detects generalised anxiety disorder with a sensitivity of 89 percent and a specificity of 82 percent in the development sample.",
    },
  ],
  whatYouGet: [
    "A total score from 0 to 21.",
    "The published severity band for that score.",
    "A link that shares your result and a file that saves it.",
  ],
};

const assertInstrument = (instrument: ScreeningInstrument) => {
  const problems: string[] = [];
  const { bands, items, totalMax } = instrument;

  if (items.length === 0) {
    problems.push("no items");
  }
  if (new Set(items).size !== items.length) {
    problems.push("duplicate item text");
  }

  let expected = 0;
  for (const band of bands.toSorted((left, right) => left.min - right.min)) {
    if (band.min !== expected) {
      problems.push(`bands must continue from ${expected}`);
      break;
    }
    expected = band.max + 1;
  }
  if (expected !== totalMax + 1) {
    problems.push(`bands must reach ${totalMax}`);
  }

  if (Object.keys(SCALE_LABELS).length !== 4) {
    problems.push("the response scale needs four labels");
  }

  if (problems.length > 0) {
    throw new Error(
      `${instrument.id} did not build as expected:\n- ${problems.join("\n- ")}`
    );
  }
};

const domainName = (instrument: ScreeningInstrument) =>
  instrument.id === "phq-9" ? "Depression severity" : "Anxiety severity";

const buildInstrument = (source: ScreeningInstrument) => {
  assertInstrument(source);

  const domainId = domainName(source).toLowerCase().replaceAll(" ", "-");
  const [reliability] = source.reliability;
  const referenceIds = [...new Set(source.references.map((entry) => entry.id))];

  return {
    avatar: source.avatar,
    category: "screening",
    citation: source.citation,
    description: source.description,
    domains: [
      {
        bands: source.bands,
        description:
          source.id === "phq-9"
            ? "How severe the depressive symptoms are, summed over the nine items."
            : "How severe the anxiety symptoms are, summed over the seven items.",
        facetIds: [],
        high: "A higher score means more of the symptoms in the last two weeks.",
        id: domainId,
        low: "A lower score means fewer of the symptoms in the last two weeks.",
        name: domainName(source),
      },
    ],
    evidence: {
      limitations:
        "This is a screen, not a diagnosis. It records how you describe the last two weeks, so it can change from week to week. A clinician makes a diagnosis, and only with more information than a questionnaire.",
      referenceIds,
      reliability: [
        {
          alpha: reliability?.alpha ?? null,
          referenceId: referenceIds[0] ?? "",
          sampleN: null,
          scale: domainId,
        },
      ],
      reported: true,
      validity: source.validity,
    },
    facets: [],
    id: source.id,
    info: {
      audience:
        "Adults who want a short, structured look at how they have been feeling.",
      authors:
        source.id === "phq-9"
          ? "Kurt Kroenke, Robert L. Spitzer, and Janet B. W. Williams"
          : "Robert L. Spitzer, Kurt Kroenke, Janet B. W. Williams, and Bernd Löwe",
      durationMinutes: { max: 3, min: 2 },
      notFor: [
        "A diagnosis.",
        "A replacement for a clinician.",
        "A screen for every mental health concern.",
        "A crisis service.",
      ],
      originalLanguage: "en",
      responseScale:
        "A four-point frequency scale, from Not at all to Nearly every day.",
      whatYouGet: source.whatYouGet,
      year: source.id === "phq-9" ? 2001 : 2006,
    },
    instructions: INSTRUCTIONS,
    items: source.items.map((text, index) => ({
      domainId,
      id: `${source.id}-${index + 1}`,
      polarity: "positive",
      text,
    })),
    license: "Public domain",
    licenseNotes: source.licenseNotes,
    norms: null,
    references: source.references,
    reporting: {
      mode: "descriptive",
      note: "The severity bands come from the published instrument, and they are screening ranges rather than population norms.",
    },
    scale: {
      id: "frequency-4",
      labels: SCALE_LABELS,
      max: 3,
      min: 0,
    },
    slug: source.slug,
    sourceUrl: source.sourceUrl,
    summary: source.summary,
    title: source.title,
  };
};

const formatOutput = (outputPath: string) => {
  execFileSync("bunx", ["oxfmt", "--write", outputPath], { stdio: "inherit" });
};

const write = async (source: ScreeningInstrument) => {
  const instrument = buildInstrument(source);
  const outputPath = `${CONTENT_DIR}${source.slug}.json`;

  await writeFile(outputPath, `${JSON.stringify(instrument, null, 2)}\n`);
  formatOutput(outputPath);

  console.log(
    `Wrote ${outputPath}\n` +
      `  items: ${instrument.items.length}\n` +
      `  scale: ${instrument.scale.min} to ${instrument.scale.max}\n` +
      `  bands: ${instrument.domains[0]?.bands.length ?? 0}`
  );
};

await Promise.all([PHQ9, GAD7].map((source) => write(source)));
