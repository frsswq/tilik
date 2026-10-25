import type { Instrument } from "~/lib/instruments/schema";

const SHARED = {
  avatar: {
    accessory: "none" as const,
    colour: "blue" as const,
    eyes: "slant" as const,
    shape: "round" as const,
  },
  category: "personality",
  citation: "Fixture citation.",
  description: "Fixture description.",
  evidence: {
    limitations: null,
    referenceIds: ["ref-1"],
    reported: true,
  },
  id: "fixture",
  info: {
    audience: "Fixture audience.",
    authors: "Fixture author",
    durationMinutes: { max: 2, min: 1 },
    notFor: ["It is not a diagnosis."],
    originalLanguage: "en" as const,
    responseScale: "A five-point scale.",
    whatYouGet: ["A score."],
    year: 2020,
  },
  instructions: "Answer honestly.",
  license: "Public domain",
  licenseNotes: "Fixture licence notes.",
  norms: null,
  references: [
    {
      authors: "Fixture author",
      doi: null,
      id: "ref-1",
      source: "Fixture source",
      title: "Fixture reference",
      year: 2020,
    },
  ],
  reporting: { mode: "descriptive" as const, note: "Fixture note." },
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
  summary: "Fixture summary.",
  title: "Fixture instrument",
};

/**
 * A small instrument with facets. It is deliberately different from the real
 * data, so a scoring test cannot pass by accident.
 */
export const fixtureInstrument: Instrument = {
  ...SHARED,
  domains: [
    {
      bands: [],

      description: "The first fixture domain.",
      facetIds: ["F1", "F2"],
      high: "High scorers do the first thing.",
      id: "D1",
      low: "Low scorers do the other thing.",
      name: "Domain one",
    },
  ],
  evidence: {
    ...SHARED.evidence,
    reliability: [
      { alpha: 0.8, referenceId: "ref-1", sampleN: 100, scale: "F1" },
      { alpha: 0.7, referenceId: "ref-1", sampleN: 100, scale: "F2" },
    ],
    validity: [
      {
        kind: "convergent",
        referenceId: "ref-1",
        summary: "Fixture validity.",
      },
    ],
  },
  facets: [
    {
      bands: [],

      description: "The first fixture facet.",
      domainId: "D1",
      id: "F1",
      name: "Facet one",
    },
    {
      bands: [],

      description: "The second fixture facet.",
      domainId: "D1",
      id: "F2",
      name: "Facet two",
    },
  ],
  items: [
    {
      domainId: "D1",
      facetId: "F1",
      id: "f1-1",
      polarity: "positive",
      text: "Item one.",
    },
    {
      domainId: "D1",
      facetId: "F1",
      id: "f1-2",
      polarity: "negative",
      text: "Item two.",
    },
    {
      domainId: "D1",
      facetId: "F2",
      id: "f2-1",
      polarity: "positive",
      text: "Item three.",
    },
    {
      domainId: "D1",
      facetId: "F2",
      id: "f2-2",
      polarity: "negative",
      text: "Item four.",
    },
  ],
  slug: "fixture",
  sourceUrl: "https://example.com/",
};

/**
 * A small instrument without facets, like the 50-item markers: every item
 * belongs to a domain directly.
 */
export const domainOnlyFixture: Instrument = {
  ...SHARED,
  domains: [
    {
      bands: [],

      description: "The first domain.",
      facetIds: [],
      high: "High scorers do the first thing.",
      id: "D1",
      low: "Low scorers do the other thing.",
      name: "Domain one",
    },
    {
      bands: [],

      description: "The second domain.",
      facetIds: [],
      high: "High scorers do the second thing.",
      id: "D2",
      low: "Low scorers avoid the second thing.",
      name: "Domain two",
    },
  ],
  evidence: {
    ...SHARED.evidence,
    reliability: [
      { alpha: 0.8, referenceId: "ref-1", sampleN: null, scale: "D1" },
      { alpha: 0.7, referenceId: "ref-1", sampleN: null, scale: "D2" },
    ],
    validity: [],
  },
  facets: [],
  id: "domain-only-fixture",
  items: [
    { domainId: "D1", id: "d1-1", polarity: "positive", text: "First one." },
    { domainId: "D1", id: "d1-2", polarity: "positive", text: "First two." },
    { domainId: "D1", id: "d1-3", polarity: "negative", text: "First three." },
    { domainId: "D2", id: "d2-1", polarity: "negative", text: "Second one." },
    { domainId: "D2", id: "d2-2", polarity: "negative", text: "Second two." },
    { domainId: "D2", id: "d2-3", polarity: "positive", text: "Second three." },
  ],
  slug: "domain-only-fixture",
  sourceUrl: "https://example.com/domain-only",
};
