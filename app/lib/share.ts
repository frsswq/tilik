import type { AnswerValue, Instrument } from "~/lib/instruments/schema";
import type { Answers } from "~/lib/scoring/score";

/**
 * The share code packs a result into URL-safe base64. The fragment of a URL is
 * never sent to a server, so the answers stay with the link.
 *
 * The bit width follows the instrument, because a four-point frequency scale
 * needs two bits per item and a five-point accuracy scale needs three.
 */
export const SHARE_VERSION = 1;
const HEADER_BYTES = 3;
const MAX_ID_LENGTH = 64;

export type ShareMode = "answers" | "scores";

export interface SharePayload {
  instrumentId: string;
  mode: ShareMode;
  values: number[];
}

export const SHARE_MODES: Record<ShareMode, number> = {
  answers: 0,
  scores: 1,
};

const bitWidthFor = (valueCount: number) =>
  Math.max(1, Math.ceil(Math.log2(Math.max(2, valueCount))));

const answerBits = (instrument: Instrument) =>
  bitWidthFor(instrument.scale.max - instrument.scale.min + 1);

const maxScaleScore = (instrument: Instrument) => {
  const scores =
    instrument.facets.length > 0
      ? instrument.facets.map((facet) => {
          const items = instrument.items.filter(
            (item) => item.facetId === facet.id
          ).length;

          return items * instrument.scale.max;
        })
      : instrument.domains.map((domain) => {
          const items = instrument.items.filter(
            (item) => item.domainId === domain.id
          ).length;

          return items * instrument.scale.max;
        });

  return Math.max(...scores, 0);
};

const scoresBits = (instrument: Instrument) =>
  bitWidthFor(maxScaleScore(instrument) + 1);

const packValues = (values: number[], bits: number): Uint8Array => {
  const bytes = new Uint8Array(Math.ceil((values.length * bits) / 8));
  let offset = 0;

  for (const value of values) {
    for (let bit = bits - 1; bit >= 0; bit -= 1) {
      const on = Math.floor(value / 2 ** bit) % 2;
      const index = Math.floor(offset / 8);
      const position = 7 - (offset % 8);

      if (on === 1) {
        bytes[index] = (bytes[index] ?? 0) + 2 ** position;
      }
      offset += 1;
    }
  }

  return bytes;
};

const unpackValues = (
  bytes: Uint8Array,
  count: number,
  bits: number
): number[] => {
  const values: number[] = [];
  let offset = 0;

  for (let index = 0; index < count; index += 1) {
    let value = 0;

    for (let bit = 0; bit < bits; bit += 1) {
      const byteIndex = Math.floor(offset / 8);
      const position = 7 - (offset % 8);
      const on = Math.floor((bytes[byteIndex] ?? 0) / 2 ** position) % 2;
      value = value * 2 + on;
      offset += 1;
    }

    values.push(value);
  }

  return values;
};

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

const fromBase64Url = (code: string): Uint8Array | null => {
  if (!/^[\w-]+$/u.test(code)) {
    return null;
  }

  try {
    const padded = code
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(code.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.codePointAt(index) ?? 0;
    }

    return bytes;
  } catch {
    return null;
  }
};

const encode = (
  instrumentId: string,
  mode: ShareMode,
  values: number[],
  bits: number
) => {
  const idBytes = new TextEncoder().encode(instrumentId);
  const body = packValues(values, bits);
  const bytes = new Uint8Array(HEADER_BYTES + idBytes.length + body.length);

  bytes[0] = SHARE_VERSION;
  bytes[1] = SHARE_MODES[mode];
  bytes[2] = idBytes.length;
  bytes.set(idBytes, HEADER_BYTES);
  bytes.set(body, HEADER_BYTES + idBytes.length);

  return toBase64Url(bytes);
};

/**
 * Reads exactly the instrument's item or scale count, so byte padding cannot
 * become extra answers. Returns `null` when the body length is wrong or the
 * code belongs to another instrument.
 */
export const decodeShare = (
  code: string,
  instrument: Instrument
): SharePayload | null => {
  const bytes = fromBase64Url(code);

  if (!bytes || bytes.length < HEADER_BYTES) {
    return null;
  }

  const [version, modeByte, idLength] = bytes;

  if (version !== SHARE_VERSION || idLength === undefined) {
    return null;
  }
  if (idLength === 0 || idLength > MAX_ID_LENGTH) {
    return null;
  }
  if (modeByte !== SHARE_MODES.answers && modeByte !== SHARE_MODES.scores) {
    return null;
  }

  const mode: ShareMode =
    modeByte === SHARE_MODES.answers ? "answers" : "scores";
  const bits =
    mode === "answers" ? answerBits(instrument) : scoresBits(instrument);
  const idEnd = HEADER_BYTES + idLength;

  if (bytes.length <= idEnd) {
    return null;
  }

  const instrumentId = new TextDecoder().decode(
    bytes.slice(HEADER_BYTES, idEnd)
  );

  if (instrumentId !== instrument.id) {
    return null;
  }

  const valueCount =
    mode === "answers"
      ? instrument.items.length
      : instrument.facets.length || instrument.domains.length;

  if (bytes.length !== idEnd + Math.ceil((valueCount * bits) / 8)) {
    return null;
  }

  const values = unpackValues(bytes.slice(idEnd), valueCount, bits);

  return { instrumentId, mode, values };
};

export const answersShare = (
  instrument: Instrument,
  answers: Answers
): SharePayload => ({
  instrumentId: instrument.id,
  mode: "answers",
  values: instrument.items.map(
    (item) => (answers[item.id] ?? instrument.scale.min) - instrument.scale.min
  ),
});

export const scoresShare = (
  instrument: Instrument,
  facetRaw: Record<string, number>
): SharePayload => ({
  instrumentId: instrument.id,
  mode: "scores",
  values: instrument.facets.map((facet) => facetRaw[facet.id] ?? 0),
});

/** For an instrument whose domains hold the items directly. */
export const domainScoresShare = (
  instrument: Instrument,
  domainRaw: Record<string, number>
): SharePayload => ({
  instrumentId: instrument.id,
  mode: "scores",
  values: instrument.domains.map((domain) => domainRaw[domain.id] ?? 0),
});

export const shareFor = (
  instrument: Instrument,
  report: {
    domains: { domain: { id: string }; score: { raw: number } }[];
    facets?: { facet: { id: string }; score: { raw: number } }[];
  }
): SharePayload => {
  const facetRaw: Record<string, number> = {};
  for (const entry of report.facets ?? []) {
    facetRaw[entry.facet.id] = entry.score.raw;
  }

  const domainRaw: Record<string, number> = {};
  for (const entry of report.domains) {
    domainRaw[entry.domain.id] = entry.score.raw;
  }

  return instrument.facets.length > 0
    ? scoresShare(instrument, facetRaw)
    : domainScoresShare(instrument, domainRaw);
};

export const encodeShare = (
  instrument: Instrument,
  payload: SharePayload
): string =>
  encode(
    payload.instrumentId,
    payload.mode,
    payload.values,
    payload.mode === "answers" ? answerBits(instrument) : scoresBits(instrument)
  );

export const answersFromShare = (
  payload: SharePayload,
  instrument: Instrument
): Answers | null => {
  if (
    payload.mode !== "answers" ||
    payload.values.length !== instrument.items.length
  ) {
    return null;
  }

  const answers: Answers = {};
  const spread = instrument.scale.max - instrument.scale.min;

  for (const [index, item] of instrument.items.entries()) {
    const value = payload.values[index];

    if (value === undefined || value < 0 || value > spread) {
      return null;
    }

    answers[item.id] = (value + instrument.scale.min) as AnswerValue;
  }

  return answers;
};

const scoresFromShare = (
  payload: SharePayload,
  instrument: Instrument,
  scales: { id: string; itemCount: number }[]
): Record<string, number> | null => {
  if (payload.mode !== "scores" || payload.values.length !== scales.length) {
    return null;
  }

  const scores: Record<string, number> = {};

  for (const [index, scale] of scales.entries()) {
    const value = payload.values[index];
    const min = scale.itemCount * instrument.scale.min;
    const max = scale.itemCount * instrument.scale.max;

    if (value === undefined || value < min || value > max) {
      return null;
    }

    scores[scale.id] = value;
  }

  return scores;
};

export const facetScoresFromShare = (
  payload: SharePayload,
  instrument: Instrument
): Record<string, number> | null =>
  scoresFromShare(
    payload,
    instrument,
    instrument.facets.map((facet) => ({
      id: facet.id,
      itemCount: instrument.items.filter((item) => item.facetId === facet.id)
        .length,
    }))
  );

/** For a scores-only link whose values are domain sums. */
export const domainScoresFromShare = (
  payload: SharePayload,
  instrument: Instrument
): Record<string, number> | null => {
  if (instrument.facets.length > 0) {
    return null;
  }

  return scoresFromShare(
    payload,
    instrument,
    instrument.domains.map((domain) => ({
      id: domain.id,
      itemCount: instrument.items.filter((item) => item.domainId === domain.id)
        .length,
    }))
  );
};

export const shareUrlFor = (slug: string, code: string) =>
  `${globalThis.location?.origin ?? ""}/tests/${slug}/result#r=${code}`;

export const readShareCode = (hash: string): string | null => {
  const match = /(?:^#|&)r=(?<code>[\w-]+)/u.exec(hash);

  return match?.groups?.code ?? null;
};
