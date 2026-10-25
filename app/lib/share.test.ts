import { describe, expect, it } from "vitest";

import { instruments, requireInstrument } from "~/lib/instruments/registry";
import type { Answers } from "~/lib/scoring/score";

import {
  answersFromShare,
  answersShare,
  decodeShare,
  domainScoresFromShare,
  encodeShare,
  facetScoresFromShare,
  readShareCode,
  scoresShare,
  shareFor,
  shareUrlFor,
} from "./share";

const instrument = requireInstrument("big-five-ipip-neo-120");
const shortInstrument = requireInstrument("big-five-ipip-50");

const answers = (target = instrument): Answers => {
  const result: Answers = {};

  for (const [index, item] of target.items.entries()) {
    result[item.id] =
      target.scale.min + (index % (target.scale.max - target.scale.min + 1));
  }

  return result;
};

const facetRaw = () => {
  const raw: Record<string, number> = {};

  for (const [index, facet] of instrument.facets.entries()) {
    raw[facet.id] = 8 + (index % 9);
  }

  return raw;
};

const domainRaw = () => {
  const raw: Record<string, number> = {};

  for (const [index, domain] of shortInstrument.domains.entries()) {
    raw[domain.id] = 30 + index;
  }

  return raw;
};

const answersCode = (target = instrument) =>
  encodeShare(target, answersShare(target, answers(target)));

const decode = (code: string, target = instrument) => decodeShare(code, target);

describe(encodeShare, () => {
  it("keeps an answer set inside a URL", () => {
    // 120 answers at three bits each is 45 bytes. With the header and the
    // instrument id, the code lands near 80 base64url characters.
    expect(answersCode().length).toBeLessThanOrEqual(80);
  });

  it("keeps the 50-item answer set compact", () => {
    expect(answersCode(shortInstrument).length).toBeLessThan(60);
  });

  it("keeps a scores-only set short", () => {
    const code = encodeShare(instrument, scoresShare(instrument, facetRaw()));

    expect(code.length).toBeLessThanOrEqual(48);
  });

  it("fits a whole share link in a message", () => {
    const url = shareUrlFor(instrument.slug, answersCode());

    expect(url.length).toBeLessThan(140);
  });
});

describe("answer round trip", () => {
  it.each(instruments)("returns the same answers for $title", (target) => {
    const original = answers(target);
    const payload = decode(answersCode(target), target);

    expect(payload ? answersFromShare(payload, target) : null).toStrictEqual(
      original
    );
  });
});

describe("score round trip", () => {
  it("returns the same facet scores", () => {
    const original = facetRaw();
    const payload = decode(
      encodeShare(instrument, scoresShare(instrument, original))
    );
    const decoded = payload ? facetScoresFromShare(payload, instrument) : null;

    expect(payload?.mode).toBe("scores");
    expect(decoded).toStrictEqual(original);
  });

  it("keeps a thirteen-item scale sum above 63 intact", () => {
    // The sixteen-factor test has a thirteen-item scale, so its sum reaches 65.
    // Six bits stop at 63, which would corrupt the top of that scale.
    const wide = requireInstrument("sixteen-factor-ipip");
    const topOf = (domainId: string) =>
      wide.items.filter((item) => item.domainId === domainId).length *
      wide.scale.max;
    const original = Object.fromEntries(
      wide.domains.map((domain) => [domain.id, topOf(domain.id)])
    );
    const payload = decode(
      encodeShare(
        wide,
        shareFor(wide, {
          domains: wide.domains.map((domain) => ({
            domain,
            score: { max: topOf(domain.id), min: 10, raw: topOf(domain.id) },
          })),
        })
      ),
      wide
    );

    expect(payload ? domainScoresFromShare(payload, wide) : null).toStrictEqual(
      original
    );
  });

  it("keeps a domain sum above 31 intact", () => {
    // Ten items on a five-point scale reach 50, which needs six bits. A
    // five-bit payload would corrupt every value above 31.
    const original = domainRaw();
    const payload = decode(
      encodeShare(
        shortInstrument,
        shareFor(shortInstrument, {
          domains: shortInstrument.domains.map((domain) => ({
            domain,
            score: { max: 50, min: 10, raw: original[domain.id] ?? 0 },
          })),
        })
      ),
      shortInstrument
    );
    const decoded = payload
      ? domainScoresFromShare(payload, shortInstrument)
      : null;

    expect(decoded).toStrictEqual(original);
  });
});

describe(decodeShare, () => {
  it("rejects an empty code", () => {
    expect(decode("")).toBeNull();
  });

  it("rejects a code with characters outside the alphabet", () => {
    expect(decode("not a code!")).toBeNull();
  });

  it("rejects a code that is too short", () => {
    expect(decode("AQ")).toBeNull();
  });

  it("rejects a code from another instrument", () => {
    expect(decode(answersCode(shortInstrument), instrument)).toBeNull();
  });

  it("reports the instrument id from the code", () => {
    const payload = decode(answersCode());

    expect(payload?.instrumentId).toBe("ipip-neo-120");
  });
});

describe(answersFromShare, () => {
  it("rejects a payload with the wrong number of values", () => {
    const payload = decode(
      encodeShare(instrument, scoresShare(instrument, facetRaw()))
    );

    expect(payload ? answersFromShare(payload, instrument) : null).toBeNull();
  });

  it("rejects a value outside the scale", () => {
    const payload = decode(answersCode());
    const corrupted = payload
      ? { ...payload, values: payload.values.map(() => 9) }
      : null;

    expect(
      corrupted ? answersFromShare(corrupted, instrument) : null
    ).toBeNull();
  });
});

describe(facetScoresFromShare, () => {
  it("rejects a payload built from answers", () => {
    const payload = decode(answersCode());

    expect(
      payload ? facetScoresFromShare(payload, instrument) : null
    ).toBeNull();
  });

  it("rejects a score above the facet maximum", () => {
    const payload = decode(
      encodeShare(instrument, scoresShare(instrument, facetRaw()))
    );
    const corrupted = payload
      ? { ...payload, values: payload.values.map(() => 31) }
      : null;

    expect(
      corrupted ? facetScoresFromShare(corrupted, instrument) : null
    ).toBeNull();
  });
});

describe(domainScoresFromShare, () => {
  it("reads domain sums for an instrument without facets", () => {
    const payload = decode(
      encodeShare(
        shortInstrument,
        shareFor(shortInstrument, {
          domains: shortInstrument.domains.map((domain) => ({
            domain,
            score: { max: 50, min: 10, raw: 30 },
          })),
        })
      ),
      shortInstrument
    );

    expect(
      payload ? domainScoresFromShare(payload, shortInstrument) : null
    ).toStrictEqual({
      agreeableness: 30,
      conscientiousness: 30,
      "emotional-stability": 30,
      extraversion: 30,
      intellect: 30,
    });
  });

  it("returns null for an instrument that has facets", () => {
    const payload = decode(
      encodeShare(instrument, scoresShare(instrument, facetRaw()))
    );

    expect(
      payload ? domainScoresFromShare(payload, instrument) : null
    ).toBeNull();
  });
});

describe(readShareCode, () => {
  it("reads a code from the fragment", () => {
    expect(readShareCode("#r=abc123")).toBe("abc123");
  });

  it("reads a code next to another fragment field", () => {
    expect(readShareCode("#x=1&r=abc123")).toBe("abc123");
  });

  it("returns null without a code", () => {
    expect(readShareCode("#other=1")).toBeNull();
    expect(readShareCode("")).toBeNull();
  });
});

describe(shareUrlFor, () => {
  it("builds a link that points at the instrument result and the fragment", () => {
    expect(shareUrlFor("a-test", "abc")).toBe(
      `${globalThis.location.origin}/tests/a-test/result#r=abc`
    );
  });
});
