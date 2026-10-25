import { Link } from "react-router";

import { SiteLogo } from "~/components/site-logo";

/**
 * The footer carries the brand promise, the copyright line, and the only links
 * to the supporting pages. It closes with the hero's dot grid, a lavender
 * glow, and one thin purple dome.
 */
export const SiteFooter = () => (
  <footer>
    <div className="site-footer-top">
      <div className="site-footer-brand">
        <Link className="site-brand" to="/">
          <SiteLogo />
          <span>Tilik</span>
        </Link>
        <p className="site-footer-note">
          Free, open tests, scored on your device. Nothing you answer is sent
          anywhere.
        </p>
        <span className="site-footer-year">© 2026</span>
      </div>
      <nav aria-label="Footer" className="site-footer-cols">
        <div className="site-footer-col">
          <span>Tests</span>
          <Link to="/#explore">All tests</Link>
          <Link to="/methodology">Methodology</Link>
        </div>
        <div className="site-footer-col">
          <span>Site</span>
          <Link to="/licenses">Licences</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </nav>
    </div>
    <div aria-hidden="true" className="site-footer-glow">
      <i />
    </div>
  </footer>
);
