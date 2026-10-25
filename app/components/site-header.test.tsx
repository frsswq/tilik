import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "~/components/site-header";
import { renderRoute } from "~/test/render-route";

describe(SiteHeader, () => {
  it("shows the Tilik home link and the test list action", () => {
    renderRoute(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Tilik" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "See the tests" })).toHaveAttribute(
      "href",
      "/#explore"
    );
  });
});
