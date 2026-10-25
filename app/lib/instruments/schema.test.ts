import { describe, expect, it } from "vitest";

import { fixtureInstrument } from "~/test/fixture-instrument";

import { parseInstrument } from "./schema";
import type { Instrument } from "./schema";

const first = <Value>(values: Value[]): Value => {
  const [value] = values;

  if (value === undefined) {
    throw new Error("Expected at least one value.");
  }

  return value;
};

const nth = <Value>(values: Value[], index: number): Value => {
  const value = values[index];

  if (value === undefined) {
    throw new Error(`Expected a value at index ${index}.`);
  }

  return value;
};

const withInstrument = (change: (instrument: Instrument) => unknown) => {
  const copy = structuredClone(fixtureInstrument);
  change(copy);
  return copy;
};

describe(parseInstrument, () => {
  it("accepts the fixture", () => {
    expect(() => parseInstrument(fixtureInstrument)).not.toThrow();
  });

  it("rejects a duplicate item id", () => {
    const broken = withInstrument((instrument) => {
      nth(instrument.items, 1).id = nth(instrument.items, 0).id;
    });

    expect(() => parseInstrument(broken)).toThrow(/duplicate id/u);
  });

  it("rejects an item that points at an unknown facet", () => {
    const broken = withInstrument((instrument) => {
      first(instrument.items).facetId = "F9";
    });

    expect(() => parseInstrument(broken)).toThrow(/unknown facet F9/u);
  });

  it("rejects a facet that points at an unknown domain", () => {
    const broken = withInstrument((instrument) => {
      first(instrument.facets).domainId = "D9";
    });

    expect(() => parseInstrument(broken)).toThrow(/unknown domain D9/u);
  });

  it("rejects a facet with no items", () => {
    const broken = withInstrument((instrument) => {
      instrument.items = instrument.items.filter(
        (item) => item.facetId === "F1"
      );
    });

    expect(() => parseInstrument(broken)).toThrow(/F2 has no items/u);
  });

  it("rejects a domain that does not list its facets", () => {
    const broken = withInstrument((instrument) => {
      first(instrument.domains).facetIds = ["F1"];
    });

    expect(() => parseInstrument(broken)).toThrow(/declares 1 facets but 2/u);
  });

  it("rejects reliability that points at a missing reference", () => {
    const broken = withInstrument((instrument) => {
      first(instrument.evidence.reliability).referenceId = "ref-9";
    });

    expect(() => parseInstrument(broken)).toThrow(/unknown reference ref-9/u);
  });

  it("rejects reported evidence with no reliability value", () => {
    const broken = withInstrument((instrument) => {
      instrument.evidence.reliability = [];
    });

    expect(() => parseInstrument(broken)).toThrow(
      /needs at least one reliability value/u
    );
  });

  it("rejects unreported evidence with no reason", () => {
    const broken = withInstrument((instrument) => {
      instrument.evidence.reported = false;
    });

    expect(() => parseInstrument(broken)).toThrow(/needs a reason/u);
  });

  it("accepts unreported evidence with a reason", () => {
    const broken = withInstrument((instrument) => {
      instrument.evidence.reported = false;
      instrument.evidence.reliability = [];
      instrument.evidence.reason = "No study has reported a value.";
    });

    expect(() => parseInstrument(broken)).not.toThrow();
  });

  it("rejects an unknown extra key", () => {
    const broken = withInstrument((instrument) => {
      (instrument as unknown as Record<string, unknown>).surprise = true;
    });

    expect(() => parseInstrument(broken)).toThrow(/Invalid instrument/u);
  });

  it("rejects a missing required field", () => {
    const broken = withInstrument((instrument) => {
      (instrument.info as unknown as Record<string, unknown>).audience =
        undefined;
    });

    expect(() => parseInstrument(broken)).toThrow(/Invalid instrument/u);
  });

  it("rejects an instrument without an avatar", () => {
    const broken = withInstrument((instrument) => {
      (instrument as unknown as Record<string, unknown>).avatar = undefined;
    });

    expect(() => parseInstrument(broken)).toThrow(/Invalid instrument/u);
  });
});
