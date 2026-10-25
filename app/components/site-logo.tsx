/**
 * The Tilik mark: two opposing profiles formed by positive and negative space.
 *
 * The mark sits on a 100 unit grid, the same grid as the favicon, and it fills
 * with `currentColor`, so the stylesheet owns the colour.
 */
export const SiteLogo = () => (
  <svg
    aria-hidden="true"
    className="site-logo"
    fill="currentColor"
    viewBox="0 0 100 100"
  >
    <path d="M48 12C26 12 12 28 12 49C12 69 25 83 44 88V68C34 67 29 63 30 58L37 56L32 50C31 43 36 38 44 37L48 12Z" />
    <path d="M52 88C74 88 88 72 88 51C88 31 75 17 56 12V32C66 33 71 37 70 42L63 44L68 50C69 57 64 62 56 63L52 88Z" />
  </svg>
);
