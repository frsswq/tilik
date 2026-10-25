import { Link } from "react-router";

import { instruments } from "~/lib/instruments/registry";

export const meta = () => [
  { title: "Methodology - Tilik" },
  {
    content:
      "How this site scores a test, why it reports no percentiles, and how an instrument enters the site.",
    name: "description",
  },
];

const instrumentNames = instruments.map((instrument) => instrument.title);

const Methodology = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10">
    <header className="flex flex-col gap-3">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Methodology
      </h1>
      <p className="text-muted-foreground max-w-prose text-pretty">
        Every instrument here comes from a published source, and the site scores
        it the way that source specifies.
      </p>
    </header>

    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        How a test is scored
      </h2>
      <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-5">
        <li>Each answer becomes a number from 1 to 5.</li>
        <li>
          A reverse-keyed item is mirrored, so 5 becomes 1 and 4 becomes 2.
        </li>
        <li>The answers of each facet are added up.</li>
        <li>The facets of each domain are added up.</li>
      </ol>
      <p className="max-w-prose">
        The site shows a raw score with its minimum and its maximum, for example
        16 of 20. The scoring code is a pure function, and the tests check it
        against the published scoring key.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        Why there are no percentiles
      </h2>
      <p className="max-w-prose">
        A percentile needs a reference sample. The International Personality
        Item Pool publishes no norms, and it advises against canned norms,
        because no internet sample is representative of a given visitor.
      </p>
      <p className="text-muted-foreground max-w-prose">
        This site therefore describes a score against the scale itself: above
        the midpoint, below it, or on it. It never ranks you against other
        people. The source statement is at{" "}
        <a
          className="underline underline-offset-4"
          href="https://ipip.ori.org/newNorms.htm"
          rel="noreferrer"
          target="_blank"
        >
          ipip.ori.org/newNorms.htm
        </a>
        .
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        How a test enters this site
      </h2>
      <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
        <li>
          The licence must be public domain, Creative Commons, or free with
          attribution. Research-only and unconfirmed licences are excluded.
        </li>
        <li>
          The licence text, the source link, and the citation live in the data
          file beside the items.
        </li>
        <li>
          The items, the scoring direction, and the reliability values are
          imported from the source instead of being typed by hand.
        </li>
        <li>
          The import fails when the source does not produce the expected item
          count, facet count, or reliability values.
        </li>
      </ul>
      <p className="text-muted-foreground max-w-prose">
        Instruments published here: {instrumentNames.join(", ")}.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        What the site does not claim
      </h2>
      <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
        <li>A result is not a diagnosis and not clinical advice.</li>
        <li>
          Self-report answers change with mood, context, and the order of the
          items.
        </li>
        <li>
          A reliability value describes a sample, not the accuracy of a single
          result.
        </li>
      </ul>
      <p className="max-w-prose">
        The full plan, including the licence review of every candidate
        instrument, is in{" "}
        <a
          className="underline underline-offset-4"
          href="https://github.com/frsswq/personality-test/blob/main/docs/PLAN.md"
          rel="noreferrer"
          target="_blank"
        >
          docs/PLAN.md
        </a>
        .
      </p>
    </section>

    <p>
      <Link className="underline underline-offset-4" to="/">
        Back to the tests
      </Link>
    </p>
  </main>
);

export default Methodology;
