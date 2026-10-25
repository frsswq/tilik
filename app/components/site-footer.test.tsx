import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "~/components/site-footer";
import { renderRoute } from "~/test/render-route";

describe(SiteFooter, () => {
  it("shows the Tilik home link", () => {
    renderRoute(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Tilik" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("links to the legal pages and the test list", () => {
    renderRoute(<SiteFooter />);

    expect(screen.getByRole("link", { name: "All tests" })).toHaveAttribute(
      "href",
      "/#explore"
    );
    expect(screen.getByRole("link", { name: "Methodology" })).toHaveAttribute(
      "href",
      "/methodology"
    );
    expect(screen.getByRole("link", { name: "Licences" })).toHaveAttribute(
      "href",
      "/licenses"
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(
      screen.getByRole("navigation", { name: "Footer" })
    ).toBeInTheDocument();
  });
});
