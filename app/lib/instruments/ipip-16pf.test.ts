import { describe, expect, it } from "vitest";

import { scoreInstrument } from "~/lib/scoring/score";

import { requireInstrument } from "./registry";
import type { AnswerValue } from "./schema";

const instrument = requireInstrument("sixteen-factor-ipip");

const itemsOf = (domainId: string) =>
  instrument.items.filter((item) => item.domainId === domainId);

const counted = (polarity: "negative" | "positive", domainId: string) =>
  itemsOf(domainId).filter((item) => item.polarity === polarity).length;

/**
 * The published comparison table states the keyed item count of every scale,
 * as "positive + negative = total".
 */
const publishedCounts: [
  domainId: string,
  positive: number,
  negative: number,
][] = [
  ["warmth", 7, 3],
  ["intellect", 8, 5],
  ["emotional-stability", 5, 5],
  ["assertiveness", 6, 4],
  ["gregariousness", 6, 4],
  ["dutifulness", 5, 5],
  ["friendliness", 5, 5],
  ["sensitivity", 6, 4],
  ["distrust", 6, 4],
  ["imagination", 7, 3],
  ["reserve", 5, 5],
  ["anxiety", 7, 3],
  ["complexity", 5, 5],
  ["introversion", 7, 3],
  ["orderliness", 5, 5],
  ["emotionality", 7, 3],
];

describe("IPIP sixteen-factor data", () => {
  it("has 163 items across 16 scales", () => {
    expect(instrument.items).toHaveLength(163);
    expect(instrument.domains).toHaveLength(16);
  });

  it("keeps the published keying of every scale", () => {
    const actual = publishedCounts.map(([domainId]) => [
      domainId,
      counted("positive", domainId),
      counted("negative", domainId),
    ]);

    expect(actual).toStrictEqual(publishedCounts);
  });

  it("publishes the alpha of every scale", () => {
    expect(
      instrument.evidence.reliability.map((entry) => entry.alpha)
    ).toStrictEqual([
      0.8, 0.76, 0.85, 0.81, 0.78, 0.84, 0.8, 0.73, 0.8, 0.8, 0.86, 0.8, 0.82,
      0.73, 0.81, 0.76,
    ]);
  });

  it("keeps the published reverse-keyed wording", () => {
    expect(counted("negative", "introversion")).toBe(3);
    expect(itemsOf("introversion").map((item) => item.text)).toContain(
      "Can't do without the company of others."
    );
  });

  it("scores every scale across its own range", () => {
    const top: Record<string, AnswerValue> = {};
    const bottom: Record<string, AnswerValue> = {};

    for (const item of instrument.items) {
      top[item.id] = item.polarity === "positive" ? 5 : 1;
      bottom[item.id] = item.polarity === "positive" ? 1 : 5;
    }

    const highest = scoreInstrument(instrument, top);
    const lowest = scoreInstrument(instrument, bottom);

    expect(highest.domains.intellect).toStrictEqual({
      max: 65,
      min: 13,
      raw: 65,
    });
    expect(lowest.domains.intellect).toStrictEqual({
      max: 65,
      min: 13,
      raw: 13,
    });
    expect(Object.keys(highest.domains)).toHaveLength(16);
  });

  it("publishes no norms and states the reason", () => {
    expect(instrument.norms).toBeNull();
    expect(instrument.reporting.mode).toBe("descriptive");
  });

  it("keeps the public-domain licence and the source link", () => {
    expect(instrument.license).toBe("Public domain");
    expect(instrument.sourceUrl).toBe("https://ipip.ori.org/new16PFKey.htm");
  });
});
