import { describe, expect, it } from "vitest";

import { instruments } from "./registry";

describe("instrument registry", () => {
  it("gives every instrument its own avatar", () => {
    const keys = instruments.map(
      ({ avatar }) => `${avatar.shape} ${avatar.colour}`
    );

    expect(new Set(keys).size).toBe(instruments.length);
  });
});
