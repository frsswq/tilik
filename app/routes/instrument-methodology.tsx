import { Link, useParams } from "react-router";

import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { findInstrument } from "~/lib/instruments/registry";
import type { Instrument } from "~/lib/instruments/schema";

import type { Route } from "./+types/instrument-methodology";

export const meta = ({ params }: Route.MetaArgs) => {
  const instrument = params.slug ? findInstrument(params.slug) : undefined;

  if (!instrument) {
    return [{ title: "Test not found - Tilik" }];
  }

  return [
    { title: `Methodology: ${instrument.title} - Tilik` },
    {
      content: `Every item, the scoring direction, and the references for the ${instrument.title}.`,
      name: "description",
    },
  ];
};

interface ScaleGroup {
  description: string;
  id: string;
  items: Instrument["items"];
  name: string;
}

/** Groups the items by facet when the instrument has facets, else by domain. */
const scaleGroups = (instrument: Instrument): ScaleGroup[] => {
  if (instrument.facets.length > 0) {
    return instrument.facets.map((facet) => ({
      description: facet.description,
      id: facet.id,
      items: instrument.items.filter((item) => item.facetId === facet.id),
      name: facet.name,
    }));
  }

  return instrument.domains.map((domain) => ({
    description: domain.description,
    id: domain.id,
    items: instrument.items.filter((item) => item.domainId === domain.id),
    name: domain.name,
  }));
};

const NotFound = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
    <h1 className="font-heading text-2xl font-semibold">Test not found</h1>
    <Link className={buttonVariants()} to="/">
      See all tests
    </Link>
  </main>
);

const Methodology = ({ instrument }: { instrument: Instrument }) => {
  const groups = scaleGroups(instrument);
  const reverseKeyed = instrument.items.filter(
    (item) => item.polarity === "negative"
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10">
      <header className="flex flex-col gap-3">
        <Link
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
          to={`/tests/${instrument.slug}`}
        >
          {instrument.title}
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Methodology
        </h1>
        <p className="text-muted-foreground max-w-prose text-pretty">
          This page publishes every item, its scoring direction, and the source
          of each number that the test reports.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Scoring rule
        </h2>
        <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
          <li>{`${instrument.items.length} items, each answered from 1 to 5.`}</li>
          <li>{`${reverseKeyed} items are reverse keyed, so their answer is mirrored with 6 minus the answer.`}</li>
          <li>
            {`${groups.length} scales, ${groups[0]?.items.length ?? 0} items each.`}
          </li>
          <li>{`A scale score is the sum of its items, so it runs from ${(groups[0]?.items.length ?? 0) * 1} to ${(groups[0]?.items.length ?? 0) * 5}.`}</li>
          <li>
            {instrument.facets.length > 0
              ? "A domain score is the sum of its facet scores."
              : "A domain score is the sum of its own items."}
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Items and scoring key
        </h2>
        {groups.map((group) => (
          <article className="flex flex-col gap-3" key={group.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-semibold">
                {group.name}
              </h3>
              <Badge variant="outline">{group.id}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{group.description}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.text}</TableCell>
                    <TableCell className="text-right">
                      {item.polarity === "negative" ? "reverse" : "direct"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Sources
        </h2>
        <ul className="flex flex-col gap-3">
          {instrument.references.map((reference) => (
            <li key={reference.id}>
              {`${reference.authors} (${reference.year}). ${reference.title}. ${reference.source}.`}
              {reference.doi ? (
                <>
                  {" "}
                  <a
                    className="underline underline-offset-4"
                    href={`https://doi.org/${reference.doi}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    doi:{reference.doi}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">
          The instrument data file is rebuilt from these sources by a script in
          this repository, and the build fails when a count or a value does not
          match what the source states.
        </p>
      </section>
    </main>
  );
};

const MethodologyRoute = () => {
  const { slug } = useParams();
  const instrument = slug ? findInstrument(slug) : undefined;

  if (!instrument) {
    return <NotFound />;
  }

  return <Methodology instrument={instrument} />;
};

export default MethodologyRoute;
