import { expect, test } from "@playwright/test";

for (const width of [320, 1440]) {
  test(`landing previews fit without overlap at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ height: 900, width });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Meet yourself. Again." })
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const previews = page.getByRole("region", {
      name: /Five trait scores\.|I am the life of the party\.|Privacy reminder|Score reminder/u,
    });
    await expect(previews).toHaveCount(width >= 1280 ? 4 : 2);
    const geometry = await previews.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      })
    );
    for (const rect of geometry) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(width);
    }
    for (const [index, first] of geometry.entries()) {
      for (const second of geometry.slice(index + 1)) {
        const overlap =
          first.left < second.right &&
          first.right > second.left &&
          first.top < second.bottom &&
          first.bottom > second.top;
        expect(overlap).toBe(false);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      )
    ).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("a visitor completes a test and imports the downloaded result in a fresh browser context", async ({
  browser,
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("link", { exact: true, name: "Anxiety screen (GAD-7)" })
    .click();
  await page.getByRole("link", { exact: true, name: "Start the test" }).click();
  const answers = page.getByRole("radio", {
    exact: true,
    name: "Not at all",
  });
  await expect(answers).toHaveCount(7);
  for (const answer of await answers.all()) {
    // oxlint-disable-next-line no-await-in-loop -- Browser clicks must run in order.
    await answer.click();
  }
  await page.getByRole("button", { name: "See my result" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Your result" })
  ).toBeVisible();
  await expect(page.getByText("0 of 21", { exact: true })).toBeVisible();

  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result file" }).click();
  const filePath = testInfo.outputPath("gad-7-result.json");
  const download = await downloaded;
  await download.saveAs(filePath);

  const visitor = await browser.newContext();
  try {
    const imported = await visitor.newPage();
    await imported.goto(new URL("/", page.url()).href);
    await imported.locator('input[type="file"]').setInputFiles(filePath);
    await expect(
      imported.getByText("Shared result", { exact: true })
    ).toBeVisible();
    await expect(imported.getByText("0 of 21", { exact: true })).toBeVisible();
  } finally {
    await visitor.close();
  }
});
