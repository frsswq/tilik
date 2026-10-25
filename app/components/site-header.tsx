import { cn } from "cn";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { SiteLogo } from "~/components/site-logo";
import { buttonVariants } from "~/components/ui/button";

export const SiteHeader = () => (
  <header className="site-header">
    <div className="site-header-inner">
      <Link className="site-brand" to="/">
        <SiteLogo />
        <span>Tilik</span>
      </Link>
      <nav aria-label="Main">
        <Link
          className={cn(
            buttonVariants({ size: "sm" }),
            "site-header-action gap-4 rounded-full px-4 has-data-[icon=inline-end]:pr-4"
          )}
          to="/#explore"
        >
          See the tests
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </nav>
    </div>
  </header>
);
