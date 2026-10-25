/**
 * Sends every request for the old `test.farissaifuddin.com` host to the site's
 * current address, so a link shared before the rename still opens.
 *
 * This script serves no content, and it stays separate from the main Worker,
 * because the main Worker does not run for static asset requests.
 * The response carries no fragment, so a browser keeps the fragment of the
 * original link, which is where a shared result lives.
 *
 * Deploy with `bun run deploy:redirect`.
 * Delete this script, its config, and the custom domain when old links no
 * longer matter.
 */
const SITE_ORIGIN = "https://tilik.farissaifuddin.com";

export default {
  fetch(request: Request): Response {
    try {
      const url = new URL(request.url);

      return Response.redirect(
        `${SITE_ORIGIN}${url.pathname}${url.search}`,
        301
      );
    } catch {
      // The runtime always hands over an absolute URL, so this only guards the
      // boundary instead of failing the request.
      return new Response("Bad request", { status: 400 });
    }
  },
};
