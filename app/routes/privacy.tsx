import { Link } from "react-router";

export const meta = () => [
  { title: "Privacy - Tilik" },
  {
    content:
      "No account or email. Answers stay in your browser. Completed scores are stored for up to 90 days under a private code.",
    name: "description",
  },
];
const Privacy = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10">
    <header className="flex flex-col gap-3">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Privacy
      </h1>
      <p className="text-muted-foreground max-w-prose text-pretty">
        No login or account is needed. Your answers stay in your browser. When
        you complete a test, this site automatically stores your scores in
        Cloudflare D1, not your answers.
      </p>
    </header>
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        What is stored, and where
      </h2>
      <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
        <li>
          Your answers, progress, result history, and stored-result codes are
          saved in this browser, in local storage.
        </li>
        <li>
          Completed scores, including screening scores, are sent to a Cloudflare
          Worker and stored in Cloudflare D1. The row holds a random code, the
          test and scoring revision, score sums, a UTC day, and an expiry date.
        </li>
        <li>
          There is no account, email address, name, login, or tracking cookie.
          The result database does not store your IP address, user agent,
          location, or raw answers.
        </li>
        <li>
          Scores can still be sensitive personal information. Removing your name
          does not make a screening score harmless or guarantee anonymity.
        </li>
      </ul>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        Retention and deletion
      </h2>
      <p className="max-w-prose">
        A stored copy expires at midnight UTC, no later than 90 days after it
        was saved. Expired copies cannot be opened. A daily job deletes expired
        rows in bounded batches, so physical deletion can follow later if there
        is a backlog.
      </p>
      <p className="max-w-prose">
        Use Delete stored copy on the result page to remove the database row
        sooner. Anyone with the stored link can read or delete that copy.
        Cloudflare D1 recovery copies can retain deleted data for the platform
        recovery period, currently up to seven days on the free plan.
      </p>
      <p className="max-w-prose">
        Clearing browser data removes your local answers and history, but does
        not delete the server copy. Keep the stored link if you want to delete
        it later. Without a link or local copy, we cannot recover a result by
        identity because we do not collect one.
      </p>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        Sharing a result
      </h2>
      <p className="max-w-prose">
        A local share link carries the answers or scores after the{" "}
        <code>#</code> symbol. The server does not receive that fragment. These
        links and downloaded files still work without a database.
      </p>
      <p className="max-w-prose">
        A stored link carries only a random code in the fragment. Opening it
        makes a separate API request that sends the code to the server to
        retrieve the scores. API paths can appear in host request logs. We do
        not log result bodies, scores, or answers in application code.
      </p>
      <p className="text-muted-foreground max-w-prose">
        Treat every result link like a private key. Anyone who receives it can
        read the result. There is no public result directory or search.
      </p>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        Counts and service operation
      </h2>
      <p className="max-w-prose">
        The site owner can count stored completions and score distributions.
        These are unverified self-reports, not unique people, research samples,
        clinical records, or population norms. There is no advertising or
        cross-site tracking.
      </p>
      <p className="max-w-prose">
        Cloudflare receives network information, including an IP address, to
        serve and protect the site. That infrastructure data is separate from
        the result database. We cannot promise that hosting infrastructure
        records no identifying information.
      </p>
    </section>
    <p>
      <Link className="underline underline-offset-4" to="/">
        Back to the tests
      </Link>
    </p>
  </main>
);
export default Privacy;
