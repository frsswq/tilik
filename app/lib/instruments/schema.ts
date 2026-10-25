import { z } from "zod";

export const LOCALES = ["en", "ms"] as const;

/**
 * The transport ceiling for a stored answer. The instrument scale is the real
 * bound, and scoring rejects a value outside it, so this only stops nonsense
 * from reaching the scoring engine.
 */
export const MAX_SCALE_VALUE = 10;

export const answerValueSchema = z.number().int().min(0).max(MAX_SCALE_VALUE);

export const bandSchema = z
  .object({
    description: z.string().min(1),
    label: z.string().min(1),
    max: z.number().int().min(0),
    min: z.number().int().min(0),
  })
  .strict();

export const localizedTextSchema = z
  .object({
    en: z.string().min(1),
    ms: z.string().min(1).optional(),
  })
  .strict();

const traitTextSchema = z
  .object({
    description: z.string().min(1),
    high: z.string().min(1),
    low: z.string().min(1),
    name: z.string().min(1),
  })
  .strict();

export const itemSchema = z
  .object({
    // A short inventory has no facets, so an item can belong to a domain
    // directly.
    domainId: z.string().min(1),
    facetId: z.string().min(1).optional(),
    id: z.string().min(1),
    polarity: z.enum(["negative", "positive"]),
    text: z.string().min(1),
  })
  .strict();

export const facetSchema = z
  .object({
    bands: z.array(bandSchema),
    description: z.string().min(1),
    domainId: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .strict();

export const domainSchema = traitTextSchema
  .extend({
    bands: z.array(bandSchema),
    facetIds: z.array(z.string().min(1)),
    id: z.string().min(1),
  })
  .strict();

export const referenceSchema = z
  .object({
    authors: z.string().min(1),
    doi: z.string().min(1).nullable(),
    id: z.string().min(1),
    source: z.string().min(1),
    title: z.string().min(1),
    year: z.number().int().min(1900).max(2100),
  })
  .strict();

export const reliabilitySchema = z
  .object({
    alpha: z.number().min(0).max(1).nullable(),
    referenceId: z.string().min(1),
    sampleN: z.number().int().positive().nullable(),
    scale: z.string().min(1),
  })
  .strict();

export const validitySchema = z
  .object({
    kind: z.enum([
      "content",
      "convergent",
      "criterion",
      "discriminant",
      "factor",
    ]),
    referenceId: z.string().min(1),
    summary: z.string().min(1),
  })
  .strict();

export const evidenceSchema = z
  .object({
    limitations: z.string().min(1).nullable(),
    reason: z.string().min(1).nullable().optional(),
    referenceIds: z.array(z.string().min(1)),
    reliability: z.array(reliabilitySchema),
    reported: z.boolean(),
    validity: z.array(validitySchema),
  })
  .strict();

export const instrumentInfoSchema = z
  .object({
    audience: z.string().min(1),
    authors: z.string().min(1),
    durationMinutes: z
      .object({
        max: z.number().int().positive(),
        min: z.number().int().positive(),
      })
      .strict(),
    notFor: z.array(z.string().min(1)).min(1),
    originalLanguage: z.enum(LOCALES),
    responseScale: z.string().min(1),
    whatYouGet: z.array(z.string().min(1)).min(1),
    year: z.number().int().min(1900).max(2100),
  })
  .strict();

export const reportingSchema = z
  .object({
    mode: z.enum(["descriptive", "normed"]),
    note: z.string().min(1),
  })
  .strict();

export const scaleSchema = z
  .object({
    id: z.string().min(1),
    labels: z.record(z.string().min(1), z.string().min(1)),
    max: z.number().int().min(1).max(MAX_SCALE_VALUE),
    min: z.number().int().min(0).max(MAX_SCALE_VALUE),
  })
  .strict()
  .superRefine((scale, context) => {
    if (scale.max <= scale.min) {
      context.addIssue({
        code: "custom",
        message: "scale.max must be greater than scale.min",
        path: ["max"],
      });
    }

    for (let value = scale.min; value <= scale.max; value += 1) {
      if (!scale.labels[String(value)]) {
        context.addIssue({
          code: "custom",
          message: `scale.labels has no text for ${value}`,
          path: ["labels"],
        });
      }
    }
  });

export const AVATAR_SHAPES = ["bun", "crest", "dome", "tall", "wide"] as const;

export const AVATAR_COLOURS = [
  "apricot",
  "clay",
  "lavender",
  "ochre",
  "plum",
  "rose",
  "sage",
  "slate",
] as const;

/**
 * Every instrument ships with an avatar: a head in profile that looks to the
 * right, after the two profiles in the Tilik mark. The field is required, so an
 * instrument without one fails the test run and the production build.
 */
export const avatarSchema = z
  .object({
    colour: z.enum(AVATAR_COLOURS),
    eye: z.enum(["closed", "dot", "ring"]),
    mark: z.enum(["blush", "brow", "freckles", "none"]),
    shape: z.enum(AVATAR_SHAPES),
  })
  .strict();

const instrumentObjectSchema = z
  .object({
    avatar: avatarSchema,
    category: z.string().min(1),
    citation: z.string().min(1),
    description: z.string().min(1),
    domains: z.array(domainSchema).min(1),
    evidence: evidenceSchema,
    // An instrument without facets, such as the 50-item markers, has none.
    facets: z.array(facetSchema),
    id: z.string().min(1),
    info: instrumentInfoSchema,
    instructions: z.string().min(1),
    items: z.array(itemSchema).min(1),
    license: z.string().min(1),
    licenseNotes: z.string().min(1),
    norms: z
      .object({
        sample: z
          .object({
            citation: z.string().min(1),
            description: z.string().min(1),
            n: z.number().int().positive(),
          })
          .strict(),
      })
      .loose()
      .nullable(),
    references: z.array(referenceSchema).min(1),
    reporting: reportingSchema,
    scale: scaleSchema,
    slug: z.string().min(1),
    sourceUrl: z.string().url(),
    summary: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

const duplicates = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) {
      return true;
    }
    seen.add(value);
    return false;
  });
};

type InstrumentInput = z.infer<typeof instrumentObjectSchema>;
type Report = (path: (string | number)[], message: string) => void;

const checkDuplicates = (instrument: InstrumentInput, report: Report) => {
  const groups: Record<string, string[]> = {
    domains: instrument.domains.map((domain) => domain.id),
    facets: instrument.facets.map((facet) => facet.id),
    items: instrument.items.map((item) => item.id),
    references: instrument.references.map((reference) => reference.id),
  };

  for (const [path, ids] of Object.entries(groups)) {
    for (const id of duplicates(ids)) {
      report([path], `duplicate id: ${id}`);
    }
  }
};

const checkHierarchy = (instrument: InstrumentInput, report: Report) => {
  const facetIds = new Set(instrument.facets.map((facet) => facet.id));
  const domainIds = new Set(instrument.domains.map((domain) => domain.id));
  const facetDomains = new Map(
    instrument.facets.map((facet) => [facet.id, facet.domainId])
  );

  for (const item of instrument.items) {
    if (!domainIds.has(item.domainId)) {
      report(["items"], `${item.id} points at unknown domain ${item.domainId}`);
    }

    if (item.facetId === undefined) {
      continue;
    }

    if (!facetIds.has(item.facetId)) {
      report(["items"], `${item.id} points at unknown facet ${item.facetId}`);
    } else if (facetDomains.get(item.facetId) !== item.domainId) {
      report(
        ["items"],
        `${item.id} lists domain ${item.domainId} but facet ${item.facetId} belongs to ${facetDomains.get(item.facetId)}`
      );
    }
  }

  for (const facet of instrument.facets) {
    if (!domainIds.has(facet.domainId)) {
      report(
        ["facets"],
        `${facet.id} points at unknown domain ${facet.domainId}`
      );
    }
    if (!instrument.items.some((item) => item.facetId === facet.id)) {
      report(["facets"], `${facet.id} has no items`);
    }
  }

  for (const domain of instrument.domains) {
    if (!instrument.items.some((item) => item.domainId === domain.id)) {
      report(["domains"], `${domain.id} has no items`);
    }
  }
};

const checkDomains = (instrument: InstrumentInput, report: Report) => {
  for (const domain of instrument.domains) {
    const declared = new Set(domain.facetIds);
    const actual = instrument.facets
      .filter((facet) => facet.domainId === domain.id)
      .map((facet) => facet.id);

    if (actual.length !== declared.size) {
      report(
        ["domains"],
        `${domain.id} declares ${declared.size} facets but ${actual.length} facets point at it`
      );
    }
    for (const facetId of actual) {
      if (!declared.has(facetId)) {
        report(["domains"], `${domain.id} does not list facet ${facetId}`);
      }
    }
  }

  const withFacets = instrument.domains.filter(
    (domain) => domain.facetIds.length > 0
  ).length;

  if (withFacets !== 0 && withFacets !== instrument.domains.length) {
    report(
      ["domains"],
      "an instrument cannot mix domains with facets and domains without them"
    );
  }
};

type Bands = InstrumentInput["domains"][number]["bands"];

/**
 * Bands, when they exist, must tile the whole score range with no gap and no
 * overlap, so a result can never fall outside a band.
 */
const checkBandCoverage = (
  bands: Bands,
  range: { max: number; min: number },
  label: string,
  report: Report
) => {
  if (bands.length === 0) {
    return;
  }

  let expected = range.min;

  for (const band of bands.toSorted((left, right) => left.min - right.min)) {
    if (band.min !== expected) {
      report(["bands"], `${label} bands must continue from ${expected}`);
      return;
    }
    expected = band.max + 1;
  }

  if (expected !== range.max + 1) {
    report(["bands"], `${label} bands must reach ${range.max}`);
  }
};

const checkBands = (instrument: InstrumentInput, report: Report) => {
  const rangeOf = (itemCount: number) => ({
    max: itemCount * instrument.scale.max,
    min: itemCount * instrument.scale.min,
  });
  const countItems = (
    predicate: (item: InstrumentInput["items"][number]) => boolean
  ) => instrument.items.filter(predicate).length;

  for (const facet of instrument.facets) {
    checkBandCoverage(
      facet.bands,
      rangeOf(countItems((item) => item.facetId === facet.id)),
      facet.id,
      report
    );
  }

  for (const domain of instrument.domains) {
    checkBandCoverage(
      domain.bands,
      rangeOf(countItems((item) => item.domainId === domain.id)),
      domain.id,
      report
    );
  }
};

const checkReferences = (instrument: InstrumentInput, report: Report) => {
  const known = new Set(instrument.references.map((reference) => reference.id));

  for (const entry of instrument.evidence.reliability) {
    if (!known.has(entry.referenceId)) {
      report(
        ["evidence", "reliability"],
        `${entry.scale} points at unknown reference ${entry.referenceId}`
      );
    }
  }
  for (const entry of instrument.evidence.validity) {
    if (!known.has(entry.referenceId)) {
      report(
        ["evidence", "validity"],
        `${entry.kind} points at unknown reference ${entry.referenceId}`
      );
    }
  }
  for (const referenceId of instrument.evidence.referenceIds) {
    if (!known.has(referenceId)) {
      report(["evidence", "referenceIds"], `unknown reference ${referenceId}`);
    }
  }
};

const checkEvidenceCompleteness = (
  instrument: InstrumentInput,
  report: Report
) => {
  if (
    instrument.evidence.reported &&
    instrument.evidence.reliability.length === 0
  ) {
    report(
      ["evidence", "reliability"],
      "reported evidence needs at least one reliability value"
    );
  }
  if (!instrument.evidence.reported && !instrument.evidence.reason) {
    report(["evidence", "reason"], "unreported evidence needs a reason");
  }
};

export const instrumentSchema = instrumentObjectSchema.superRefine(
  (instrument, context) => {
    const report: Report = (path, message) => {
      context.addIssue({ code: "custom", message, path });
    };

    checkDuplicates(instrument, report);
    checkHierarchy(instrument, report);
    checkDomains(instrument, report);
    checkBands(instrument, report);
    checkReferences(instrument, report);
    checkEvidenceCompleteness(instrument, report);
  }
);

export type Domain = z.infer<typeof domainSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Facet = z.infer<typeof facetSchema>;
export type Instrument = z.infer<typeof instrumentSchema>;
export type Avatar = z.infer<typeof avatarSchema>;
export type InstrumentInfo = z.infer<typeof instrumentInfoSchema>;
export type Item = z.infer<typeof itemSchema>;
export type AnswerValue = z.infer<typeof answerValueSchema>;
export type Band = z.infer<typeof bandSchema>;
export type Scale = z.infer<typeof scaleSchema>;
export type Locale = (typeof LOCALES)[number];
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type Reliability = z.infer<typeof reliabilitySchema>;
export type Validity = z.infer<typeof validitySchema>;

const formatIssues = (issues: { message: string; path: PropertyKey[] }[]) =>
  issues
    .map((issue) => `  ${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("\n");

/**
 * Parses one instrument. An invalid file throws, so a bad data file fails the
 * test run and the production build instead of reaching a visitor.
 */
export const parseInstrument = (
  raw: unknown,
  source = "unknown"
): Instrument => {
  const result = instrumentSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `Invalid instrument from ${source}:\n${formatIssues(result.error.issues)}`
    );
  }

  return result.data;
};
