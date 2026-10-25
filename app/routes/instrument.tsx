import { Link, useParams } from "react-router";

import { InstrumentAvatar } from "~/components/instrument-avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { findCategory } from "~/lib/categories";
import { findInstrument } from "~/lib/instruments/registry";
import type { Instrument } from "~/lib/instruments/schema";

import type { Route } from "./+types/instrument";

export const meta = ({ params }: Route.MetaArgs) => {
  const instrument = params.slug ? findInstrument(params.slug) : undefined;

  if (!instrument) {
    return [{ title: "Test not found - Tilik" }];
  }

  return [
    { title: `${instrument.title} - Tilik` },
    { content: instrument.description, name: "description" },
  ];
};

/** A reliability scale is a facet when the instrument has them, else a domain. */
const scaleName = (instrument: Instrument, scale: string) =>
  instrument.facets.find((facet) => facet.id === scale)?.name ??
  instrument.domains.find((domain) => domain.id === scale)?.name ??
  "";

const alphaRange = (instrument: Instrument) => {
  const values = instrument.evidence.reliability.flatMap((entry) =>
    entry.alpha === null ? [] : [entry.alpha]
  );

  if (values.length === 0) {
    return null;
  }

  return {
    count: values.length,
    max: Math.max(...values),
    min: Math.min(...values),
  };
};

const NotFound = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
    <h1 className="font-heading text-2xl font-semibold">Test not found</h1>
    <p className="text-muted-foreground">
      This test does not exist, or it has moved.
    </p>
    <Link className={buttonVariants()} to="/">
      See all tests
    </Link>
  </main>
);

const InstrumentPage = ({ instrument }: { instrument: Instrument }) => {
  const category = findCategory(instrument.category);
  const range = alphaRange(instrument);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-4 py-10">
      <header className="flex flex-col gap-4">
        <Link
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
          to="/"
        >
          All tests
        </Link>
        <div className="flex flex-col gap-3">
          <InstrumentAvatar avatar={instrument.avatar} className="size-16" />
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {instrument.title}
          </h1>
          <p className="text-muted-foreground max-w-prose text-pretty">
            {instrument.description}
          </p>
          <ul className="flex flex-wrap gap-2">
            {category ? (
              <li>
                <Badge variant="secondary">{category.name}</Badge>
              </li>
            ) : null}
            <li>
              <Badge variant="secondary">{instrument.items.length} items</Badge>
            </li>
            <li>
              <Badge variant="secondary">
                {instrument.info.durationMinutes.min} to{" "}
                {instrument.info.durationMinutes.max} minutes
              </Badge>
            </li>
            <li>
              <Badge variant="outline">{instrument.license}</Badge>
            </li>
          </ul>
        </div>
      </header>

      {category?.notice ? (
        <Alert>
          <AlertTitle>{category.name}</AlertTitle>
          <AlertDescription>{category.notice}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          What this test measures
        </h2>
        <p className="max-w-prose">{instrument.summary}</p>
        <p className="text-muted-foreground max-w-prose">
          {instrument.info.audience}
        </p>
        <p className="text-muted-foreground max-w-prose text-sm">
          {instrument.info.authors}, {instrument.info.year}. Original language:
          English.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          How to answer
        </h2>
        <p className="max-w-prose">{instrument.instructions}</p>
        <p className="text-muted-foreground max-w-prose">
          {instrument.info.responseScale}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          What you get
        </h2>
        <ul className="flex max-w-prose list-disc flex-col gap-1 pl-5">
          {instrument.info.whatYouGet.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          What this test is not
        </h2>
        <Alert variant="destructive">
          <AlertTitle>Please read before you start</AlertTitle>
          <AlertDescription>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {instrument.info.notFor.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Evidence
        </h2>
        <p className="text-muted-foreground max-w-prose text-sm">
          The numbers below come from the published sources listed at the end. A
          value that a source does not report is marked as not reported.
        </p>
        <p className="text-sm">
          <Link
            className="underline underline-offset-4"
            to={`/tests/${instrument.slug}/methodology`}
          >
            See every item and the scoring key
          </Link>
        </p>
        <Accordion>
          <AccordionItem value="reliability">
            <AccordionTrigger>
              Reliability
              {range ? ` (alpha ${range.min} to ${range.max})` : ""}
            </AccordionTrigger>
            <AccordionContent>
              {range ? (
                <p className="text-muted-foreground mb-3 text-sm">{`Internal consistency for ${range.count} scales, as Cronbach's alpha.`}</p>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scale</TableHead>
                    <TableHead className="text-right">Alpha</TableHead>
                    <TableHead className="text-right">Sample</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instrument.evidence.reliability.map((entry) => (
                    <TableRow key={entry.scale}>
                      <TableCell>
                        {entry.scale}{" "}
                        <span className="text-muted-foreground">
                          {scaleName(instrument, entry.scale)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.alpha === null ? "not reported" : entry.alpha}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.sampleN === null
                          ? "not reported"
                          : entry.sampleN}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="validity">
            <AccordionTrigger>Validity</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {instrument.evidence.validity.map((entry) => (
                  <li key={entry.summary}>
                    <span className="font-medium capitalize">{entry.kind}</span>
                    <p className="text-muted-foreground">{entry.summary}</p>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="norms">
            <AccordionTrigger>Norms and comparison</AccordionTrigger>
            <AccordionContent>
              <p>{instrument.reporting.note}</p>
              {instrument.norms ? null : (
                <p className="text-muted-foreground mt-2">
                  Your result is described against the scale itself, never
                  against other people.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="limitations">
            <AccordionTrigger>Limitations</AccordionTrigger>
            <AccordionContent>
              <p>
                {instrument.evidence.limitations ??
                  instrument.evidence.reason ??
                  "The source reports no limitations."}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="references">
            <AccordionTrigger>References</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {instrument.references.map((reference) => (
                  <li key={reference.id}>
                    <p>
                      {reference.authors} ({reference.year}). {reference.title}.{" "}
                      <em>{reference.source}</em>.
                    </p>
                    {reference.doi ? (
                      <a
                        className="text-sm underline underline-offset-4"
                        href={`https://doi.org/${reference.doi}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        doi:{reference.doi}
                      </a>
                    ) : (
                      <a
                        className="text-sm underline underline-offset-4"
                        href={reference.source}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {reference.source}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Privacy
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Your answers stay in this browser. When you finish, only your scores
          are saved for up to 90 days under a private code. No name, email, or
          account is needed. You can delete the stored copy. See the{" "}
          <Link className="underline underline-offset-4" to="/privacy">
            privacy page
          </Link>{" "}
          for the details.
        </p>
      </section>

      <div className="bg-background/95 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur">
        <Link
          className={buttonVariants({ size: "lg" })}
          to={`/tests/${instrument.slug}/start`}
        >
          Start the test
        </Link>
      </div>
    </main>
  );
};

const InstrumentRoute = () => {
  const { slug } = useParams();
  const instrument = slug ? findInstrument(slug) : undefined;

  if (!instrument) {
    return <NotFound />;
  }

  return <InstrumentPage instrument={instrument} />;
};

export default InstrumentRoute;
